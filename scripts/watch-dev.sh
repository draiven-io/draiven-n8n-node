#!/bin/bash
# Development workflow for the Draiven n8n node
# This script watches for changes and rebuilds automatically

echo -e "\033[0;32m👀 Starting watch mode for Draiven node...\033[0m"
echo -e "\033[0;36mFiles will be automatically rebuilt on save\033[0m"
echo -e "\033[0;33mRemember to restart n8n to see changes\033[0m"
echo ""

# Start TypeScript compiler in watch mode
npm run dev
