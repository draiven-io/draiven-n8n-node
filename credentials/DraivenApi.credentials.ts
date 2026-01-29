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
			description: 'The base URL of the Draiven API',
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

	// Test the credentials by making a simple API call
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '/ping',
			method: 'GET',
		},
	};
}
