# n8n-nodes-draiven

This is an n8n community node that lets you use Draiven AI in your n8n workflows.

[Draiven](https://draiven.io) is a powerful AI-powered platform for data analysis and insights generation using advanced language models.

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

Ask a question to Draiven AI using selected datasets and a specific persona.

#### Configuration

1. **Credentials**: Set up your Draiven API credentials
   - API URL: Your Draiven API endpoint (default: https://api.draiven.io)
   - User Email: Your Draiven account email
   - API Key: Your Draiven API key (create one in Settings > API Keys in your Draiven dashboard)

2. **Parameters**:
   - **Datasets**: Select one or more datasets to analyze
   - **Persona**: Choose the AI persona to use (e.g., Data Detective, Sales Strategist, Finance Analyst)
   - **Question**: Enter your question or analysis request
   
3. **Additional Options**:
   - **Conversation ID**: Continue an existing conversation
   - **Stream Response**: Enable streaming for real-time responses

#### Output

The node returns a JSON object with:
- `success`: Boolean indicating if the operation succeeded
- `conversationId`: ID of the conversation (for follow-up questions)
- `question`: The question that was asked
- `answer`: The AI's response
- `datasets`: Array of dataset IDs used
- `personaId`: ID of the persona used
- `metadata`: Additional response metadata

## Credentials

### Draiven API

To get your API credentials:

1. Log in to your [Draiven account](https://app.draiven.io)
2. Go to **Settings** > **API Keys**
3. Create a new API key
4. Copy the API key and your account email
5. Add them to the n8n credentials configuration

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

# Watch mode for development
npm run dev
```

### Testing Locally

1. Build the node: `npm run build`
2. Link the package: `npm link`
3. In your n8n installation folder: `npm link n8n-nodes-draiven`
4. Restart n8n

## Changelog

### 0.1.0 (2026-01-29)

- Initial release
- Support for asking questions to Draiven AI
- Dataset selection
- Persona selection
- Basic authentication with API key
