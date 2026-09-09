> **⚠️ Outdated (as of v0.3.0).**
> This document describes the removed SignalR streaming and persona-based flow.
> The node now uses the Conversations REST API with agent selection.
> See [README.md](./README.md) for current behavior. Rewrite tracked as follow-up.

# Draiven n8n Node - Architecture Diagram

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        n8n Workflow                              │
│                                                                  │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐        │
│  │  Trigger   │ -> │   DRAIVEN   │ -> │  Next Node   │        │
│  │  Node      │    │    NODE     │    │  (Email etc) │        │
│  └────────────┘    └─────────────┘    └──────────────┘        │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Draiven Node Components                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              DraivenApi.credentials.ts                    │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  • API URL (https://api.draiven.io)               │  │  │
│  │  │  • User Email                                       │  │  │
│  │  │  • API Key (password field)                        │  │  │
│  │  │  • Basic Auth Implementation                       │  │  │
│  │  │  • Credential Test (/ping endpoint)               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Draiven.node.ts                          │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │         Node Properties & Configuration            │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Operation: "Ask Question"                   │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Datasets (Multi-Select) ← GET /datasets    │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Persona (Select) ← GET /personas           │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Question (Text Area)                       │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │  Additional Options:                        │  │ │  │
│  │  │  │   • Conversation ID                         │  │ │  │
│  │  │  │   • Stream Response                         │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │            Load Options Methods                    │ │  │
│  │  │  • getDatasets() → API call → Transform          │ │  │
│  │  │  • getPersonas() → API call → Transform          │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │              Execute Method                        │ │  │
│  │  │  1. Get parameters from user input                │ │  │
│  │  │  2. Build request body                            │ │  │
│  │  │  3. Call POST /conversations                      │ │  │
│  │  │  4. Process response                              │ │  │
│  │  │  5. Return structured output                      │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Draiven API                                 │
│                   (https://api.draiven.io)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ GET /ping    │  │ GET /datasets│  │ GET /personas        │  │
│  │ (Test creds) │  │ (Load list)  │  │ (Load list)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              POST /conversations                          │  │
│  │  • Accepts: question, dataset_ids, persona_id           │  │
│  │  • Returns: conversation with AI answer                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
User Input → Node Configuration → API Calls → Response Processing → Output

1. USER CONFIGURATION
   ├── Selects datasets (triggers getDatasets())
   ├── Selects persona (triggers getPersonas())
   └── Enters question

2. EXECUTION FLOW
   ├── Node collects all parameters
   ├── Builds API request body:
   │   {
   │     "question": "...",
   │     "dataset_ids": [1, 2, 3],
   │     "persona_id": 5,
   │     "conversation_id": "optional",
   │     "stream": false
   │   }
   ├── Sends POST /conversations
   └── Receives AI response

3. RESPONSE PROCESSING
   ├── Extracts answer from response
   ├── Structures output JSON:
   │   {
   │     "success": true,
   │     "conversationId": "123",
   │     "question": "...",
   │     "answer": "AI response...",
   │     "datasets": [1, 2, 3],
   │     "personaId": 5,
   │     "metadata": {...}
   │   }
   └── Returns to n8n workflow

4. NEXT NODE
   └── Uses output via {{ $json.answer }}
```

## 🔐 Authentication Flow

```
┌────────────────┐
│  User enters   │
│  credentials   │
└────────┬───────┘
         │
         ▼
┌────────────────────────────────┐
│  n8n stores credentials        │
│  (encrypted)                   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Node receives credentials     │
│  userEmail = "user@email.com"  │
│  apiKey = "sk_xxx"             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Create Basic Auth header      │
│  authString = base64(email:key)│
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Add to API request            │
│  Authorization: Basic {auth}   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Draiven API validates         │
│  Returns data if valid         │
└────────────────────────────────┘
```

## 📦 File Structure & Dependencies

```
draiven-n8n-node/
│
├── package.json ─────────────┐
│   └── Dependencies:         │
│       • n8n-workflow        │ (Peer dependency)
│       • typescript          │ (Dev)
│       • @types/node         │ (Dev)
│       • eslint              │ (Dev)
│       • prettier            │ (Dev)
│       • gulp                │ (Dev)
│
├── tsconfig.json ────────────┤
│   └── Compiles to dist/     │
│                              │
├── credentials/ ─────────────┤
│   └── DraivenApi.credentials.ts
│       └── Compiled to: dist/credentials/
│
├── nodes/ ───────────────────┤
│   └── Draiven/              │
│       ├── Draiven.node.ts   │
│       └── draiven.svg       │
│           └── Compiled to: dist/nodes/
│
└── dist/ (Built output) ─────┘
    ├── credentials/
    │   └── DraivenApi.credentials.js
    └── nodes/
        └── Draiven/
            ├── Draiven.node.js
            └── draiven.svg
```

## 🎯 n8n Integration Points

```
n8n Core
   │
   ├── Credential System
   │   └── Loads: dist/credentials/DraivenApi.credentials.js
   │       • Displays credential form
   │       • Tests via /ping endpoint
   │       • Stores encrypted credentials
   │
   ├── Node System
   │   └── Loads: dist/nodes/Draiven/Draiven.node.js
   │       • Registers node in palette
   │       • Loads icon (draiven.svg)
   │       • Provides node interface
   │
   ├── Workflow Engine
   │   └── Executes node when workflow runs
   │       • Calls execute() method
   │       • Passes input data
   │       • Receives output data
   │
   └── Options Loading
       └── Calls loadOptions methods
           • getDatasets() for dataset dropdown
           • getPersonas() for persona dropdown
```

## 🔄 Runtime Execution Sequence

```
1. Workflow Triggered
   └── [Previous Node Output] → Draiven Node

2. Node Initialization
   ├── Load credentials from n8n vault
   ├── Get parameters from node configuration
   └── Validate required fields

3. For Each Input Item
   ├── Extract operation type
   ├── Get datasets, persona, question
   ├── Get additional options (if any)
   └── Build request body

4. API Call
   ├── Create Basic Auth header
   ├── POST to /conversations endpoint
   ├── Include all parameters
   └── Wait for response

5. Response Handling
   ├── Parse JSON response
   ├── Extract conversation ID
   ├── Extract AI answer
   └── Build output object

6. Output
   └── Return structured JSON to next node
       └── [Draiven Node Output] → Next Node

7. Error Handling
   ├── Try/catch around execution
   ├── If continueOnFail: return error object
   └── Else: throw error to workflow
```

This architecture provides a clean, maintainable, and extensible foundation for the Draiven n8n integration! 🚀
