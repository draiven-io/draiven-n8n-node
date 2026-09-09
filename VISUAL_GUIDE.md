> **⚠️ Outdated (as of v0.3.0).**
> This document describes the removed SignalR streaming and persona-based flow.
> The node now uses the Conversations REST API with agent selection.
> See [README.md](./README.md) for current behavior. Rewrite tracked as follow-up.

# Draiven n8n Node - Visual Preview

## 🎨 How It Looks in n8n

### 1. Node in Palette
```
┌─────────────────────────┐
│   Node Palette          │
├─────────────────────────┤
│  Search nodes...        │
├─────────────────────────┤
│                         │
│  📊 [D] Draiven        │  ← New node appears here
│  Interact with AI       │
│                         │
└─────────────────────────┘
```

### 2. Credential Configuration
```
┌──────────────────────────────────────────────────────┐
│  Draiven API                                     [×] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  API URL *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ https://api.draiven.io                        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  User Email *                                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ user@example.com                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  API Key *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────┐  ┌──────────┐                        │
│  │   Test   │  │   Save   │                        │
│  └──────────┘  └──────────┘                        │
└──────────────────────────────────────────────────────┘
```

### 3. Node Configuration Panel
```
┌──────────────────────────────────────────────────────┐
│  Draiven                                         [×] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Credentials                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Select credential...              [+] Create  │ │
│  │ ▼ My Draiven API                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Operation *                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Ask Question                                  ▼│ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Datasets *                                          │
│  ┌────────────────────────────────────────────────┐ │
│  │ ☑ Sales Data Q4 2025                          │ │
│  │ ☑ Product Catalog                             │ │
│  │ ☐ Customer Feedback                           │ │
│  │ ☐ Financial Reports                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Persona *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ Sales Strategist                              ▼│ │
│  └────────────────────────────────────────────────┘ │
│  Focus on sales performance and pipeline analysis   │
│                                                      │
│  Question *                                          │
│  ┌────────────────────────────────────────────────┐ │
│  │ What are the top 5 products by revenue       │ │
│  │ this month? Include percentage change vs     │ │
│  │ last month and highlight any anomalies.      │ │
│  │                                               │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ⚙ Additional Options                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ Add Option...                                 ▼│ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────┐  ┌──────────┐                        │
│  │ Execute  │  │   Save   │                        │
│  └──────────┘  └──────────┘                        │
└──────────────────────────────────────────────────────┘
```

### 4. Additional Options Expanded
```
┌──────────────────────────────────────────────────────┐
│  ⚙ Additional Options                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Conversation ID                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │ conv_abc123xyz                                │ │
│  └────────────────────────────────────────────────┘ │
│  Continue an existing conversation                   │
│                                                      │
│  Stream Response                                     │
│  ┌─┐                                                │
│  │ │ Yes    ⦿ No                                    │
│  └─┘                                                │
│  Stream the response (returns final result only)    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5. Workflow Canvas View
```
┌────────────────────────────────────────────────────────────────┐
│  Workflow: Daily Sales Analysis                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│    ┌────────────┐       ┌────────────┐       ┌────────────┐  │
│    │  Schedule  │  ───> │  Draiven   │  ───> │   Email    │  │
│    │   Trigger  │       │            │       │            │  │
│    └────────────┘       └────────────┘       └────────────┘  │
│    Every day 9AM        Ask Question          Send to team   │
│                                                                │
│                         ┌────────────┐                        │
│                         │   Slack    │                        │
│                         └────────────┘                        │
│                         Post to channel                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6. Node Execution Output
```
┌──────────────────────────────────────────────────────┐
│  Output                                              │
├──────────────────────────────────────────────────────┤
│  {                                                   │
│    "success": true,                                  │
│    "conversationId": "conv_1234567890",             │
│    "question": "What are the top 5 products...",    │
│    "answer": "Based on your sales data, here are    │
│               the top 5 products by revenue:\n\n    │
│               1. Product A - $125,450 (+15%)\n      │
│               2. Product B - $98,230 (+8%)\n        │
│               3. Product C - $87,910 (-3%)\n        │
│               4. Product D - $76,540 (+22%)\n       │
│               5. Product E - $65,320 (+5%)\n\n      │
│               Notable insights:\n                    │
│               - Product D shows exceptional growth   │
│               - Product C declining, needs attention│
│               ...",                                  │
│    "datasets": [1, 2],                              │
│    "personaId": 3,                                   │
│    "metadata": {                                     │
│      "timestamp": "2026-01-29T10:15:30Z",          │
│      "model": "gpt-4",                              │
│      "tokens_used": 450                             │
│    }                                                 │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

### 7. Persona Dropdown Options
```
┌──────────────────────────────────────────────────────┐
│  Persona *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ Data Detective                                 │ │ ← Default/Global
│  │ Sales Strategist                               │ │
│  │ Finance Analyst                                │ │
│  │ Marketing Guru                                 │ │
│  │ Customer Advocate                              │ │
│  │ Operations Optimizer                           │ │
│  │ Executive Advisor                              │ │
│  │ Growth Hacker                                  │ │
│  │ ──────────────────────────────────            │ │
│  │ My Custom Sales Agent                         │ │ ← User's personas
│  │ Q4 Analysis Specialist                        │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 8. Dataset Dropdown Options
```
┌──────────────────────────────────────────────────────┐
│  Datasets *                                          │
│  ┌────────────────────────────────────────────────┐ │
│  │ ☑ Sales Data Q4 2025                          │ │
│  │   Type: CSV                                    │ │
│  │                                                │ │
│  │ ☑ Product Catalog                             │ │
│  │   Type: Database                               │ │
│  │                                                │ │
│  │ ☐ Customer Feedback                           │ │
│  │   Latest customer survey responses             │ │
│  │                                                │ │
│  │ ☐ Financial Reports                           │ │
│  │   Type: Excel                                  │ │
│  │                                                │ │
│  │ ☐ Website Analytics                           │ │
│  │   Google Analytics data                        │ │
│  └────────────────────────────────────────────────┘ │
│  2 of 5 selected                                     │
└──────────────────────────────────────────────────────┘
```

### 9. Error State Examples

#### Invalid Credentials
```
┌──────────────────────────────────────────────────────┐
│  Draiven                                         [×] │
├──────────────────────────────────────────────────────┤
│  ⚠ Error                                             │
│  Authentication failed. Please check your            │
│  credentials.                                        │
│                                                      │
│  [Test Connection]                                   │
└──────────────────────────────────────────────────────┘
```

#### Missing Required Field
```
┌──────────────────────────────────────────────────────┐
│  Draiven                                         [×] │
├──────────────────────────────────────────────────────┤
│  ⚠ Validation Error                                  │
│  Please select at least one dataset                  │
│                                                      │
│  ⚠ Validation Error                                  │
│  Question is required                                │
└──────────────────────────────────────────────────────┘
```

#### Execution Error
```
┌──────────────────────────────────────────────────────┐
│  Output                                              │
├──────────────────────────────────────────────────────┤
│  {                                                   │
│    "success": false,                                 │
│    "error": "Dataset with ID 999 not found"         │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

## 🎯 User Experience Flow

```
1. User adds Draiven node
   ↓
2. Prompted to add credentials
   ↓
3. Enters API details → Tests → Saves
   ↓
4. Selects datasets (dropdown auto-loads)
   ↓
5. Selects persona (dropdown auto-loads)
   ↓
6. Types question
   ↓
7. (Optional) Adds conversation ID
   ↓
8. Executes workflow
   ↓
9. Receives structured AI response
   ↓
10. Uses {{ $json.answer }} in next nodes
```

## 🔄 Dynamic Loading Indicators

### While Loading Datasets
```
┌──────────────────────────────────────────────────────┐
│  Datasets *                                          │
│  ┌────────────────────────────────────────────────┐ │
│  │  ⟳ Loading datasets...                        │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### While Loading Personas
```
┌──────────────────────────────────────────────────────┐
│  Persona *                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │  ⟳ Loading personas...                        │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### During Execution
```
┌──────────────────────────────────────────────────────┐
│  Draiven                                             │
├──────────────────────────────────────────────────────┤
│  ⟳ Asking question to AI...                         │
│                                                      │
│  [████████░░░░░░░░░░] 45%                           │
└──────────────────────────────────────────────────────┘
```

## 🎨 Node Icon Visual

The node appears in the palette with this icon:

```
   ┌─────────┐
   │    D    │  ← Blue gradient circle
   │   ╱ ╲   │  ← Neural network pattern
   │  ●───●  │  ← White lines and nodes
   │   ╲ ╱   │  ← AI brain design
   └─────────┘
```

## 📱 Responsive Behavior

The node interface adapts to:
- Standard n8n panel width
- Mobile/tablet views (if applicable)
- Different screen resolutions
- Dark/light mode (follows n8n theme)

## 🚀 In Production

When used in a production workflow:

```
Real-world example: E-commerce Daily Report

Schedule (9 AM daily)
    ↓
HTTP Request (fetch yesterday's orders)
    ↓
Draiven Node
    - Datasets: [Order History, Product Catalog, Customer Data]
    - Persona: Sales Strategist
    - Question: "Analyze yesterday's sales performance..."
    ↓
IF Node (check for anomalies)
    ├─ Yes → Slack (alert management)
    └─ No  → Email (send regular report)
              ↓
          Google Sheets (log results)
```

This creates a powerful, automated insights pipeline! 🎯
