# Run n8n in Docker with local Draiven node

Write-Host "🐳 Starting n8n in Docker with local node..." -ForegroundColor Green

# Build and run with volume mount
docker run -it --rm `
  --name n8n-dev `
  -p 5678:5678 `
  -v "${PWD}:/data/custom" `
  -e N8N_CUSTOM_EXTENSIONS="/data/custom" `
  n8nio/n8n
