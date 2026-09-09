import { pollForAnswer } from '../nodes/Draiven/GenericFunctions';
import { aiMessage, BASE_URL, httpError, makeContext, networkError } from './helpers';

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
});
