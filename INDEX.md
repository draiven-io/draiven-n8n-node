> **⚠️ Outdated (as of v0.3.0).**
> This document describes the removed SignalR streaming and persona-based flow.
> The node now uses the Conversations REST API with agent selection.
> See [README.md](./README.md) for current behavior. Rewrite tracked as follow-up.

# 📚 Draiven n8n Node - Documentation Index

Welcome! This directory contains a complete n8n community node for integrating Draiven AI into your workflows.

## 🚀 Quick Navigation

### Getting Started
- **[COMPLETE.md](./COMPLETE.md)** - ⭐ Start here! Project completion summary and status
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute installation and usage guide
- **[README.md](./README.md)** - User-facing documentation

### For Developers
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive developer guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and diagrams
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Implementation details
- **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** - UI preview and user experience

### Setup & Testing
- **[setup.sh](./setup.sh)** - Automated setup script
- **[test.sh](./test.sh)** - Testing and validation script

## 📋 What This Node Does

The Draiven n8n node allows you to:
1. ✅ Authenticate with your Draiven account (email + API key)
2. ✅ Select datasets from your Draiven workspace
3. ✅ Choose AI personas for specialized analysis
4. ✅ Ask questions and get AI-powered insights
5. ✅ Use responses in your n8n workflows

## 🎯 Three Requirements - All Implemented

### ✅ 1. Authentication
- User email and API key configuration
- Basic Auth implementation
- Credential testing

### ✅ 2. Dataset Selection
- Integrated with `GET /datasets` endpoint
- Multi-select dropdown
- Dynamic loading from your account

### ✅ 3. Persona Selection
- Integrated with `GET /personas` endpoint
- Single-select dropdown
- Shows all your available personas

## 📖 Documentation Overview

| Document | Purpose | Audience |
|----------|---------|----------|
| **COMPLETE.md** | Project status & summary | Everyone |
| **QUICKSTART.md** | Fast setup guide | End users |
| **README.md** | User documentation | End users |
| **DEVELOPMENT.md** | Developer guide | Developers |
| **ARCHITECTURE.md** | Technical details | Developers |
| **PROJECT_SUMMARY.md** | Implementation notes | Developers |
| **VISUAL_GUIDE.md** | UI/UX preview | Everyone |

## 🏃 Quick Start Commands

```bash
# Setup (first time)
./setup.sh

# Build the node
npm run build

# Test and validate
./test.sh

# Link for local testing
npm link

# Format code
npm run format

# Check linting
npm run lint

# Publish to npm
npm publish
```

## 📁 Project Structure

```
draiven-n8n-node/
├── 📋 Documentation
│   ├── COMPLETE.md           ← Project status
│   ├── QUICKSTART.md         ← Quick start
│   ├── README.md             ← User docs
│   ├── DEVELOPMENT.md        ← Dev guide
│   ├── ARCHITECTURE.md       ← Architecture
│   ├── PROJECT_SUMMARY.md    ← Summary
│   ├── VISUAL_GUIDE.md       ← UI preview
│   └── INDEX.md              ← This file
│
├── 🔐 Credentials
│   └── credentials/
│       └── DraivenApi.credentials.ts
│
├── 🎨 Node Implementation
│   └── nodes/
│       └── Draiven/
│           ├── Draiven.node.ts
│           └── draiven.svg
│
├── ⚙️ Configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.js
│   ├── .prettierrc.js
│   ├── gulpfile.js
│   ├── .gitignore
│   └── .npmignore
│
├── 🔧 Scripts
│   ├── setup.sh
│   └── test.sh
│
└── 📄 Legal
    └── LICENSE
```

## 🎓 Learning Path

### For End Users
1. Read [COMPLETE.md](./COMPLETE.md) for overview
2. Follow [QUICKSTART.md](./QUICKSTART.md) to install
3. Reference [README.md](./README.md) for details
4. Check [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) for UI help

### For Developers
1. Read [COMPLETE.md](./COMPLETE.md) for status
2. Study [ARCHITECTURE.md](./ARCHITECTURE.md) for design
3. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) to contribute
4. Reference [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for implementation

## 🔗 External Resources

- **Draiven Platform**: https://app.draiven.io
- **Draiven API Docs**: https://api.draiven.io/docs
- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **Node Development**: https://docs.n8n.io/integrations/creating-nodes/

## 📊 Current Status

**Status**: ✅ **READY FOR TESTING**

All three requirements implemented:
- ✅ User & API Key authentication
- ✅ Dataset selection with API integration
- ✅ Persona selection with API integration

## 🎯 What's Next?

You mentioned "do this first, and then we continue" - Phase 1 is complete!

**Possible next steps**:
1. Test the node with your Draiven API
2. Add more operations (conversations history, etc.)
3. Implement streaming responses
4. Add webhook support
5. Create example workflows
6. Publish to npm

**Ready when you are!** 🚀

## 💡 Need Help?

- **Issues**: Create an issue on GitHub
- **Email**: support@draiven.ai
- **Documentation**: Check the relevant .md file above
- **n8n Community**: Ask on community.n8n.io

---

**Built with ❤️ for the n8n and Draiven communities**
