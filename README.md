# n8n-nodes-draiven

This is an n8n community node that lets you use Draiven AI in your n8n workflows.

[Draiven](https://draiven.io) is a powerful AI-powered platform for data analysis and insights generation using advanced language models.

## Upgrading to 0.3.0

**0.3.0 is a breaking change.** Workflows built on 0.2.x will not run unchanged.

After upgrading, open every workflow that uses this node and:

1. **Reselect the agent.** **Persona** was replaced by **Agent Name or ID**, backed by
   `GET /agents/`. The old persona selection does not carry over.
2. **Remove references to the Stream Response option.** It no longer exists; answers
   are always returned as a single completed item.
3. **Update downstream field references.** `personaId` and `metadata` are gone.
   Use `agentId` and `additionalData`; `messageId`, `executionId`, `contentType`,
   `isConclusion` and `createdAt` are also now available.

Re-test each workflow before relying on it — a node that looks configured may still
be missing an agent selection.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node Installation

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-draiven` in **Enter npm package name**
4. Agree to the risks and select **Install**

After successful installation, the Draiven node will be available in your n8n instance.

## Operations

### Ask Question

Ask a question to Draiven AI against one or more of your datasets, optionally routed to a specific agent.

#### How it works

Draiven answers questions asynchronously. The node:

1. `POST`s the question to `/conversations/`, which returns a conversation ID immediately.
2. Polls `/conversations/{id}/last-ai-message` until the assistant's answer appears.
3. Returns the answer as a single item.

The node blocks until the answer arrives or the timeout is reached, so downstream
nodes always receive a completed answer rather than a pending job handle.

#### Configuration

1. **Credentials**: Set up your Draiven API credentials
   - **API URL**: Your Draiven API endpoint (for example `https://api.draiven.io`).
     Must include the scheme; a trailing slash is optional.

     > **Use HTTPS.** Your email and API key are sent as HTTP Basic authentication
     > on every request, which is only base64-encoded, not encrypted. An `http://`
     > URL exposes your API key to anyone on the network path. Only use `http://`
     > against a local development backend you control.

   - **User Email**: Your Draiven account email
   - **API Key**: Your Draiven API key (create one in Settings > API Keys in your Draiven dashboard)

2. **Parameters**:
   - **Dataset Names or IDs**: One or more datasets to analyze. Optional — if you
     select none, Draiven answers without dataset context, which is rarely what
     you want.
   - **Agent Name or ID**: Route the question to a specific agent. Leave empty to
     let Draiven choose.
   - **Question** (required): Your question or analysis request

3. **Additional Options**:
   - **Conversation ID**: Continue an existing conversation instead of starting a
     new one. Must be a whole number; `0` starts a new conversation.
   - **SQL Mode**: Ask Draiven to answer using SQL against the selected datasets
   - **Timeout (Seconds)**: How long to wait for an answer (default `300`,
     minimum `1`)
   - **Poll Interval (Seconds)**: How often to check for the answer (default `2`,
     minimum `2`)

#### Output

The node returns a JSON object with:

| Field | Description |
| --- | --- |
| `success` | Always `true` on the success path |
| `conversationId` | Conversation ID — pass this to **Conversation ID** to follow up |
| `executionId` | Backend execution identifier for the run |
| `messageId` | ID of the assistant message that answered the question |
| `question` | The question that was asked |
| `answer` | The AI's response |
| `contentType` | Format of `answer` (typically `html`) |
| `additionalData` | Sources and other metadata attached to the answer |
| `isConclusion` | Whether Draiven marked this message as the final answer |
| `createdAt` | Timestamp of the answer |
| `datasetIds` | Dataset IDs used |
| `agentId` | Agent used, or `null` |
| `sqlMode` | Whether SQL mode was requested |

If **Continue On Fail** is enabled, a failure produces an item instead of stopping the
workflow:

| Field | Description |
| --- | --- |
| `success` | Always `false` on this path |
| `error` | Summary of what went wrong |
| `description` | Remediation hint, or `null` |
| `conversationId` | Conversation the failure belongs to, or `null` — use it to retry or inspect the run |
| `backendMessage` | Diagnostic text reported by Draiven, or `null` |

`conversationId` is populated even on timeout, so a downstream branch can retrieve a
late answer rather than losing the run.

#### Continuing a conversation

Pass a previous run's `conversationId` into **Conversation ID**. The node records
the conversation's existing answer before submitting, so it waits for the *new*
answer rather than immediately returning the previous turn's response.

## Known limitations

### Draiven API tools are unavailable with API key authentication

Draiven's orchestration can call back into the Draiven API on your behalf (for
example to list or inspect datasets). Those tools require a user bearer token.
Requests authenticated with an API key have no bearer token, so the backend skips
registering the Draiven API tools for the run.

**Impact**: questions answered through this node can analyze your dataset content
normally, but cannot use the Draiven API tools. Questions that depend on them may
return a less complete answer. Data analysis over the selected datasets is
unaffected.

### Timeouts do not cancel the run

If the timeout is reached, the node fails but Draiven keeps processing. The error
includes the conversation ID, and the answer can still be retrieved later from
`/conversations/{id}/last-ai-message`, or by re-running with that **Conversation ID**.

## Credentials

### Draiven API

To get your API credentials:

1. Log in to your [Draiven account](https://app.draiven.io)
2. Go to **Settings** > **API Keys**
3. Create a new API key
4. Copy the API key and your account email
5. Add them to the n8n credentials configuration

Credentials are sent using HTTP Basic authentication and are handled entirely by
n8n's credential system — the node never constructs or logs an authorization header.

## Compatibility

- Minimum n8n version: 0.199.0
- Tested with n8n version: 1.0.0+

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Draiven Documentation](https://docs.draiven.io)
- [Draiven API Reference](https://api.draiven.io/docs)

## License

MIT

## Support

For support, please contact:
- Draiven Support: support@draiven.ai
- GitHub Issues: [Report an issue](https://github.com/draiven-io/n8n-nodes-draiven/issues)

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Run the test suite
npm test

# Watch mode for development
npm run dev
```

### Testing Locally

1. Build the node: `npm run build`
2. Link the package: `npm link`
3. In your n8n installation folder: `npm link n8n-nodes-draiven`
4. Restart n8n

## Changelog

### 0.3.0

- **Breaking**: replaced the SignalR streaming flow with the Conversations REST API.
  The **Stream Response** option was removed.
- **Breaking**: replaced **Persona** selection with **Agent** selection, backed by
  `GET /agents/`. Existing workflows must reselect an agent.
- Output changed: `personaId` and `metadata` were replaced by `agentId`,
  `additionalData`, `messageId`, `executionId`, `contentType`, `isConclusion`
  and `createdAt`.
- Added **SQL Mode**, **Timeout** and **Poll Interval** options.
- Backend orchestration failures now fail the item instead of returning an error
  string as the answer.
- Node errors no longer carry the originating request, so credentials and
  authorization headers cannot reach n8n execution logs.
- **Timeout**, **Poll Interval** and **Conversation ID** are validated as whole
  numbers and rejected with a clear message instead of failing mid-request.
- Requests are bounded by a per-request timeout as well as the overall run
  timeout, so a stalled connection can no longer hang the workflow.
- The credential test rejects non-HTTP(S) API URLs and URLs carrying embedded
  `user:pass@` credentials.
- **Continue On Fail** items now carry `description`, `conversationId` and
  `backendMessage` alongside `error`.
- Removed the `@microsoft/signalr` dependency.

### 0.1.0 (2026-01-29)

- Initial release
- Support for asking questions to Draiven AI
- Dataset selection
- Persona selection
- Basic authentication with API key
