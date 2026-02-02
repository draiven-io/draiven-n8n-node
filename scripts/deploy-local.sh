#!/bin/bash
# Deploy Draiven node to n8n for local testing
# Run this after making changes to the node

echo -e "\033[0;32m🚀 Deploying Draiven node to n8n...\033[0m"

# Step 1: Build
echo -e "\033[0;33m📦 Building...\033[0m"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"
npm run build

if [ $? -ne 0 ]; then
    echo -e "\033[0;31m❌ Build failed!\033[0m"
    exit 1
fi

# Step 2: Copy to n8n
TARGET_DIR="$HOME/.n8n/nodes/node_modules/n8n-nodes-draiven"
echo -e "\033[0;33m📁 Copying to $TARGET_DIR...\033[0m"

# Remove old version
if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
fi

# Create directory
mkdir -p "$TARGET_DIR"

# Copy files (exclude development files)
rsync -av --exclude='node_modules' --exclude='.git' --exclude='scripts' \
    --exclude='*.md' --exclude='tsconfig.json' \
    "$SCRIPT_DIR/" "$TARGET_DIR/"

# Step 3: Install production dependencies
echo -e "\033[0;33m📥 Installing dependencies...\033[0m"
cd "$TARGET_DIR"
npm install --production --silent

echo ""
echo -e "\033[0;32m✅ Deployment complete!\033[0m"
echo ""
echo -e "\033[0;36mNext steps:\033[0m"
echo -e "\033[0;37m1. Start n8n: n8n start\033[0m"
echo -e "\033[0;37m2. Open: http://localhost:5678\033[0m"
echo -e "\033[0;37m3. Search for 'Draiven' in the nodes panel\033[0m"
echo ""
echo -e "\033[0;33m💡 The node should appear automatically!\033[0m"
