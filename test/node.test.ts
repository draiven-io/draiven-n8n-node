import { Draiven } from '../nodes/Draiven/Draiven.node';
import { aiMessage, BASE_URL, httpError, makeContext } from './helpers';

type Call = [string, { method: string; url: string; body?: Record<string, unknown>; headers?: Record<string, string> }];

describe('Draiven node execute', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const run = async (
		request: jest.Mock,
		parameters: Record<string, unknown>,
		extra: { continueOnFail?: boolean; apiUrl?: unknown } = {},
	) => {
		const ctx = makeContext({ request, parameters, ...extra });
		const node = new Draiven();
		const promise = node.execute.call(ctx as never);

		// Capture the outcome before advancing timers. Otherwise a rejection that
		// happens while the fake clock runs has no handler attached yet and
		// surfaces as an unhandled rejection instead of a test assertion.
		const settled = promise.then(
			(value) => ({ ok: true as const, value }),
			(error: unknown) => ({ ok: false as const, error }),
		);

		await jest.advanceTimersByTimeAsync(20_000);

		const outcome = await settled;
		if (!outcome.ok) throw outcome.error;
		return outcome.value;
	};

	const baseParams = {
		operation: 'askQuestion',
		question: 'What is revenue?',
		datasetIds: [1, 2],
		agentId: 5,
		options: {},
	};

	const submitOk = { conversation_id: 42, id: 42, execution_id: 'exec-1', status: 'processing' };

	it('submits the question and returns the answer, conversation ID and additional data', async () => {
		const request = jest
			.fn()
			.mockResolvedValueOnce(submitOk)
			.mockResolvedValueOnce(aiMessage(7, { additional_data: { sources: ['ds-1'] } }));

		const result = await run(request, baseParams);

		expect(result[0][0].json).toMatchObject({
			success: true,
			conversationId: 42,
			answer: 'answer-7',
			additionalData: { sources: ['ds-1'] },
			question: 'What is revenue?',
		});
	});

	it('posts to /conversations/ with only the API-key-supported fields', async () => {
		const request = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValueOnce(aiMessage(7));

		await run(request, baseParams);

		const [credentialType, options] = request.mock.calls[0] as Call;
		expect(credentialType).toBe('draivenApi');
		expect(options.method).toBe('POST');
		expect(options.url).toBe(`${BASE_URL}/conversations/`);
		expect(options.body).toEqual({
			question: 'What is revenue?',
			dataset_ids: [1, 2],
			agent_id: 5,
		});

		// Fields the API-key surface does not accept must never be sent.
		for (const forbidden of [
			'agent_ids',
			'collaboration_mode',
			'attachment_urls',
			'attachment_content_types',
			'attachment_text_contents',
			'attachment_file_base64_contents',
		]) {
			expect(options.body).not.toHaveProperty(forbidden);
		}
	});

	it('never builds an Authorization header itself', async () => {
		const request = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValueOnce(aiMessage(7));

		await run(request, baseParams);

		for (const [, options] of request.mock.calls as Call[]) {
			const headerNames = Object.keys(options.headers ?? {}).map((h) => h.toLowerCase());
			expect(headerNames).not.toContain('authorization');
		}
	});

	it('includes sql_mode only when the option is set', async () => {
		const withSql = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValueOnce(aiMessage(7));
		await run(withSql, { ...baseParams, options: { sqlMode: true } });
		expect((withSql.mock.calls[0] as Call)[1].body).toMatchObject({ sql_mode: true });

		const withoutSql = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValueOnce(aiMessage(7));
		await run(withoutSql, baseParams);
		expect((withoutSql.mock.calls[0] as Call)[1].body).not.toHaveProperty('sql_mode');
	});

	it('omits agent_id when no agent is selected', async () => {
		const request = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValueOnce(aiMessage(7));

		await run(request, { ...baseParams, agentId: '' });

		expect((request.mock.calls[0] as Call)[1].body).not.toHaveProperty('agent_id');
	});

	it('reads the existing answer before submitting when continuing a conversation', async () => {
		const request = jest
			.fn()
			.mockResolvedValueOnce(aiMessage(5)) // baseline probe
			.mockResolvedValueOnce(submitOk) // submit
			.mockResolvedValueOnce(aiMessage(5)) // stale answer, must be skipped
			.mockResolvedValueOnce(aiMessage(11)); // the new answer

		const result = await run(request, { ...baseParams, options: { conversationId: 42 } });

		const calls = request.mock.calls as Call[];
		expect(calls[0][1].method).toBe('GET');
		expect(calls[0][1].url).toBe(`${BASE_URL}/conversations/42/last-ai-message`);
		expect(calls[1][1].method).toBe('POST');
		expect(calls[1][1].body).toMatchObject({ conversation_id: 42 });

		expect(result[0][0].json).toMatchObject({ answer: 'answer-11', messageId: 11 });
	});

	it('fails the item when the backend flags the message as an error', async () => {
		const request = jest
			.fn()
			.mockResolvedValueOnce(submitOk)
			.mockResolvedValueOnce(
				aiMessage(7, {
					content: 'An error occurred while processing your request.',
					additional_data: { error: true },
				}),
			);

		await expect(run(request, baseParams)).rejects.toThrow(/failed to answer the question/i);
	});

	it('returns an error item instead of throwing when Continue On Fail is enabled', async () => {
		const request = jest
			.fn()
			.mockResolvedValueOnce(submitOk)
			.mockResolvedValueOnce(aiMessage(7, { additional_data: { error: true } }));

		const result = await run(request, baseParams, { continueOnFail: true });

		expect(result[0][0].json).toMatchObject({ success: false });
		expect(result[0][0].json.error).toMatch(/failed to answer the question/i);
	});

	it('surfaces an auth failure from the submit call', async () => {
		const request = jest.fn().mockRejectedValue(httpError(401));

		await expect(run(request, baseParams)).rejects.toThrow(/rejected the credentials/i);
	});

	it('rejects an empty question before calling the API', async () => {
		const request = jest.fn();

		await expect(run(request, { ...baseParams, question: '   ' })).rejects.toThrow(
			/"Question" parameter is empty/i,
		);
		expect(request).not.toHaveBeenCalled();
	});

	it('rejects an invalid API URL before calling the API', async () => {
		const request = jest.fn();

		await expect(run(request, baseParams, { apiUrl: 'not-a-url' })).rejects.toThrow(
			/not a valid URL/i,
		);
		expect(request).not.toHaveBeenCalled();
	});

	it('fails clearly when the submit response carries no conversation ID', async () => {
		const request = jest.fn().mockResolvedValueOnce({ status: 'processing' });

		await expect(run(request, baseParams)).rejects.toThrow(/no conversation ID/i);
	});
});
