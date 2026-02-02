#!/bin/bash
# Run n8n in Docker with local Draiven node

echo -e "\033[0;32m🐳 Starting n8n in Docker with local node...\033[0m"

# Build and run with volume mount
docker run -it --rm \
  --name n8n-dev \
  -p 5678:5678 \
  -v "$(pwd):/data/custom" \
  -e N8N_CUSTOM_EXTENSIONS="/data/custom" \
  n8nio/n8n
