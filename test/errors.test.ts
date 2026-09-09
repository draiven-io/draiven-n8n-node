import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	extractStatusCode,
	isDraivenShapedError,
	isTransientError,
	toDraivenError,
} from '../nodes/Draiven/GenericFunctions';
import {
	CREDENTIAL_SECRET,
	ERROR_SHAPES,
	httpError,
	makeNode,
	networkError,
	reachableText,
} from './helpers';

describe('extractStatusCode', () => {
	it.each(ERROR_SHAPES)('reads the status from a %s error', (shape) => {
		expect(extractStatusCode(httpError(404, 'Request failed', shape))).toBe(404);
	});

	it('reads a nested response.status', () => {
		expect(extractStatusCode({ response: { status: 503 } })).toBe(503);
	});

	it('coerces a string httpCode', () => {
		expect(extractStatusCode({ httpCode: '429' })).toBe(429);
	});

	it.each(ERROR_SHAPES)('returns undefined for a %s transport error', (shape) => {
		// n8n sets httpCode to the socket code ("ECONNRESET") rather than a
		// number, which must not be mistaken for an HTTP status.
		expect(extractStatusCode(networkError('ECONNRESET', shape))).toBeUndefined();
	});

	it('returns undefined for non-objects', () => {
		expect(extractStatusCode(null)).toBeUndefined();
		expect(extractStatusCode('boom')).toBeUndefined();
	});
});

describe('toDraivenError', () => {
	const node = makeNode();

	describe.each(ERROR_SHAPES)('against a %s error', (shape) => {
		it.each([
			[401, /rejected the credentials/i],
			[403, /rejected the credentials/i],
			[404, /not found/i],
			[402, /plan limit/i],
			[429, /rate-limited/i],
			[500, /backend failed/i],
			[503, /backend failed/i],
		])('maps HTTP %s to a distinct, actionable message', (status, pattern) => {
			const result = toDraivenError(node, httpError(status, 'Request failed', shape), 'submitting the question');
			expect(result.message).toMatch(pattern);
			expect(result.message).toContain('submitting the question');
		});

		it('falls back to a connectivity message when there is no status', () => {
			const result = toDraivenError(node, networkError('ECONNRESET', shape), 'loading the agent list');
			expect(result.message).toMatch(/request to Draiven failed/i);
		});
	});

	// Regression guard for the production path: n8n-core wraps every transport
	// failure in a NodeApiError before node code runs, so an `instanceof
	// NodeApiError` short-circuit silently disables classification in the only
	// environment that matters.
	it('classifies the NodeApiError that n8n-core throws instead of passing it through', () => {
		const fromN8nCore = httpError(402, 'Request failed', 'wrapped');
		expect(fromN8nCore).toBeInstanceOf(NodeApiError);

		const result = toDraivenError(node, fromN8nCore, 'submitting the question');

		expect(result).not.toBe(fromN8nCore);
		expect(result.message).toMatch(/plan limit/i);
	});

	it('returns its own shaped error unchanged when re-processed', () => {
		const once = toDraivenError(node, httpError(500), 'polling for the Draiven answer');
		expect(isDraivenShapedError(once)).toBe(true);
		expect(toDraivenError(node, once, 'polling for the Draiven answer')).toBe(once);
	});

	it('does not re-wrap an already-shaped node error', () => {
		const original = new NodeOperationError(node, 'already shaped');
		expect(toDraivenError(node, original, 'polling')).toBe(original);
	});

	it('never echoes credential material into the message', () => {
		const leaky = httpError(401, `Basic ${CREDENTIAL_SECRET}`);
		const result = toDraivenError(node, leaky, 'submitting the question');
		expect(result.message).not.toContain(CREDENTIAL_SECRET);
		expect(result.message).not.toMatch(/Basic /);
	});

	describe('credential retention', () => {
		it.each(ERROR_SHAPES)('keeps the auth header off the error it returns (%s)', (shape) => {
			const result = toDraivenError(node, httpError(401, 'Request failed', shape), 'submitting the question');

			expect(reachableText(result)).not.toContain(CREDENTIAL_SECRET);
			expect(JSON.stringify(result)).not.toContain(CREDENTIAL_SECRET);
		});

		// The path that actually retains: `NodeApiError` stores a non-Error
		// second argument verbatim as `errorResponse`, so forwarding the original
		// error object keeps the Authorization header attached to the error.
		it('does not retain a provider error handed over as a plain object', () => {
			const plainRejection = {
				httpCode: '401',
				message: 'Unauthorized',
				config: {
					url: 'https://api.draiven.io/conversations/',
					headers: { Authorization: `Basic ${CREDENTIAL_SECRET}` },
				},
			};

			const result = toDraivenError(node, plainRejection, 'submitting the question');

			expect(reachableText(result)).not.toContain(CREDENTIAL_SECRET);
		});
	});
});

describe('isTransientError', () => {
	describe.each(ERROR_SHAPES)('against a %s error', (shape) => {
		it.each([500, 502, 503, 504, 429])('treats HTTP %s as retryable', (status) => {
			expect(isTransientError(httpError(status, 'Request failed', shape))).toBe(true);
		});

		it.each([400, 401, 403, 404, 402, 422])('treats HTTP %s as fatal', (status) => {
			expect(isTransientError(httpError(status, 'Request failed', shape))).toBe(false);
		});

		it('treats a status-less transport failure as retryable', () => {
			expect(isTransientError(networkError('ECONNRESET', shape))).toBe(true);
		});
	});
});
