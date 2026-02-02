#!/bin/bash
# Start n8n with Draiven node (using npm link method)
# This ensures n8n loads the linked community node

echo -e "\033[0;32m🚀 Starting n8n with linked Draiven node...\033[0m"
echo ""

# Ensure npm is in PATH
if ! command -v npm &> /dev/null; then
    echo -e "\033[0;33m❌ npm not found in PATH.\033[0m"
    exit 1
fi

# Disable community package management (we're using linked package directly)
export N8N_DISABLE_PRODUCTION_MAIN_PROCESS="true"

# Enable external modules - allow all for development
export NODE_FUNCTION_ALLOW_EXTERNAL="*"
export NODE_FUNCTION_ALLOW_BUILTIN="*"

# Point n8n to load nodes from the linked location
export N8N_CUSTOM_EXTENSIONS="$(npm root -g)/n8n/node_modules"

echo -e "\033[0;36m🔧 npm path: $(which npm)\033[0m"
echo -e "\033[0;36m📦 Custom extensions: $N8N_CUSTOM_EXTENSIONS\033[0m"
echo -e "\033[0;36m🌐 Starting n8n on http://localhost:5678...\033[0m"
echo ""
echo -e "\033[0;32m✅ The Draiven node should appear automatically!\033[0m"
echo -e "\033[0;37m   Search for 'Draiven' in the nodes panel\033[0m"
echo ""

# Start n8n
n8n start
