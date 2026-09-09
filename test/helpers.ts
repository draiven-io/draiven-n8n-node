import type { INode, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const BASE_URL = 'https://api.draiven.io';

/**
 * The secret embedded in every error fixture's request config.
 *
 * Real provider errors carry the outbound request config, which includes the
 * `Authorization` header n8n built from the API key. Tests assert this string
 * never survives into anything the operator or the logs can see.
 */
export const CREDENTIAL_SECRET = 'super-secret-api-key';
const AUTH_HEADER = `Basic ${Buffer.from(`user@example.com:${CREDENTIAL_SECRET}`).toString('base64')}`;

/**
 * The two shapes an error can have by the time node code sees it.
 *
 * `raw`     - the axios-style rejection a bare HTTP client throws.
 * `wrapped` - what n8n-core actually delivers in production: every transport
 *             failure is re-thrown as `new NodeApiError(this.getNode(), error)`
 *             before the node's catch block runs
 *             (n8n-core/dist/execution-engine/node-execution-context/utils/
 *             request-helper-functions.js:998).
 *
 * Suites run against both so a guard that only holds for hand-built fixtures
 * cannot pass while being wrong in production.
 */
export type ErrorShape = 'raw' | 'wrapped';
export const ERROR_SHAPES: readonly ErrorShape[] = ['raw', 'wrapped'];

export function makeNode(): INode {
	return {
		id: 'test-node-id',
		name: 'Draiven',
		typeVersion: 1,
		type: 'n8n-nodes-draiven.draiven',
		position: [0, 0],
		parameters: {},
	};
}

/**
 * An error shaped like the ones n8n's httpRequest helper throws.
 *
 * Carries the request config -- including the Basic auth header -- exactly as
 * a real axios rejection does, so leak assertions have something to catch.
 */
export function httpError(status: number, message = 'Request failed', shape: ErrorShape = 'raw'): Error {
	const error = new Error(message) as Error & Record<string, unknown>;
	error.isAxiosError = true;
	error.statusCode = status;
	error.status = status;
	error.response = { status, statusCode: status, data: { detail: message } };
	error.config = {
		url: `${BASE_URL}/conversations/`,
		headers: { Authorization: AUTH_HEADER },
	};

	if (shape === 'raw') return error;
	return new NodeApiError(makeNode(), error as unknown as JsonObject);
}

/** A transport-level failure, which carries no HTTP status. */
export function networkError(message = 'ECONNRESET', shape: ErrorShape = 'raw'): Error {
	const error = new Error(message) as Error & Record<string, unknown>;
	error.isAxiosError = true;
	error.code = message;
	error.config = {
		url: `${BASE_URL}/conversations/`,
		headers: { Authorization: AUTH_HEADER },
	};

	if (shape === 'raw') return error;
	return new NodeApiError(makeNode(), error as unknown as JsonObject);
}

/**
 * Every value reachable from an error by walking own enumerable properties.
 *
 * `JSON.stringify` is not sufficient on its own: `Error` defines `toJSON`, so
 * stringifying only reports the fields n8n chose to serialize and would hide a
 * secret retained on `cause` or `errorResponse`. This walks the real object
 * graph, so a credential retained anywhere on the error is caught.
 */
export function reachableText(value: unknown, seen = new Set<unknown>()): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string') return value;
	if (typeof value !== 'object') return String(value);
	if (seen.has(value)) return '';
	seen.add(value);

	const parts: string[] = [];
	if (value instanceof Error) {
		parts.push(value.message, value.stack ?? '');
	}
	for (const key of Object.getOwnPropertyNames(value)) {
		let inner: unknown;
		try {
			inner = (value as Record<string, unknown>)[key];
		} catch {
			continue;
		}
		parts.push(key, reachableText(inner, seen));
	}
	return parts.join(' ');
}

export interface MockContextOptions {
	apiUrl?: unknown;
	parameters?: Record<string, unknown>;
	inputItems?: number;
	continueOnFail?: boolean;
	request?: jest.Mock;
}

/**
 * Minimal stand-in for IExecuteFunctions / ILoadOptionsFunctions.
 *
 * Only the members the node actually touches are implemented, so an
 * accidental new dependency on the n8n runtime shows up as a test failure
 * rather than passing silently.
 */
export function makeContext(options: MockContextOptions = {}) {
	const {
		apiUrl = BASE_URL,
		parameters = {},
		inputItems = 1,
		continueOnFail = false,
		request = jest.fn(),
	} = options;

	const node = makeNode();

	return {
		helpers: {
			httpRequestWithAuthentication: request,
		},
		getNode: () => node,
		getCredentials: jest.fn(async () => ({ apiUrl })),
		getInputData: () => Array.from({ length: inputItems }, () => ({ json: {} })),
		continueOnFail: () => continueOnFail,
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) => {
			if (name in parameters) return parameters[name];
			return fallback;
		}),
	};
}

/** Build an assistant message as returned by `GET /last-ai-message`. */
export function aiMessage(id: number, overrides: Record<string, unknown> = {}) {
	return {
		id,
		conversation_id: 42,
		sender: 'AIMessage',
		content: `answer-${id}`,
		is_conclusion: true,
		additional_data: { sources: [] },
		content_type: 'html',
		created_at: '2026-01-01T00:00:00Z',
		...overrides,
	};
}
