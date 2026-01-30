# Test n8n with Draiven node - Direct method
# This bypasses npm link and loads directly

Write-Host "🧪 Testing n8n with Draiven node..." -ForegroundColor Green
Write-Host ""

# Clear n8n cache
Write-Host "🗑️  Clearing n8n cache..." -ForegroundColor Yellow
$n8nDir = "$env:USERPROFILE\.n8n"
if (Test-Path "$n8nDir\cache") {
    Remove-Item "$n8nDir\cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache cleared" -ForegroundColor Green
}

# Get the absolute path to this project
$projectPath = Split-Path -Parent $PSScriptRoot
Write-Host "📦 Node location: $projectPath" -ForegroundColor Cyan

# Set environment variables
$env:N8N_CUSTOM_EXTENSIONS = $projectPath
$env:NODE_FUNCTION_ALLOW_BUILTIN = "*"
$env:NODE_FUNCTION_ALLOW_EXTERNAL = "*"

Write-Host "🌐 Starting n8n on http://localhost:5678" -ForegroundColor Cyan
Write-Host "⏳ Wait for 'Editor is now accessible' message..." -ForegroundColor Yellow
Write-Host ""
Write-Host "If node doesn't appear:" -ForegroundColor Red
Write-Host "  1. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "  2. Look for 'Loaded nodes:' in terminal output" -ForegroundColor White
Write-Host "  3. Try: npm install -g n8n@latest" -ForegroundColor White
Write-Host ""

# Start n8n
n8n start
