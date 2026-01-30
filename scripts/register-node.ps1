# Install Draiven node in n8n
# This registers the linked node as a community node

Write-Host "📦 Installing Draiven node in n8n..." -ForegroundColor Green

$dbPath = "$env:USERPROFILE\.n8n\database.sqlite"

if (-not (Test-Path $dbPath)) {
    Write-Host "❌ n8n database not found. Please start n8n at least once first." -ForegroundColor Red
    exit 1
}

# Check if node is already installed
$query = "SELECT * FROM installed_packages WHERE packageName = 'n8n-nodes-draiven';"
$result = sqlite3 $dbPath $query 2>&1

if ($result -match "n8n-nodes-draiven") {
    Write-Host "✅ Node is already installed in n8n database" -ForegroundColor Green
} else {
    Write-Host "⚠️  Node not found in database. Installing..." -ForegroundColor Yellow
    
    # Insert the package into the database
    $insertQuery = @"
INSERT INTO installed_packages (packageName, installedVersion, updateAvailable, createdAt, updatedAt)
VALUES ('n8n-nodes-draiven', '0.1.2', '', datetime('now'), datetime('now'));
"@
    
    sqlite3 $dbPath $insertQuery
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node registered successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to register node. Try manual installation through n8n UI." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Now restart n8n and the Draiven node should appear!" -ForegroundColor Cyan
