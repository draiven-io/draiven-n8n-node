import { normalizeApiUrl } from '../nodes/Draiven/GenericFunctions';
import { makeNode } from './helpers';

describe('normalizeApiUrl', () => {
	const node = makeNode();

	it('accepts a plain https base URL unchanged', () => {
		expect(normalizeApiUrl('https://api.draiven.io', node)).toBe('https://api.draiven.io');
	});

	it('strips a single trailing slash', () => {
		expect(normalizeApiUrl('https://api.draiven.io/', node)).toBe('https://api.draiven.io');
	});

	it('strips repeated trailing slashes', () => {
		expect(normalizeApiUrl('https://api.draiven.io///', node)).toBe('https://api.draiven.io');
	});

	it('preserves a base path while stripping its trailing slash', () => {
		expect(normalizeApiUrl('https://gateway.example.com/draiven/', node)).toBe(
			'https://gateway.example.com/draiven',
		);
	});

	it('trims surrounding whitespace', () => {
		expect(normalizeApiUrl('  https://api.draiven.io  ', node)).toBe('https://api.draiven.io');
	});

	it('allows http for self-hosted deployments', () => {
		expect(normalizeApiUrl('http://localhost:8000', node)).toBe('http://localhost:8000');
	});

	it('discards query and fragment so they cannot leak into every request', () => {
		expect(normalizeApiUrl('https://api.draiven.io/?debug=1#frag', node)).toBe(
			'https://api.draiven.io',
		);
	});

	it.each([
		['an empty string', ''],
		['whitespace only', '   '],
		['a missing value', undefined],
		['a non-string value', 42],
	])('rejects %s', (_label, value) => {
		expect(() => normalizeApiUrl(value, node)).toThrow(/API URL/i);
	});

	it('rejects a URL without a scheme rather than guessing one', () => {
		expect(() => normalizeApiUrl('api.draiven.io', node)).toThrow(/not a valid URL/i);
	});

	it('rejects a non-http scheme', () => {
		expect(() => normalizeApiUrl('ftp://api.draiven.io', node)).toThrow(/http or https/i);
	});

	it('rejects credentials embedded in the URL', () => {
		expect(() => normalizeApiUrl('https://user:secret@api.draiven.io', node)).toThrow(
			/must not embed credentials/i,
		);
	});

	// Guards the path-join contract: the normalized base must never end in a
	// slash, so `${base}${path}` cannot produce `//` or retarget the host.
	it('produces a base that joins safely with an absolute path', () => {
		const base = normalizeApiUrl('https://api.draiven.io/', node);
		expect(`${base}/conversations/`).toBe('https://api.draiven.io/conversations/');
		expect(new URL(`${base}/conversations/`).host).toBe('api.draiven.io');
	});
});
