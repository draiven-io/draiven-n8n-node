import { DEFAULT_REQUEST_TIMEOUT_MS, pollForAnswer } from '../nodes/Draiven/GenericFunctions';
import { aiMessage, BASE_URL, httpError, makeContext, networkError } from './helpers';

/** The options object handed to `httpRequestWithAuthentication`. */
type RequestOptions = { timeout: number; url: string };

/** Read the request options from each recorded call. */
function requestOptions(request: jest.Mock): RequestOptions[] {
	return request.mock.calls.map((call) => call[1] as RequestOptions);
}

describe('pollForAnswer', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const poll = (
		request: jest.Mock,
		overrides: Partial<{
			timeoutMs: number;
			pollIntervalMs: number;
			baselineMessageId: number | null;
		}> = {},
	) => {
		const ctx = makeContext({ request });
		return pollForAnswer(ctx as never, BASE_URL, {
			conversationId: 42,
			timeoutMs: 60_000,
			pollIntervalMs: 2000,
			baselineMessageId: null,
			...overrides,
		});
	};

	it('waits through null responses and returns the first answer', async () => {
		const request = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(aiMessage(7));

		const promise = poll(request);
		await jest.advanceTimersByTimeAsync(4000);

		await expect(promise).resolves.toMatchObject({ id: 7, content: 'answer-7' });
		expect(request).toHaveBeenCalledTimes(2);
	});

	// Continuing a conversation means the previous turn's answer is already the
	// "last AI message". Without the baseline anchor the node would return that
	// stale answer immediately and multi-turn workflows would silently repeat.
	it('ignores the pre-existing answer and waits for a genuinely new message', async () => {
		const request = jest
			.fn()
			.mockResolvedValueOnce(aiMessage(5))
			.mockResolvedValueOnce(aiMessage(5))
			.mockResolvedValueOnce(aiMessage(9));

		const promise = poll(request, { baselineMessageId: 5 });
		await jest.advanceTimersByTimeAsync(6000);

		await expect(promise).resolves.toMatchObject({ id: 9 });
		expect(request).toHaveBeenCalledTimes(3);
	});

	it('never polls faster than the 2 second floor, even if configured lower', async () => {
		const request = jest.fn().mockResolvedValue(aiMessage(1));

		const promise = poll(request, { pollIntervalMs: 10 });

		await jest.advanceTimersByTimeAsync(1500);
		expect(request).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(600);
		expect(request).toHaveBeenCalledTimes(1);

		await expect(promise).resolves.toMatchObject({ id: 1 });
	});

	it('retries a transient 503 and then succeeds', async () => {
		const request = jest
			.fn()
			.mockRejectedValueOnce(httpError(503))
			.mockResolvedValueOnce(aiMessage(3));

		const promise = poll(request);
		await jest.advanceTimersByTimeAsync(10_000);

		await expect(promise).resolves.toMatchObject({ id: 3 });
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('retries a status-less network failure', async () => {
		const request = jest
			.fn()
			.mockRejectedValueOnce(networkError())
			.mockResolvedValueOnce(aiMessage(4));

		const promise = poll(request);
		await jest.advanceTimersByTimeAsync(10_000);

		await expect(promise).resolves.toMatchObject({ id: 4 });
	});

	it('fails immediately on an auth error instead of burning the timeout', async () => {
		const request = jest.fn().mockRejectedValue(httpError(401));

		const promise = poll(request);
		const assertion = expect(promise).rejects.toThrow(/rejected the credentials/i);

		await jest.advanceTimersByTimeAsync(2500);
		await assertion;

		expect(request).toHaveBeenCalledTimes(1);
	});

	// Needs a timeout generous enough that the failure counter, not the deadline,
	// is what stops the loop. The per-sleep backoff cap keeps this branch
	// reachable instead of letting one long sleep exhaust the budget first.
	it('gives up after repeated transient failures', async () => {
		const request = jest.fn().mockRejectedValue(httpError(502));

		const promise = poll(request, { timeoutMs: 600_000 });
		const assertion = expect(promise).rejects.toThrow(/consecutive transient failures/i);

		await jest.advanceTimersByTimeAsync(300_000);
		await assertion;

		expect(request).toHaveBeenCalledTimes(5);
	});

	it('raises a distinct timeout error naming the conversation', async () => {
		const request = jest.fn().mockResolvedValue(null);

		const promise = poll(request, { timeoutMs: 5000 });
		const assertion = expect(promise).rejects.toThrow(/did not return an answer within 5s/i);

		await jest.advanceTimersByTimeAsync(6000);
		await assertion;
	});

	it('mentions how to recover the answer after a timeout', async () => {
		const request = jest.fn().mockResolvedValue(null);

		const promise = poll(request, { timeoutMs: 5000 });
		const assertion = expect(promise).rejects.toThrow(
			expect.objectContaining({
				description: expect.stringContaining('/conversations/42/last-ai-message'),
			}) as unknown as Error,
		);

		await jest.advanceTimersByTimeAsync(6000);
		await assertion;
	});

	// Without a per-request timeout the node inherits the HTTP client's default,
	// which is "wait forever". A single stalled socket then pins the workflow
	// open indefinitely and the node's own timeout never gets to fire.
	describe('request deadlines', () => {
		it('bounds every poll request with a timeout', async () => {
			const request = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(aiMessage(2));

			const promise = poll(request);
			await jest.advanceTimersByTimeAsync(4000);
			await promise;

			expect(requestOptions(request)).not.toHaveLength(0);
			for (const options of requestOptions(request)) {
				expect(options.timeout).toBeGreaterThan(0);
				expect(options.timeout).toBeLessThanOrEqual(DEFAULT_REQUEST_TIMEOUT_MS);
			}
		});

		it('never lets one request outlive the remaining budget', async () => {
			const request = jest.fn().mockResolvedValue(null);

			const promise = poll(request, { timeoutMs: 5000 });
			const assertion = expect(promise).rejects.toThrow(/did not return an answer/i);

			await jest.advanceTimersByTimeAsync(6000);
			await assertion;

			for (const options of requestOptions(request)) {
				expect(options.timeout).toBeLessThanOrEqual(5000);
			}
		});

		// End-to-end proof that the timeout is not merely set but effective: the
		// mock honours it the way a real client does, so a permanently stalled
		// endpoint ends in the node's own timeout instead of hanging forever.
		it('times out instead of hanging when every request stalls', async () => {
			const request = jest.fn(
				(_credentialType: string, options: RequestOptions) =>
					new Promise((_resolve, reject) => {
						// Model the client faithfully: given no usable timeout it
						// waits forever, so omitting one hangs this test rather
						// than quietly passing.
						if (!Number.isFinite(options.timeout) || options.timeout <= 0) return;
						setTimeout(() => reject(networkError('ETIMEDOUT')), options.timeout);
					}),
			);

			const promise = poll(request as unknown as jest.Mock, { timeoutMs: 20_000 });
			const assertion = expect(promise).rejects.toThrow(/did not return an answer within 20s/i);

			await jest.advanceTimersByTimeAsync(120_000);
			await assertion;
		});
	});

	// With an uncapped doubling backoff and a 10s interval the waits become
	// 20s, 40s, 80s, 160s, so the fifth attempt lands ~5 minutes out and the
	// deadline always fires first -- the failure guard becomes dead code.
	it('caps backoff so the consecutive-failure guard stays reachable', async () => {
		const request = jest.fn().mockRejectedValue(httpError(502));

		const promise = poll(request, { timeoutMs: 600_000, pollIntervalMs: 10_000 });
		const assertion = expect(promise).rejects.toThrow(/consecutive transient failures/i);

		await jest.advanceTimersByTimeAsync(200_000);
		await assertion;

		expect(request).toHaveBeenCalledTimes(5);
	});
});
