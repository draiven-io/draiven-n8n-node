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
				'The base URL of the Draiven API. Must include the scheme (http or https). A trailing slash is ignored.',
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

	// Verify the credential against the public /ping endpoint. The trailing slash
	// is stripped here so a base URL like "https://api.draiven.io/" cannot produce
	// a double-slashed path that the backend answers with a redirect.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl.replace(/\\/+$/, "")}}',
			url: '/ping',
			method: 'GET',
		},
	};
}
