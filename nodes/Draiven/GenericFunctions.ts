import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INode,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

/** Name of the credential type consumed by this node. */
export const DRAIVEN_CREDENTIAL_TYPE = 'draivenApi';

/**
 * Lower bound for the poll interval, in milliseconds.
 *
 * Polling counts against the backend's `check_plan_limit("requests")` budget,
 * so we refuse to hammer it regardless of what the user configures.
 */
export const MIN_POLL_INTERVAL_MS = 2000;

/** Maximum consecutive transient failures tolerated while polling. */
export const MAX_TRANSIENT_FAILURES = 5;

/**
 * Ceiling for a single backoff sleep, in milliseconds.
 *
 * Without a cap, exponential backoff can consume most of the timeout budget in
 * one sleep, which both delays the answer once the backend recovers and makes
 * the consecutive-failure guard unreachable.
 */
export const MAX_BACKOFF_MS = 30_000;

/**
 * Ceiling for a single HTTP request, in milliseconds.
 *
 * Without it, a connection that opens and then stalls never rejects, so the
 * poll loop's deadline check is never reached again and the node hangs well
 * past the user's configured timeout.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Marks an error as already shaped by this module.
 *
 * Defined non-enumerably so it never reaches n8n's execution data or any log
 * line, and keyed off a symbol so it cannot collide with provider payloads.
 */
const DRAIVEN_SHAPED_ERROR = Symbol.for('draiven.shapedError');

/** Tag an error as ours, so `toDraivenError` will not re-wrap it. */
function markShaped<E extends Error>(error: E): E {
	Object.defineProperty(error, DRAIVEN_SHAPED_ERROR, {
		value: true,
		enumerable: false,
		writable: false,
		configurable: false,
	});
	return error;
}

/**
 * True only for errors this module produced.
 *
 * Deliberately *not* an `instanceof NodeApiError` check: n8n-core wraps every
 * transport failure in a `NodeApiError` before we ever see it, so keying off
 * the class would short-circuit classification for real provider errors and
 * hand the operator n8n's generic text instead of an actionable message.
 */
export function isDraivenShapedError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		(error as Record<symbol, unknown>)[DRAIVEN_SHAPED_ERROR] === true
	);
}

/** Shape returned by `POST /conversations/`. */
export interface ConversationSubmitResponse {
	id: number;
	conversation_id: number;
	execution_id: string;
	status: string;
}

/** Shape returned by `GET /conversations/{id}/last-ai-message` when populated. */
export interface ConversationMessage {
	id: number;
	conversation_id: number;
	sender: string;
	content: string;
	is_conclusion?: boolean;
	favorite?: boolean;
	additional_data?: IDataObject | null;
	content_type?: string | null;
	created_at?: string;
}

type DraivenContext = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Validate and normalize the credential's base API URL.
 *
 * Enforces an absolute `http(s)` URL and strips trailing slashes so that
 * later path joins (`${base}/agents/`) can never retarget the host or
 * produce a double slash that FastAPI would answer with a redirect.
 *
 * Rejecting embedded userinfo (`https://user:pass@host`) keeps credentials
 * out of request URLs, which are far more likely to be logged than headers.
 */
export function normalizeApiUrl(rawUrl: unknown, node: INode): string {
	if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
		throw new NodeOperationError(
			node,
			'The Draiven credential is missing an API URL.',
			{ description: 'Set "API URL" on the Draiven API credential, for example https://api.draiven.io.' },
		);
	}

	const trimmed = rawUrl.trim();

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		throw new NodeOperationError(node, `The Draiven API URL "${trimmed}" is not a valid URL.`, {
			description: 'Include the scheme, for example https://api.draiven.io.',
		});
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new NodeOperationError(
			node,
			`The Draiven API URL must use http or https, but got "${parsed.protocol}".`,
			{ description: 'Use an absolute URL such as https://api.draiven.io.' },
		);
	}

	if (parsed.username !== '' || parsed.password !== '') {
		throw new NodeOperationError(
			node,
			'The Draiven API URL must not embed credentials.',
			{
				description:
					'Remove the "user:password@" portion from the API URL. Provide the email and API key in the credential fields instead.',
			},
		);
	}

	// Drop query/fragment: this value is only ever used as a path prefix.
	parsed.search = '';
	parsed.hash = '';

	return parsed.toString().replace(/\/+$/, '');
}

/**
 * Read the base URL from the credential.
 *
 * Deliberately reads *only* `apiUrl`. The email and API key are never touched
 * by node code: `httpRequestWithAuthentication` lets n8n inject the Basic auth
 * header from the credential definition, so the secret cannot leak through a
 * log line, an error object, or the node's output.
 */
export async function getDraivenBaseUrl(ctx: DraivenContext): Promise<string> {
	const credentials = await ctx.getCredentials(DRAIVEN_CREDENTIAL_TYPE);
	return normalizeApiUrl(credentials?.apiUrl, ctx.getNode());
}

/** Best-effort extraction of an HTTP status code from an n8n/axios-shaped error. */
export function extractStatusCode(error: unknown): number | undefined {
	if (typeof error !== 'object' || error === null) return undefined;

	const candidate = error as {
		httpCode?: unknown;
		statusCode?: unknown;
		status?: unknown;
		code?: unknown;
		response?: { status?: unknown; statusCode?: unknown };
	};

	const raw =
		candidate.httpCode ??
		candidate.statusCode ??
		candidate.status ??
		candidate.response?.status ??
		candidate.response?.statusCode;

	const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw;
	return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Map a transport failure onto an operator-actionable node error.
 *
 * Distinguishing these classes is what turns "the node failed" into
 * "the node failed and here is what to do about it".
 */
export function toDraivenError(node: INode, error: unknown, context: string): Error {
	// Short-circuit only on errors we produced ourselves: our own classified
	// API errors, and our own validation/timeout throws. Anything else --
	// including the NodeApiError that n8n-core throws for every transport
	// failure -- must fall through and be classified.
	if (isDraivenShapedError(error) || error instanceof NodeOperationError) {
		return error as Error;
	}

	const status = extractStatusCode(error);

	let message: string;
	let description: string;

	switch (true) {
		case status === 401 || status === 403:
			message = `Draiven rejected the credentials while ${context}.`;
			description =
				'Check the email and API key on the Draiven API credential, and confirm the key is still active in Settings > API Keys.';
			break;
		case status === 404:
			message = `Draiven returned "not found" while ${context}.`;
			description =
				'The resource does not exist or is not visible to this API key. Verify the conversation, dataset and agent IDs.';
			break;
		case status === 402:
			message = `Draiven refused the request while ${context}: plan limit reached.`;
			description = 'Your Draiven plan quota is exhausted. Upgrade the plan or wait for the quota to reset.';
			break;
		case status === 429:
			message = `Draiven rate-limited the request while ${context}.`;
			description = 'Too many requests. Increase the poll interval or retry later.';
			break;
		case status !== undefined && status >= 500:
			message = `The Draiven backend failed (HTTP ${status}) while ${context}.`;
			description = 'This is a server-side error. Retry shortly; if it persists, contact Draiven support.';
			break;
		default:
			message = `The request to Draiven failed while ${context}.`;
			description =
				'Check that the API URL is reachable from this n8n instance and that the network path allows outbound HTTPS.';
	}

	// Build the error from a plain object holding only text we wrote ourselves.
	//
	// The original error is deliberately discarded rather than forwarded: n8n
	// retains whatever is handed to `NodeApiError` (as `cause` for Error-shaped
	// input, as `errorResponse` for object-shaped input), and a provider error
	// carries the request config -- including the `Authorization: Basic ...`
	// header built from the API key. Passing it through in any form would keep
	// that credential attached to the error object.
	const safeResponse: JsonObject = { message };
	if (status !== undefined) {
		safeResponse.httpCode = String(status);
	}

	return markShaped(
		new NodeApiError(node, safeResponse, {
			message,
			description,
			httpCode: status !== undefined ? String(status) : undefined,
		}),
	);
}

/**
 * A failure worth retrying: a transport-level blip, a rate limit, or a 5xx.
 *
 * A 4xx other than 429 reflects a request that will fail identically on retry,
 * so we surface it immediately instead of burning the timeout budget.
 */
export function isTransientError(error: unknown): boolean {
	const status = extractStatusCode(error);
	if (status === undefined) return true; // network / socket level
	if (status === 429) return true;
	return status >= 500;
}

/** Promise-based sleep. */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Perform an authenticated request against the Draiven API.
 *
 * Auth is applied by n8n from the credential definition; this function never
 * sees or forwards the API key.
 */
export async function draivenApiRequest<T = unknown>(
	ctx: DraivenContext,
	method: IHttpRequestMethods,
	baseUrl: string,
	path: string,
	body?: IDataObject,
	timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<T> {
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		headers: { 'Content-Type': 'application/json' },
		json: true,
		// Floored at 1ms on purpose: the underlying HTTP client treats 0 as
		// "no timeout", which is precisely the hang this guards against.
		timeout: Math.max(1, Math.floor(timeoutMs)),
	};

	if (body !== undefined) {
		options.body = body;
	}

	return (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		DRAIVEN_CREDENTIAL_TYPE,
		options,
	)) as T;
}

/**
 * Fetch the current last AI message, tolerating the "no message yet" null.
 */
export async function fetchLastAiMessage(
	ctx: DraivenContext,
	baseUrl: string,
	conversationId: number,
	timeoutMs?: number,
): Promise<ConversationMessage | null> {
	const response = await draivenApiRequest<ConversationMessage | null>(
		ctx,
		'GET',
		baseUrl,
		`/conversations/${conversationId}/last-ai-message`,
		undefined,
		timeoutMs,
	);

	return response ?? null;
}

/** True when the backend flagged this assistant message as an orchestration failure. */
export function isErrorMessage(message: ConversationMessage): boolean {
	return message.additional_data?.error === true;
}

export interface PollOptions {
	conversationId: number;
	timeoutMs: number;
	pollIntervalMs: number;
	/**
	 * Message id that already existed before the question was submitted.
	 *
	 * When continuing a conversation the previous turn's answer is still the
	 * "last AI message", so polling for merely non-null would return a stale
	 * answer instantly. Anchoring on the prior id makes the loop wait for a
	 * genuinely new message.
	 */
	baselineMessageId: number | null;
}

/**
 * Poll `last-ai-message` until a new assistant message appears.
 *
 * Bounded by `timeoutMs`, resilient to transient transport failures, and
 * explicit about which of the two very different "no answer" outcomes occurred.
 */
export async function pollForAnswer(
	ctx: DraivenContext,
	baseUrl: string,
	options: PollOptions,
): Promise<ConversationMessage> {
	const node = ctx.getNode();
	const { conversationId, timeoutMs, baselineMessageId } = options;
	const pollIntervalMs = Math.max(options.pollIntervalMs, MIN_POLL_INTERVAL_MS);

	const deadline = Date.now() + timeoutMs;
	let consecutiveFailures = 0;

	while (Date.now() < deadline) {
		const remaining = deadline - Date.now();
		await sleep(Math.min(pollIntervalMs, Math.max(remaining, 0)));

		// The sleep above can consume the entire remaining budget. Without this
		// check the loop would issue one more request after the deadline had
		// already passed, and that request could then hang unbounded.
		const budget = deadline - Date.now();
		if (budget <= 0) break;

		let message: ConversationMessage | null;
		try {
			message = await fetchLastAiMessage(
				ctx,
				baseUrl,
				conversationId,
				Math.min(budget, DEFAULT_REQUEST_TIMEOUT_MS),
			);
			consecutiveFailures = 0;
		} catch (error) {
			if (!isTransientError(error)) {
				throw toDraivenError(node, error, 'polling for the Draiven answer');
			}

			consecutiveFailures += 1;
			if (consecutiveFailures >= MAX_TRANSIENT_FAILURES) {
				throw toDraivenError(
					node,
					error,
					`polling for the Draiven answer (${consecutiveFailures} consecutive transient failures)`,
				);
			}

			// Exponential backoff, capped per-sleep and by the overall deadline.
			const backoff = Math.min(pollIntervalMs * 2 ** consecutiveFailures, MAX_BACKOFF_MS);
			await sleep(Math.min(backoff, Math.max(deadline - Date.now(), 0)));
			continue;
		}

		if (message !== null && message.id !== baselineMessageId) {
			return message;
		}
	}

	throw new NodeOperationError(
		node,
		`Draiven did not return an answer within ${Math.round(timeoutMs / 1000)}s.`,
		{
			description:
				`The conversation (ID ${conversationId}) is still processing. Increase "Timeout" in the node options, or fetch the answer later with GET /conversations/${conversationId}/last-ai-message.`,
		},
	);
}
