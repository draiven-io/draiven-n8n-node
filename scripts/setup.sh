#!/bin/bash

echo "🚀 Setting up Draiven n8n Node..."
echo ""

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Build the node: npm run build"
    echo "   2. Link for local testing: npm link"
    echo "   3. In your n8n folder: npm link n8n-nodes-draiven"
    echo "   4. Restart n8n to see the Draiven node"
    echo ""
    echo "🔗 Or publish to npm: npm publish"
else
    echo ""
    echo "❌ Failed to install dependencies"
    exit 1
fi
