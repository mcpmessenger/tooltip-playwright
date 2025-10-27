# Test OCR Functionality
Write-Host "========================================"
Write-Host "  Testing OCR on Screenshots"
Write-Host "========================================"
Write-Host ""

$baseUrl = "http://localhost:3000"

# Step 1: Test Health
Write-Host "Step 1: Checking server health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
    Write-Host "   Pool instances: $($healthJson.pool.totalInstances)" -ForegroundColor Gray
    Write-Host "   Cache size: $($healthJson.cache.size)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server not responding!" -ForegroundColor Red
    Write-Host "   Start server: cd playwright_service; npm start" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Step 2: Capture Screenshot
Write-Host "Step 2: Capturing screenshot..." -ForegroundColor Yellow
$testUrl = "https://example.com"
try {
    $body = @{
        url = $testUrl
    } | ConvertTo-Json
    
    Write-Host "   URL: $testUrl" -ForegroundColor Gray
    Write-Host "   Sending request..." -ForegroundColor Gray
    
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "$baseUrl/capture" -Method POST -ContentType "application/json" -Body $body
    $duration = ((Get-Date) - $startTime).TotalSeconds
    
    Write-Host "✅ Screenshot captured in $([math]::Round($duration, 2)) seconds!" -ForegroundColor Green
    
    $responseData = $response.Content | ConvertFrom-Json
    $screenshotSize = $responseData.screenshot.Length
    Write-Host "   Screenshot size: $($screenshotSize) bytes" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to capture screenshot: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "⏳ Waiting 5 seconds for OCR to process..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Get OCR Text
Write-Host ""
Write-Host "Step 3: Retrieving OCR text..." -ForegroundColor Yellow
try {
    $encodedUrl = [System.Web.HttpUtility]::UrlEncode($testUrl)
    $ocrUrl = "$baseUrl/ocr?url=$encodedUrl"
    Write-Host "   Requesting: $ocrUrl" -ForegroundColor Gray
    $ocrResponse = Invoke-WebRequest -Uri $ocrUrl -UseBasicParsing
    
    $ocrData = $ocrResponse.Content | ConvertFrom-Json
    
    if ($ocrData.ocrText -and $ocrData.ocrText.Trim()) {
        Write-Host "✅ OCR text extracted!" -ForegroundColor Green
        Write-Host "   Length: $($ocrData.ocrText.Length) characters" -ForegroundColor Gray
        Write-Host "   Timestamp: $($ocrData.ocrTimestamp)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Preview (first 200 chars):" -ForegroundColor Cyan
        Write-Host "   $($ocrData.ocrText.Substring(0, [Math]::Min(200, $ocrData.ocrText.Length)))..." -ForegroundColor White
    } else {
        Write-Host "⏳ OCR text not ready yet (still processing)" -ForegroundColor Yellow
        Write-Host "   Try again in a few seconds!" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Failed to get OCR text: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Test Complete"
Write-Host "========================================"

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Try capturing more screenshots" -ForegroundColor White
Write-Host "  2. Check server logs for OCR messages" -ForegroundColor White
Write-Host "  3. Test with different URLs" -ForegroundColor White

