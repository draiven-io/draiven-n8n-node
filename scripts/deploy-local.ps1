# Deploy Draiven node to n8n for local testing
# Run this after making changes to the node

Write-Host "🚀 Deploying Draiven node to n8n..." -ForegroundColor Green

# Step 1: Build
Write-Host "📦 Building..." -ForegroundColor Yellow
cd d:\Projetos\draiven\draiven-n8n-node
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Copy to n8n
$targetDir = "$env:USERPROFILE\.n8n\nodes\node_modules\n8n-nodes-draiven"
Write-Host "📁 Copying to $targetDir..." -ForegroundColor Yellow

# Remove old version
if (Test-Path $targetDir) {
    Remove-Item $targetDir -Recurse -Force
}

# Create directory
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

# Copy files (exclude development files)
Copy-Item "d:\Projetos\draiven\draiven-n8n-node\*" -Destination $targetDir -Recurse -Force -Exclude @('node_modules', '.git', 'scripts', '*.md', 'tsconfig.json')

# Step 3: Install production dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
cd $targetDir
npm install --production --silent

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start n8n: n8n start" -ForegroundColor White
Write-Host "2. Open: http://localhost:5678" -ForegroundColor White
Write-Host "3. Search for 'Draiven' in the nodes panel" -ForegroundColor White
Write-Host ""
Write-Host "💡 The node should appear automatically!" -ForegroundColor Yellow
