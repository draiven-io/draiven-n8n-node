import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DraivenApi implements ICredentialType {
	name = 'draivenApi';
	displayName = 'Draiven API';
	documentationUrl = 'https://docs.draiven.io/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.draiven.io',
			required: true,
			placeholder: 'https://api.draiven.io',
			description:
				'The base URL of the Draiven API. Must include the scheme (http or https). A trailing slash is ignored. Always use https outside local development — over plain http the email and API key travel in a Base64 Basic auth header that anyone observing the traffic can reverse.',
		},
		{
			displayName: 'User Email',
			name: 'userEmail',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'user@example.com',
			description: 'Your Draiven account email',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Draiven API key. You can create one in your Draiven dashboard under Settings > API Keys.',
		},
	];

	// Use basic authentication with username (email) and password (API key)
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.userEmail}}',
				password: '={{$credentials.apiKey}}',
			},
		},
	};

	// Verify the credential against the public /ping endpoint.
	//
	// This expression is the only place the URL is used *before* node code runs,
	// so `normalizeApiUrl` cannot guard it: n8n builds the credential test
	// request itself. It therefore repeats the same three checks inline, and
	// yields an empty baseURL when any of them fails so the test reports a
	// failure instead of sending Basic auth somewhere unintended:
	//
	//   ^https?://       reject non-HTTP schemes, so the credential is never
	//                    handed to a file:, ftp: or javascript: target
	//   (?![^/@]*@)      reject embedded userinfo ("https://user:pass@evil"),
	//                    which would otherwise retarget the host
	//   [^/?#]+          require an actual host
	//
	// Query and fragment are dropped, then trailing slashes, so a base URL like
	// "https://api.draiven.io/" cannot produce a double-slashed path that the
	// backend answers with a redirect.
	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{ /^https?:\\/\\/(?![^\\/@]*@)[^\\/?#]+/i.test(($credentials.apiUrl || "").trim()) ? ($credentials.apiUrl || "").trim().replace(/[?#].*$/, "").replace(/\\/+$/, "") : "" }}',
			url: '/ping',
			method: 'GET',
		},
	};
}
