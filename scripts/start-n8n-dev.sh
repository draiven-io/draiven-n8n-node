#!/bin/bash
# Start n8n with the local Draiven node for testing
# This script sets up the environment and starts n8n

echo -e "\033[0;32m🚀 Starting n8n with local Draiven node...\033[0m"

# Set the custom extensions path to THIS directory (no npm link needed!)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export N8N_CUSTOM_EXTENSIONS="$SCRIPT_DIR"

# Optional: Set other n8n environment variables
export N8N_PORT="5678"
# export N8N_LOG_LEVEL="debug"

echo -e "\033[0;36m📦 Custom extensions path: $N8N_CUSTOM_EXTENSIONS\033[0m"
echo -e "\033[0;36m🌐 n8n will be available at: http://localhost:5678\033[0m"
echo -e "\033[0;33m⚠️  Make sure to run 'npm run build' after any code changes!\033[0m"
echo ""

# Start n8n
n8n start
