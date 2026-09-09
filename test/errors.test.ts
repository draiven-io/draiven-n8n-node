import { NodeOperationError } from 'n8n-workflow';

import {
	extractStatusCode,
	isTransientError,
	toDraivenError,
} from '../nodes/Draiven/GenericFunctions';
import { httpError, makeNode, networkError } from './helpers';

describe('extractStatusCode', () => {
	it('reads statusCode from an n8n-shaped error', () => {
		expect(extractStatusCode(httpError(404))).toBe(404);
	});

	it('reads a nested response.status', () => {
		expect(extractStatusCode({ response: { status: 503 } })).toBe(503);
	});

	it('coerces a string httpCode', () => {
		expect(extractStatusCode({ httpCode: '429' })).toBe(429);
	});

	it('returns undefined for a transport error with no status', () => {
		expect(extractStatusCode(networkError())).toBeUndefined();
	});

	it('returns undefined for non-objects', () => {
		expect(extractStatusCode(null)).toBeUndefined();
		expect(extractStatusCode('boom')).toBeUndefined();
	});
});

describe('toDraivenError', () => {
	const node = makeNode();

	it.each([
		[401, /rejected the credentials/i],
		[403, /rejected the credentials/i],
		[404, /not found/i],
		[402, /plan limit/i],
		[429, /rate-limited/i],
		[500, /backend failed/i],
		[503, /backend failed/i],
	])('maps HTTP %s to a distinct, actionable message', (status, pattern) => {
		const result = toDraivenError(node, httpError(status), 'submitting the question');
		expect(result.message).toMatch(pattern);
		expect(result.message).toContain('submitting the question');
	});

	it('falls back to a connectivity message when there is no status', () => {
		const result = toDraivenError(node, networkError(), 'loading the agent list');
		expect(result.message).toMatch(/request to Draiven failed/i);
	});

	it('does not re-wrap an already-shaped node error', () => {
		const original = new NodeOperationError(node, 'already shaped');
		expect(toDraivenError(node, original, 'polling')).toBe(original);
	});

	it('never echoes credential material into the message', () => {
		const leaky = httpError(401, 'Basic ZW1haWw6c3VwZXItc2VjcmV0');
		const result = toDraivenError(node, leaky, 'submitting the question');
		expect(result.message).not.toContain('ZW1haWw6c3VwZXItc2VjcmV0');
		expect(result.message).not.toMatch(/Basic /);
	});
});

describe('isTransientError', () => {
	it.each([500, 502, 503, 504, 429])('treats HTTP %s as retryable', (status) => {
		expect(isTransientError(httpError(status))).toBe(true);
	});

	it.each([400, 401, 403, 404, 402, 422])('treats HTTP %s as fatal', (status) => {
		expect(isTransientError(httpError(status))).toBe(false);
	});

	it('treats a status-less transport failure as retryable', () => {
		expect(isTransientError(networkError())).toBe(true);
	});
});
