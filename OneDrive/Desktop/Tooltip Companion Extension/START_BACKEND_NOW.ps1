# Start Backend Server for Tooltip Companion Extension

Write-Host "🚀 Starting backend server..." -ForegroundColor Green

# Navigate to playwright_service directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "playwright_service")

Write-Host "📁 Directory: $(Get-Location)" -ForegroundColor Cyan

# Check if server.js exists
if (Test-Path "server.js") {
    Write-Host "✅ Found server.js" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Starting Node.js server on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Keep this terminal open!" -ForegroundColor Yellow
    Write-Host ""
    
    # Start the server
    node server.js
} else {
    Write-Host "❌ server.js not found!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Red
}

