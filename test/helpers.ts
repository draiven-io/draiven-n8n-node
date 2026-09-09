import type { INode } from 'n8n-workflow';

export const BASE_URL = 'https://api.draiven.io';

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

/** An error shaped like the ones n8n's httpRequest helper throws. */
export function httpError(status: number, message = 'Request failed'): Error {
	const error = new Error(message) as Error & { statusCode: number; response: { status: number } };
	error.statusCode = status;
	error.response = { status };
	return error;
}

/** A transport-level failure, which carries no HTTP status. */
export function networkError(message = 'ECONNRESET'): Error {
	return new Error(message);
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
