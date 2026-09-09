import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INode,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import type { ConversationSubmitResponse } from './GenericFunctions';
import {
	draivenApiRequest,
	fetchLastAiMessage,
	getDraivenBaseUrl,
	isErrorMessage,
	MIN_POLL_INTERVAL_MS,
	pollForAnswer,
	toDraivenError,
} from './GenericFunctions';

interface AskQuestionOptions {
	conversationId?: number;
	pollInterval?: number;
	sqlMode?: boolean;
	timeout?: number;
}

const DEFAULT_TIMEOUT_SECONDS = 300;
const DEFAULT_POLL_INTERVAL_SECONDS = 2;

/**
 * Read an optional whole-number node option, failing loudly on bad input.
 *
 * The editor's `minValue` is a UI affordance only: a `type: 'number'` field can
 * be driven by an expression, so these values can arrive as a float, a numeric
 * string, or `NaN`. Clamping silently (`Math.max(NaN, 1)` yields `NaN`) would
 * hand a nonsensical deadline to the poll loop and surface later as a confusing
 * timeout, so an invalid value is rejected here with the offending input named.
 */
function readIntegerOption(
	node: INode,
	value: unknown,
	config: { name: string; min: number; fallback?: number; itemIndex: number },
): number {
	const isEmpty = value === undefined || value === null || value === '';

	// A fallback means "this option may be left unset". Callers that omit it --
	// notably array *elements*, where an empty slot is malformed input rather
	// than an absent option -- fall through to validation and throw, instead of
	// silently substituting a value the user never asked for.
	if (isEmpty && config.fallback !== undefined) {
		return config.fallback;
	}

	const parsed = isEmpty ? Number.NaN : typeof value === 'string' ? Number(value.trim()) : value;

	if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < config.min) {
		const received = JSON.stringify(value);
		throw new NodeOperationError(
			node,
			`The "${config.name}" option must be a whole number of at least ${config.min}. Received ${received}.`,
			{
				description: `Received ${received}.`,
				itemIndex: config.itemIndex,
			},
		);
	}

	return parsed;
}

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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
						description: 'Ask a question to Draiven AI using selected datasets and an agent',
						action: 'Ask a question to Draiven AI',
					},
				],
				default: 'askQuestion',
			},
			{
				displayName: 'Dataset Names or IDs',
				name: 'datasetIds',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getDatasets',
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				description:
					'Datasets to ground the answer on. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Agent Name or ID',
				name: 'agentId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAgents',
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['askQuestion'],
					},
				},
				description:
					'Agent that answers the question. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
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
			{
				displayName: 'Options',
				name: 'options',
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
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: 0,
						},
						description:
							'Continue an existing conversation by its ID. Leave at 0 to start a new conversation.',
					},
					{
						displayName: 'Poll Interval (Seconds)',
						name: 'pollInterval',
						type: 'number',
						default: DEFAULT_POLL_INTERVAL_SECONDS,
						typeOptions: {
							minValue: 2,
						},
						description:
							'How long to wait between checks for the answer. Values below 2 seconds are raised to 2 to limit request volume.',
					},
					{
						displayName: 'SQL Mode',
						name: 'sqlMode',
						type: 'boolean',
						default: false,
						description: 'Whether to run the question in SQL mode, bypassing the text-to-SQL step',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: DEFAULT_TIMEOUT_SECONDS,
						typeOptions: {
							minValue: 1,
						},
						description: 'How long to wait for the answer before failing the node',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getDatasets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const baseUrl = await getDraivenBaseUrl(this);

				let datasets: Array<{ id: number; name: string; description?: string; source_type?: string }>;
				try {
					datasets = await draivenApiRequest(this, 'GET', baseUrl, '/datasets/');
				} catch (error) {
					throw toDraivenError(this.getNode(), error, 'loading the dataset list');
				}

				if (!Array.isArray(datasets)) return [];

				return datasets.map((dataset) => ({
					name: dataset.name,
					value: dataset.id,
					description: dataset.description ?? undefined,
				}));
			},

			async getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const baseUrl = await getDraivenBaseUrl(this);

				let agents: Array<{ id: number; name: string; description?: string }>;
				try {
					agents = await draivenApiRequest(this, 'GET', baseUrl, '/agents/');
				} catch (error) {
					throw toDraivenError(this.getNode(), error, 'loading the agent list');
				}

				if (!Array.isArray(agents)) return [];

				return agents.map((agent) => ({
					name: agent.name,
					value: agent.id,
					description: agent.description ?? undefined,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const node = this.getNode();

		for (let i = 0; i < items.length; i++) {
			// Hoisted so the Continue On Fail branch can still report which
			// conversation failed and what the backend said about it.
			let conversationId: number | undefined;
			let backendDiagnostic: string | undefined;

			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation !== 'askQuestion') {
					throw new NodeOperationError(node, `The operation "${operation}" is not supported.`, {
						itemIndex: i,
					});
				}

				const baseUrl = await getDraivenBaseUrl(this);

				const question = (this.getNodeParameter('question', i, '') as string).trim();
				if (question === '') {
					throw new NodeOperationError(node, 'The "Question" parameter is empty.', {
						description: 'Provide a question to send to Draiven AI.',
						itemIndex: i,
					});
				}

				const datasetIds = (this.getNodeParameter('datasetIds', i, []) as Array<number | string>).map(
					(raw, index) =>
						readIntegerOption(node, raw, {
							name: `Dataset ID at position ${index + 1}`,
							min: 1,
							itemIndex: i,
						}),
				);
				const rawAgentId = this.getNodeParameter('agentId', i, '') as number | string;
				const options = this.getNodeParameter('options', i, {}) as AskQuestionOptions;

				const timeoutMs =
					readIntegerOption(node, options.timeout, {
						name: 'Timeout (Seconds)',
						min: 1,
						fallback: DEFAULT_TIMEOUT_SECONDS,
						itemIndex: i,
					}) * 1000;

				const pollIntervalMs = Math.max(
					readIntegerOption(node, options.pollInterval, {
						name: 'Poll Interval (Seconds)',
						min: 1,
						fallback: DEFAULT_POLL_INTERVAL_SECONDS,
						itemIndex: i,
					}) * 1000,
					MIN_POLL_INTERVAL_MS,
				);

				// 0 is the documented "start a new conversation" sentinel.
				const conversationIdOption = readIntegerOption(node, options.conversationId, {
					name: 'Conversation ID',
					min: 0,
					fallback: 0,
					itemIndex: i,
				});

				const body: IDataObject = {
					question,
					dataset_ids: datasetIds,
				};

				const agentId = Number(rawAgentId);
				if (rawAgentId !== '' && rawAgentId !== null && Number.isFinite(agentId)) {
					body.agent_id = agentId;
				}

				if (options.sqlMode !== undefined) {
					body.sql_mode = options.sqlMode;
				}

				// Continuing an existing conversation means its previous answer is
				// already the "last AI message". Capture that id *before* submitting
				// so the poll loop can tell the old answer from the new one.
				const continuedConversationId =
					conversationIdOption > 0 ? conversationIdOption : undefined;

				let baselineMessageId: number | null = null;
				if (continuedConversationId !== undefined) {
					body.conversation_id = continuedConversationId;
					try {
						const existing = await fetchLastAiMessage(this, baseUrl, continuedConversationId);
						baselineMessageId = existing?.id ?? null;
					} catch (error) {
						throw toDraivenError(
							node,
							error,
							`reading the current state of conversation ${continuedConversationId}`,
						);
					}
				}

				let submitted: ConversationSubmitResponse;
				try {
					submitted = await draivenApiRequest<ConversationSubmitResponse>(
						this,
						'POST',
						baseUrl,
						'/conversations/',
						body,
					);
				} catch (error) {
					throw toDraivenError(node, error, 'submitting the question to Draiven');
				}

				conversationId = Number(submitted?.conversation_id ?? submitted?.id);

				// Must be a positive integer: it is interpolated straight into the
				// poll URL, and a float, 0 or a negative value would build a path
				// that can never resolve.
				if (!Number.isInteger(conversationId) || conversationId <= 0) {
					throw new NodeOperationError(
						node,
						'Draiven accepted the question but returned no usable conversation ID.',
						{
							description:
								'Polling requires a positive whole-number conversation ID. Retry the request; if it persists, contact Draiven support.',
							itemIndex: i,
						},
					);
				}

				const message = await pollForAnswer(this, baseUrl, {
					conversationId,
					timeoutMs,
					pollIntervalMs,
					baselineMessageId,
				});

				// The backend persists an assistant message flagged with
				// `additional_data.error` so pollers stop waiting. It is a failure
				// report, not an answer, and must not be returned as success.
				if (isErrorMessage(message)) {
					// The raw content is customer-facing analysis text and is kept
					// out of the node error, which surfaces in logs and the editor.
					// It is carried on the output item instead.
					backendDiagnostic = message.content;
					throw new NodeOperationError(node, 'Draiven failed to answer the question.', {
						description: `The Draiven orchestration reported an error for conversation ${conversationId}. With "Continue On Fail" enabled, the backend's diagnostic text is returned as "backendMessage" on the output item.`,
						itemIndex: i,
					});
				}

				returnData.push({
					json: {
						success: true,
						conversationId,
						executionId: submitted.execution_id,
						messageId: message.id,
						question,
						answer: message.content,
						contentType: message.content_type ?? 'html',
						additionalData: message.additional_data ?? null,
						isConclusion: message.is_conclusion ?? false,
						createdAt: message.created_at,
						datasetIds,
						agentId: body.agent_id ?? null,
						sqlMode: body.sql_mode ?? false,
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					// Preserve the diagnostics a downstream branch needs to act on:
					// the remediation hint, the conversation to retry or inspect,
					// and whatever the backend reported.
					const description = (error as { description?: unknown })?.description;

					returnData.push({
						json: {
							success: false,
							error: error instanceof Error ? error.message : String(error),
							description: typeof description === 'string' ? description : null,
							conversationId: conversationId ?? null,
							backendMessage: backendDiagnostic ?? null,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
