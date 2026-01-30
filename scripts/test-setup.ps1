# Quick test script for Draiven n8n node
# This verifies the build and setup

Write-Host "🧪 Testing Draiven n8n Node Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if build exists
if (Test-Path "dist/nodes/Draiven/Draiven.node.js") {
    Write-Host "✅ Build files exist" -ForegroundColor Green
} else {
    Write-Host "❌ Build files not found. Run: npm run build" -ForegroundColor Red
    exit 1
}

# Check if package is linked
$linkedPackages = npm list -g n8n-nodes-draiven 2>&1
if ($linkedPackages -match "n8n-nodes-draiven") {
    Write-Host "✅ Package is globally linked" -ForegroundColor Green
} else {
    Write-Host "⚠️  Package not linked. Run: npm link" -ForegroundColor Yellow
}

# Check if n8n is installed
$n8nInstalled = Get-Command n8n -ErrorAction SilentlyContinue
if ($n8nInstalled) {
    Write-Host "✅ n8n is installed" -ForegroundColor Green
} else {
    Write-Host "❌ n8n not found. Install with: npm install -g n8n" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure your backend is running" -ForegroundColor White
Write-Host "2. Run: .\start-n8n-dev.ps1" -ForegroundColor White
Write-Host "3. Open: http://localhost:5678" -ForegroundColor White
Write-Host "4. Search for 'Draiven' in the node panel" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Development Mode:" -ForegroundColor Cyan
Write-Host "Terminal 1: .\watch-dev.ps1  (auto-rebuild on changes)" -ForegroundColor White
Write-Host "Terminal 2: .\start-n8n-dev.ps1  (run n8n)" -ForegroundColor White
