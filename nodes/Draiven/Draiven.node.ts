import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

export class Draiven implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Draiven',
		name: 'draiven',
		icon: 'file:draiven.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Draiven AI for data analysis and insights',
		defaults: {
			name: 'Draiven',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'draivenApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Ask Question',
						value: 'askQuestion',
						description: 'Ask a question to Draiven AI with selected datasets and persona',
						action: 'Ask a question to Draiven AI',
					},
				],
				default: 'askQuestion',
			},
			// Datasets Selection
			{
				displayName: 'Datasets',
				name: 'datasets',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getDatasets',
				},
				default: [],
				required: true,
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				description: 'Select one or more datasets to use for analysis',
			},
			// Persona Selection
			{
				displayName: 'Persona',
				name: 'persona',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getPersonas',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				description: 'Select the AI persona to use for this question',
			},
			// Question Input
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				description: 'The question you want to ask Draiven AI',
				placeholder: 'What are the top 5 products by revenue this month?',
			},
			// Additional Options
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				options: [
					{
						displayName: 'Conversation ID',
						name: 'conversationId',
						type: 'string',
						default: '',
						description: 'Continue an existing conversation by providing its ID',
					},
					{
						displayName: 'Stream Response',
						name: 'stream',
						type: 'boolean',
						default: false,
						description: 'Whether to stream the response (returns final result only)',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			// Load available datasets from Draiven API
			async getDatasets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('draivenApi');
				const apiUrl = credentials.apiUrl as string;
				const userEmail = credentials.userEmail as string;
				const apiKey = credentials.apiKey as string;

				// Create Basic Auth header
				const authString = Buffer.from(`${userEmail}:${apiKey}`).toString('base64');

				try {
					const response = await this.helpers.request({
						method: 'GET',
						url: `${apiUrl}/datasets`,
						headers: {
							'Authorization': `Basic ${authString}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					// Map datasets to n8n options format
					return response.map((dataset: any) => ({
						name: dataset.name,
						value: dataset.id,
						description: dataset.description || `Type: ${dataset.source_type}`,
					}));
				} catch (error) {
					console.error('Error loading datasets:', error);
					return [];
				}
			},

			// Load available personas from Draiven API
			async getPersonas(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('draivenApi');
				const apiUrl = credentials.apiUrl as string;
				const userEmail = credentials.userEmail as string;
				const apiKey = credentials.apiKey as string;

				// Create Basic Auth header
				const authString = Buffer.from(`${userEmail}:${apiKey}`).toString('base64');

				try {
					const response = await this.helpers.request({
						method: 'GET',
						url: `${apiUrl}/personas`,
						headers: {
							'Authorization': `Basic ${authString}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					// Map personas to n8n options format
					return response.map((persona: any) => ({
						name: persona.name,
						value: persona.id,
						description: persona.description || '',
					}));
				} catch (error) {
					console.error('Error loading personas:', error);
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('draivenApi');
		const apiUrl = credentials.apiUrl as string;
		const userEmail = credentials.userEmail as string;
		const apiKey = credentials.apiKey as string;

		// Create Basic Auth header
		const authString = Buffer.from(`${userEmail}:${apiKey}`).toString('base64');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'askQuestion') {
					// Get parameters
					const datasets = this.getNodeParameter('datasets', i) as number[];
					const personaId = this.getNodeParameter('persona', i) as number;
					const question = this.getNodeParameter('question', i) as string;
					const additionalOptions = this.getNodeParameter('additionalOptions', i) as {
						conversationId?: string;
						stream?: boolean;
					};

					// Prepare request body
					const requestBody: any = {
						question,
						dataset_ids: datasets,
						persona_id: personaId,
					};

					// Add optional parameters
					if (additionalOptions.conversationId) {
						requestBody.conversation_id = additionalOptions.conversationId;
					}
					if (additionalOptions.stream !== undefined) {
						requestBody.stream = additionalOptions.stream;
					}

					// Make API call to Draiven
					const response = await this.helpers.request({
						method: 'POST',
						url: `${apiUrl}/conversations`,
						headers: {
							'Authorization': `Basic ${authString}`,
							'Content-Type': 'application/json',
						},
						body: requestBody,
						json: true,
					});

					// Add response to return data
					returnData.push({
						json: {
							success: true,
							conversationId: response.conversation_id || response.id,
							question,
							answer: response.answer || response.message || response.content,
							datasets,
							personaId,
							metadata: {
								timestamp: new Date().toISOString(),
								...response,
							},
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: {
							success: false,
							error: errorMessage,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
