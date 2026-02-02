# 🔄 Streaming Events in Draiven n8n Node

## Overview

The Draiven n8n node captures **real-time streaming events** from the Draiven AI backend during question processing. While n8n doesn't support showing live progress updates in the UI, you can still access and use these events in several ways.

## What Gets Captured

The node listens to all SignalR streaming events:

### Event Types
- **`agent_start`** - AI agent begins processing
- **`agent_progress`** - Progress updates with messages
- **`agent_complete`** - AI agent finishes
- **`stage_start`** - New processing stage begins
- **`stage_update`** - Stage progress update
- **`stage_complete`** - Stage finishes
- **`tool_start`** - Tool/function call starts
- **`tool_progress`** - Tool execution progress
- **`tool_complete`** - Tool finishes
- **`on_chain_start`** - LangChain chain starts
- **`on_chain_end`** - LangChain chain ends
- **`on_chat_model_start`** - LLM call starts
- **`on_chat_model_stream`** - LLM token streaming
- **`on_chat_model_end`** - LLM call finishes

## Output Structure

### Standard Output
```json
{
  "success": true,
  "conversationId": "conv_123",
  "executionId": "exec_456",
  "question": "What are my top products?",
  "answer": "Based on your data...",
  "progressSummary": [
    {
      "type": "stage_start",
      "stage": "data_analysis",
      "message": "Starting data analysis",
      "timestamp": "2026-02-02T10:00:00Z"
    },
    {
      "type": "agent_progress",
      "message": "Querying database...",
      "progress": 0.3,
      "timestamp": "2026-02-02T10:00:05Z"
    },
    {
      "type": "stage_complete",
      "stage": "data_analysis",
      "timestamp": "2026-02-02T10:00:15Z"
    }
  ],
  "metadata": {
    "totalEvents": 45,
    "timestamp": "2026-02-02T10:00:20Z"
  }
}
```

### With Full Stream Enabled
Enable "Include Full Event Stream" in Additional Options to get:
```json
{
  "...": "standard fields",
  "streamEvents": [
    {
      "type": "agent_start",
      "agent": "DataAnalysisAgent",
      "timestamp": "2026-02-02T10:00:00Z"
    },
    {
      "type": "on_chat_model_stream",
      "content": "Based",
      "timestamp": "2026-02-02T10:00:01Z"
    },
    // ... all 45+ events
  ]
}
```

## How to View Progress

### 1. **Console Logging** (For Development)

When the node runs, progress is logged to the n8n console:

```bash
[Draiven] Starting: data_analysis
[Draiven] Querying database...
[Draiven] Processing results...
[Draiven] ✓ Completed: data_analysis
```

To see these logs:
```bash
# If running n8n from terminal
n8n start

# Or check Docker logs
docker logs n8n -f
```

### 2. **Progress Summary** (Always Included)

The `progressSummary` field in the output contains key progress events in a clean, easy-to-read format. Use this in downstream nodes:

```javascript
// Example: Send progress updates to Slack
{
  "message": "{{$json.progressSummary.map(e => e.message).join('\n')}}"
}
```

### 3. **Full Event Stream** (Optional)

Enable "Include Full Event Stream" option to get all events. Useful for:
- **Debugging** - See exactly what happened
- **Analytics** - Track performance metrics
- **Audit Trail** - Record complete execution history

### 4. **Use in Workflows**

#### Example 1: Progress Notification
```
Draiven Node 
  ↓
Function Node (extract progress)
  ↓
Slack Node (send updates)
```

Function Node Code:
```javascript
const progress = $json.progressSummary;
const lastUpdate = progress[progress.length - 1];

return {
  json: {
    text: `Draiven Update: ${lastUpdate.message}`,
    progress: Math.round((lastUpdate.progress || 0) * 100) + "%"
  }
};
```

#### Example 2: Store Events in Database
```
Draiven Node 
  ↓
Function Node (format events)
  ↓
PostgreSQL Node (insert records)
```

#### Example 3: Conditional Logic Based on Progress
```
Draiven Node 
  ↓
IF Node (check totalEvents)
  ↓ (high)
  Send Alert Node
  ↓ (normal)
  Continue Workflow
```

## Configuration Options

### Stream Response (Not Used Yet)
```
Type: boolean
Default: false
Description: Reserved for future streaming support
```

### Include Full Event Stream
```
Type: boolean
Default: false
Description: Include all streaming events in output
Note: Can make output very large (100KB+)
```

**When to enable:**
- ✅ Debugging issues
- ✅ Building audit trails
- ✅ Performance analysis
- ❌ Production workflows (unless needed)
- ❌ When output size matters

## Real-time UI Progress (Future)

Currently, n8n doesn't support showing progress during node execution. However, there are workarounds:

### Option A: Build Custom n8n Nodes with Progress
n8n's API is being enhanced. Future versions might support:
```typescript
// Theoretical future API
this.sendProgressUpdate({
  message: "Processing...",
  progress: 0.5
});
```

### Option B: Use Webhooks for Real-time Updates
```
1. Draiven Node (async mode)
2. Webhook Listener (separate workflow)
3. Frontend dashboard (custom UI)
```

### Option C: Polling Status Node
```
1. Start Draiven Request
2. Loop: Check Status Node
3. Wait Node (5 seconds)
4. IF Complete → Exit Loop
```

## Event Data Structure

### Agent Progress Event
```json
{
  "type": "agent_progress",
  "stage": "data_analysis",
  "message": "Querying database...",
  "progress": 0.45,
  "timestamp": "2026-02-02T10:00:00Z",
  "metadata": {
    "query": "SELECT ...",
    "rows": 1500
  }
}
```

### Stage Complete Event
```json
{
  "type": "stage_complete",
  "stage": "visualization",
  "duration_ms": 2341,
  "success": true,
  "timestamp": "2026-02-02T10:00:20Z"
}
```

### Tool Execution Event
```json
{
  "type": "tool_complete",
  "tool": "query_database",
  "input": "SELECT * FROM sales",
  "output": { "rows": 1500 },
  "duration_ms": 1234,
  "timestamp": "2026-02-02T10:00:15Z"
}
```

## Best Practices

### ✅ Do
- Use `progressSummary` for clean progress updates
- Enable full stream only when debugging
- Log important events to external systems
- Build dashboards using webhook approach

### ❌ Don't
- Don't enable full stream in production (unless needed)
- Don't expect real-time UI updates in n8n
- Don't block workflows waiting for progress
- Don't parse `streamEvents` for critical data (use `answer`, `payload` instead)

## Performance Notes

- **Progress Summary**: ~5-10 events, <2KB
- **Full Stream**: 20-100+ events, 50-200KB
- **Console Logging**: Minimal overhead
- **Total Overhead**: <100ms additional processing

## Examples

### Simple Progress Tracking
```javascript
// In downstream Function Node
const summary = $json.progressSummary;
const stages = [...new Set(summary.map(e => e.stage))];

return {
  json: {
    question: $json.question,
    answer: $json.answer,
    stagesCompleted: stages.length,
    totalTime: $json.metadata.timestamp,
    events: summary.length
  }
};
```

### Error Detection
```javascript
// Check for errors in stream
const errors = $json.streamEvents?.filter(e => 
  e.type === 'error' || e.error
);

if (errors.length > 0) {
  return {
    json: {
      status: 'warning',
      errors: errors,
      answer: $json.answer
    }
  };
}

return { json: $json };
```

### Performance Metrics
```javascript
// Calculate stage durations
const stages = {};
$json.progressSummary.forEach(event => {
  if (event.type === 'stage_start') {
    stages[event.stage] = { start: event.timestamp };
  }
  if (event.type === 'stage_complete') {
    stages[event.stage].end = event.timestamp;
    stages[event.stage].duration = 
      new Date(event.timestamp) - new Date(stages[event.stage].start);
  }
});

return {
  json: {
    answer: $json.answer,
    performance: stages
  }
};
```

## Troubleshooting

### No Events in Output
- Check SignalR connection is established
- Verify backend is sending events
- Check n8n console for errors

### Too Many Events
- Disable "Include Full Event Stream"
- Use `progressSummary` instead
- Filter events in Function Node

### Missing Progress Updates
- Backend might not send all events
- Check SignalR connection logs
- Verify event types are subscribed

## Future Enhancements

Planned improvements:
- Real-time progress bar (when n8n supports it)
- Progress webhooks for external dashboards
- Event filtering options
- Custom event handlers
- Streaming mode for large responses

## Support

For issues or questions:
- Check n8n console logs
- Enable full stream for debugging
- Contact Draiven support with `executionId`

---

**Note:** Streaming events provide transparency into AI processing but are not required for basic usage. The main `answer` and `payload` fields contain the final results.
