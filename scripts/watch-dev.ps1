# Development workflow for the Draiven n8n node
# This script watches for changes and rebuilds automatically

Write-Host "👀 Starting watch mode for Draiven node..." -ForegroundColor Green
Write-Host "Files will be automatically rebuilt on save" -ForegroundColor Cyan
Write-Host "Remember to restart n8n to see changes" -ForegroundColor Yellow
Write-Host ""

# Start TypeScript compiler in watch mode
npm run dev
