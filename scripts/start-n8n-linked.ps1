# Start n8n with Draiven node (using npm link method)
# This ensures n8n loads the linked community node

Write-Host "🚀 Starting n8n with linked Draiven node..." -ForegroundColor Green
Write-Host ""

# Ensure npm is in PATH
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
    Write-Host "❌ npm not found in PATH. Adding default npm location..." -ForegroundColor Yellow
    $env:Path += ";$env:APPDATA\npm;$env:ProgramFiles\nodejs"
}

# Disable community package management (we're using linked package directly)
$env:N8N_DISABLE_PRODUCTION_MAIN_PROCESS = "true"

# Enable external modules - allow all for development
$env:NODE_FUNCTION_ALLOW_EXTERNAL = "*"
$env:NODE_FUNCTION_ALLOW_BUILTIN = "*"

# Point n8n to load nodes from the linked location
$env:N8N_CUSTOM_EXTENSIONS = "C:\Users\Dhiogo\AppData\Roaming\npm\node_modules\n8n\node_modules"

Write-Host "🔧 npm path: $npmPath" -ForegroundColor Cyan
Write-Host "📦 Custom extensions: $env:N8N_CUSTOM_EXTENSIONS" -ForegroundColor Cyan
Write-Host "🌐 Starting n8n on http://localhost:5678..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ The Draiven node should appear automatically!" -ForegroundColor Green
Write-Host "   Search for 'Draiven' in the nodes panel" -ForegroundColor White
Write-Host ""

# Start n8n
n8n start
