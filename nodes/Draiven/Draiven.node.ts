import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import * as signalR from '@microsoft/signalr';

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
				displayName: 'Persona Name or ID',
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
					{
						displayName: 'Include Full Event Stream',
						name: 'includeFullStream',
						type: 'boolean',
						default: false,
						description: 'Whether to include all streaming events in output (useful for debugging)',
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
				// Remove trailing slash from API URL to avoid FastAPI redirects
				const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
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
						followRedirect: true,
						maxRedirects: 5,
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
				// Remove trailing slash from API URL to avoid FastAPI redirects
				const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
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
						followRedirect: true,
						maxRedirects: 5,
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
		// Remove trailing slash from API URL to avoid FastAPI redirects
		const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
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
						includeFullStream?: boolean;
					};

					// Step 1: Negotiate SignalR connection
					const negotiateResponse = await this.helpers.request({
						method: 'POST',
						url: `${apiUrl}/signalr/negotiate`,
						headers: {
							'Authorization': `Basic ${authString}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					const { url: signalrUrl, accessToken } = negotiateResponse;

					// Step 2: Create SignalR connection
					const connection = new signalR.HubConnectionBuilder()
						.withUrl(signalrUrl, {
							accessTokenFactory: () => accessToken,
						})
						.withAutomaticReconnect()
						.configureLogging(signalR.LogLevel.Warning)
						.build();

					// Step 3: Set up message handlers and promise for completion
					const responsePromise = new Promise<any>((resolve, reject) => {
						const streamedMessages: any[] = [];
						let finalResponse: any = null;
						const timeout = setTimeout(() => {
							reject(new Error('SignalR response timeout after 5 minutes'));
						}, 300000); // 5 minutes timeout

						// Listen for all streaming events (progress, stage updates, etc.)
						const eventTypes = [
							'agent_start', 'agent_progress', 'agent_complete',
							'stage_start', 'stage_update', 'stage_complete',
							'tool_start', 'tool_progress', 'tool_complete',
							'on_chain_start', 'on_chain_end',
							'on_chat_model_start', 'on_chat_model_stream', 'on_chat_model_end'
						];

						// Subscribe to all event types
						eventTypes.forEach(eventType => {
							connection.on(eventType, (data: any) => {
								streamedMessages.push({ type: eventType, ...data });
								
								// Log progress updates for visibility in n8n console
								if (eventType === 'agent_progress' && data.message) {
									console.log(`[Draiven] ${data.message}`);
								} else if (eventType === 'stage_start' && data.stage) {
									console.log(`[Draiven] Starting: ${data.stage}`);
								} else if (eventType === 'stage_complete' && data.stage) {
									console.log(`[Draiven] ✓ Completed: ${data.stage}`);
								}
							});
						});

						// Listen for completion event (this is when orchestration finishes)
						connection.on('completion', (data: any) => {
							finalResponse = data;
							clearTimeout(timeout);
							resolve({
								final: finalResponse,
								stream: streamedMessages,
							});
						});

						// Listen for errors
						connection.on('error', (error: any) => {
							clearTimeout(timeout);
							reject(new Error(error.message || 'SignalR error occurred'));
						});
					});

					// Step 4: Start connection
					await connection.start();

					// Step 5: Send chat request (returns immediately with IDs)
					const requestBody: any = {
						question,
						dataset_ids: datasets,
						persona_id: personaId,
					};

					if (additionalOptions.conversationId) {
						requestBody.conversation_id = additionalOptions.conversationId;
					}

					const chatResponse = await this.helpers.request({
						method: 'POST',
						url: `${apiUrl}/signalr/chat`,
						headers: {
							'Authorization': `Basic ${authString}`,
							'Content-Type': 'application/json',
						},
						body: requestBody,
						json: true,
					});

					const { id: conversationId, execution_id: executionId } = chatResponse;

					// Step 6: Wait for final response via SignalR
					const result = await responsePromise;

					// Step 7: Close connection
					await connection.stop();

					// Step 8: Format and return response
					const finalData = result.final || {};
					
					// Create a summary of progress events for easy viewing
					const progressSummary = result.stream
						.filter((e: any) => e.type === 'agent_progress' || e.type === 'stage_start' || e.type === 'stage_complete')
						.map((e: any) => ({
							type: e.type,
							stage: e.stage,
							message: e.message,
							timestamp: e.timestamp,
							progress: e.progress
						}));
					
					const outputData: any = {
						success: true,
						conversationId,
						executionId,
						question,
						answer: finalData.content || finalData.answer || finalData.message,
						datasets,
						personaId,
						payload: finalData.payload,
						echarts: finalData.echarts,
						progressSummary,  // Easy-to-read progress
						metadata: {
							timestamp: new Date().toISOString(),
							totalEvents: result.stream.length,
							...finalData,
						},
					};
					
					// Optionally include full stream events
					if (additionalOptions.includeFullStream) {
						outputData.streamEvents = result.stream;
					}
					
					returnData.push({ json: outputData });
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
