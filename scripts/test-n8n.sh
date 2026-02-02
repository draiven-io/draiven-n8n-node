#!/bin/bash
# Test n8n with Draiven node - Direct method
# This bypasses npm link and loads directly

echo -e "\033[0;32m🧪 Testing n8n with Draiven node...\033[0m"
echo ""

# Clear n8n cache
echo -e "\033[0;33m🗑️  Clearing n8n cache...\033[0m"
N8N_DIR="$HOME/.n8n"
if [ -d "$N8N_DIR/cache" ]; then
    rm -rf "$N8N_DIR/cache"
    echo -e "\033[0;32m✅ Cache cleared\033[0m"
fi

# Get the absolute path to this project
PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "\033[0;36m📦 Node location: $PROJECT_PATH\033[0m"

# Set environment variables
export N8N_CUSTOM_EXTENSIONS="$PROJECT_PATH"
export NODE_FUNCTION_ALLOW_BUILTIN="*"
export NODE_FUNCTION_ALLOW_EXTERNAL="*"

echo -e "\033[0;36m🌐 Starting n8n on http://localhost:5678\033[0m"
echo -e "\033[0;33m⏳ Wait for 'Editor is now accessible' message...\033[0m"
echo ""
echo -e "\033[0;31mIf node doesn't appear:\033[0m"
echo -e "\033[0;37m  1. Check browser console (F12) for errors\033[0m"
echo -e "\033[0;37m  2. Look for 'Loaded nodes:' in terminal output\033[0m"
echo -e "\033[0;37m  3. Try: npm install -g n8n@latest\033[0m"
echo ""

# Start n8n
n8n start
