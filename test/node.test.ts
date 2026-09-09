import { Draiven } from '../nodes/Draiven/Draiven.node';
import { aiMessage, BASE_URL, httpError, makeContext } from './helpers';

type Call = [string, { method: string; url: string; body?: Record<string, unknown>; headers?: Record<string, string> }];

/**
 * Await a call that must reject and hand back the error it rejected with.
 *
 * Using `.catch((e) => e)` widens the type to `Result | Error`, and a bare
 * `rejects.toThrow` cannot inspect several fields at once. This also fails
 * loudly if the call unexpectedly succeeds.
 */
async function rejection(promise: Promise<unknown>): Promise<Error & Record<string, unknown>> {
	try {
		await promise;
	} catch (error) {
		return error as Error & Record<string, unknown>;
	}
	throw new Error('Expected the call to reject, but it resolved.');
}

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

	it('rejects a non-numeric dataset ID instead of silently dropping it', async () => {
		const request = jest.fn();

		await expect(run(request, { ...baseParams, datasetIds: [4, 'sales', 7] })).rejects.toThrow(
			/sales/,
		);
		expect(request).not.toHaveBeenCalled();
	});

	it('rejects an empty dataset ID instead of substituting a phantom 0', async () => {
		const request = jest.fn();

		// `"4,,7".split(',')` is an ordinary expression result. An empty slot is
		// malformed input, not an unset option, so it must not become a real ID.
		await expect(run(request, { ...baseParams, datasetIds: ['4', '', '7'] })).rejects.toThrow(
			/Dataset ID at position 2/,
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

		await expect(run(request, baseParams)).rejects.toThrow(/no usable conversation ID/i);
	});

	// The ID is interpolated straight into the poll URL, so anything that is not
	// a positive integer builds a path that can never resolve and the node would
	// otherwise burn its whole timeout budget on 404s.
	it.each([
		['a float', 4.5],
		['zero', 0],
		['a negative number', -3],
		['a non-numeric value', 'abc'],
	])('rejects %s as a conversation ID', async (_label, conversationId) => {
		const request = jest.fn().mockResolvedValueOnce({ conversation_id: conversationId });

		await expect(run(request, baseParams)).rejects.toThrow(/no usable conversation ID/i);
		expect(request).toHaveBeenCalledTimes(1);
	});

	// `minValue` in the editor is advisory only -- these fields accept
	// expressions, so a float, a string or NaN can reach the node and would
	// otherwise be coerced into a nonsensical deadline.
	it.each([
		['Timeout (Seconds)', { timeout: '30 seconds' }],
		['Timeout (Seconds)', { timeout: 1.5 }],
		['Poll Interval (Seconds)', { pollInterval: 0 }],
		['Conversation ID', { conversationId: 4.2 }],
		['Conversation ID', { conversationId: -1 }],
	])('rejects an invalid %s option before calling the API', async (name, options) => {
		const request = jest.fn();

		const thrown = await rejection(run(request, { ...baseParams, options }));

		expect(thrown.message).toContain(name);
		expect(thrown.message).toMatch(/must be a whole number/i);
		expect(request).not.toHaveBeenCalled();
	});

	describe('when the backend reports an error message', () => {
		const backendText = 'Query failed: column "revenu" does not exist in table finance.sales';

		const failingRequest = () =>
			jest
				.fn()
				.mockResolvedValueOnce(submitOk)
				.mockResolvedValueOnce(
					aiMessage(7, { content: backendText, additional_data: { error: true } }),
				);

		// The thrown error reaches editor toasts and workflow logs, which are
		// shared far more widely than the item output.
		it('keeps the raw backend text out of the thrown error', async () => {
			const thrown = await rejection(run(failingRequest(), baseParams));

			expect(thrown.message).toMatch(/failed to answer the question/i);
			expect(thrown.message).not.toContain(backendText);
			expect(String(thrown.description ?? '')).not.toContain(backendText);
		});

		// A Continue On Fail branch cannot route or retry on "success: false"
		// alone -- it needs to know which conversation failed and why.
		it('keeps the diagnostics on the failed item', async () => {
			const result = await run(failingRequest(), baseParams, { continueOnFail: true });

			expect(result[0][0].json).toMatchObject({
				success: false,
				conversationId: 42,
				backendMessage: backendText,
			});
			expect(result[0][0].json.description).toEqual(expect.stringContaining('conversation 42'));
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});
	});

	it('records the conversation ID on the failed item even when polling times out', async () => {
		const request = jest.fn().mockResolvedValueOnce(submitOk).mockResolvedValue(null);

		const result = await run(request, { ...baseParams, options: { timeout: 5 } }, { continueOnFail: true });

		expect(result[0][0].json).toMatchObject({ success: false, conversationId: 42 });
		expect(result[0][0].json.error).toMatch(/did not return an answer/i);
	});
});

describe('Draiven node loadOptions', () => {
	const cases = [
		{ method: 'getDatasets' as const, path: '/datasets/', context: /dataset list/i },
		{ method: 'getAgents' as const, path: '/agents/', context: /agent list/i },
	];

	describe.each(cases)('$method', ({ method, path, context }) => {
		const load = (request: jest.Mock, extra: { apiUrl?: unknown } = {}) => {
			const ctx = makeContext({ request, ...extra });
			return new Draiven().methods.loadOptions[method].call(ctx as never);
		};

		// A missing trailing slash makes the backend answer with a redirect,
		// which drops the Authorization header on the follow-up request.
		it(`requests ${path} with its trailing slash`, async () => {
			const request = jest.fn().mockResolvedValue([]);

			await load(request);

			const [credentialType, options] = request.mock.calls[0] as Call;
			expect(credentialType).toBe('draivenApi');
			expect(options.method).toBe('GET');
			expect(options.url).toBe(`${BASE_URL}${path}`);
		});

		it('maps each entry to a name/value pair for the dropdown', async () => {
			const request = jest.fn().mockResolvedValue([
				{ id: 1, name: 'Alpha', description: 'first' },
				{ id: 2, name: 'Beta' },
			]);

			await expect(load(request)).resolves.toEqual([
				{ name: 'Alpha', value: 1, description: 'first' },
				{ name: 'Beta', value: 2, description: undefined },
			]);
		});

		// An error payload or a paginated envelope must render as an empty
		// dropdown rather than throwing inside the editor.
		it.each([
			['an empty list', []],
			['null', null],
			['an object envelope', { items: [] }],
			['a string', 'unexpected'],
		])('returns no options for %s', async (_label, payload) => {
			const request = jest.fn().mockResolvedValue(payload);

			await expect(load(request)).resolves.toEqual([]);
		});

		it('normalizes a provider failure into an actionable message', async () => {
			const request = jest.fn().mockRejectedValue(httpError(401, 'Request failed', 'wrapped'));

			const thrown = await rejection(load(request));

			expect(thrown.message).toMatch(/rejected the credentials/i);
			expect(thrown.message).toMatch(context);
		});

	it('rejects an invalid API URL before calling the API', async () => {
			const request = jest.fn();

			await expect(load(request, { apiUrl: 'not-a-url' })).rejects.toThrow(/not a valid URL/i);
			expect(request).not.toHaveBeenCalled();
		});
	});
});
