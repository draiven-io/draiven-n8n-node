# Start n8n with the local Draiven node for testing
# This script sets up the environment and starts n8n

Write-Host "🚀 Starting n8n with local Draiven node..." -ForegroundColor Green

# Set the custom extensions path to THIS directory (no npm link needed!)
$scriptDir = Split-Path -Parent $PSScriptRoot
$env:N8N_CUSTOM_EXTENSIONS = $scriptDir

# Optional: Set other n8n environment variables
$env:N8N_PORT = "5678"
# $env:N8N_LOG_LEVEL = "debug"

Write-Host "📦 Custom extensions path: $env:N8N_CUSTOM_EXTENSIONS" -ForegroundColor Cyan
Write-Host "🌐 n8n will be available at: http://localhost:5678" -ForegroundColor Cyan
Write-Host "⚠️  Make sure to run 'npm run build' after any code changes!" -ForegroundColor Yellow
Write-Host ""

# Start n8n
n8n start
