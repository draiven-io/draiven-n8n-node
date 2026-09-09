import { DraivenApi } from '../credentials/DraivenApi.credentials';

/**
 * Evaluate the credential's `baseURL` expression the way n8n does.
 *
 * The expression string itself is the unit under test: it runs inside n8n
 * before any node code, so `normalizeApiUrl` cannot protect the credential
 * test request. Reading it back off the class keeps this suite honest if the
 * expression is ever edited.
 */
function evaluateBaseUrl(apiUrl: unknown): string {
	const expression = new DraivenApi().test.request.baseURL as string;
	const body = expression.replace(/^=\{\{/, '').replace(/\}\}$/, '');

	// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
	const evaluate = new Function('$credentials', `return (${body});`) as (
		credentials: unknown,
	) => string;

	return evaluate({ apiUrl });
}

describe('DraivenApi credential', () => {
	it('verifies against the public ping endpoint', () => {
		const { request } = new DraivenApi().test;

		expect(request.method).toBe('GET');
		expect(request.url).toBe('/ping');
	});

	it('sends the API key as Basic auth rather than a hand-built header', () => {
		const { properties } = new DraivenApi().authenticate as {
			properties: { auth?: { username: string; password: string }; headers?: unknown };
		};

		expect(properties.auth).toEqual({
			username: '={{$credentials.userEmail}}',
			password: '={{$credentials.apiKey}}',
		});
		expect(properties.headers).toBeUndefined();
	});

	it('marks the API key as a password field so the editor masks it', () => {
		const apiKey = new DraivenApi().properties.find((property) => property.name === 'apiKey');

		expect(apiKey?.typeOptions?.password).toBe(true);
	});

	describe('base URL expression', () => {
		it.each([
			['a plain URL', 'https://api.draiven.io', 'https://api.draiven.io'],
			['a trailing slash', 'https://api.draiven.io/', 'https://api.draiven.io'],
			['repeated trailing slashes', 'https://api.draiven.io///', 'https://api.draiven.io'],
			['surrounding whitespace', '  https://api.draiven.io  ', 'https://api.draiven.io'],
			['a base path', 'https://gateway.example.com/draiven/', 'https://gateway.example.com/draiven'],
			['a query string', 'https://api.draiven.io/?debug=1', 'https://api.draiven.io'],
			['a fragment', 'https://api.draiven.io/#frag', 'https://api.draiven.io'],
			['http for self-hosting', 'http://localhost:8000', 'http://localhost:8000'],
			['an uppercase HTTPS scheme', 'HTTPS://api.draiven.io', 'HTTPS://api.draiven.io'],
		])('normalizes %s', (_label, input, expected) => {
			expect(evaluateBaseUrl(input)).toBe(expected);
		});

		// An empty baseURL makes the credential test fail outright, which is the
		// safe outcome: the alternative is n8n sending Basic auth to whatever
		// the malformed value happens to address.
		it.each([
			['a non-HTTP scheme', 'ftp://api.draiven.io'],
			['a file URL', 'file:///etc/passwd'],
			['a javascript URL', 'javascript:alert(1)'],
			['embedded credentials', 'https://user:secret@evil.example.com'],
			['embedded credentials with a lookalike host', 'https://api.draiven.io@evil.example.com'],
			['a scheme-less value', 'api.draiven.io'],
			['an empty string', ''],
			['whitespace only', '   '],
			['a missing value', undefined],
		])('refuses to build a base URL from %s', (_label, input) => {
			expect(evaluateBaseUrl(input)).toBe('');
		});

		it('keeps the ping request pointed at the configured host', () => {
			const baseUrl = evaluateBaseUrl('https://api.draiven.io/');

			expect(new URL(`${baseUrl}/ping`).host).toBe('api.draiven.io');
		});
	});
});
