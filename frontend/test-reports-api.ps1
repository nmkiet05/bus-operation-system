# Test Report APIs - Phase 1
# Usage: ./test-reports-api.ps1

$baseUrl = "http://localhost:8080"
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Report APIs" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Date Range: $fromDate to $toDate" -ForegroundColor Yellow
Write-Host ""

# Test 1: Revenue Report
Write-Host "[TEST 1] GET /api/reports/revenue" -ForegroundColor Green
$url = "$baseUrl/api/reports/revenue?fromDate=$fromDate&toDate=$toDate&granularity=day"
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
    } -ErrorAction Stop
    
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "Summary: " -ForegroundColor Yellow
    if ($response.data.summary) {
        $response.data.summary | ConvertTo-Json | Write-Host
    } else {
        Write-Host "  (No data)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Load Factor Report
Write-Host "[TEST 2] GET /api/reports/load-factor" -ForegroundColor Green
$url = "$baseUrl/api/reports/load-factor?fromDate=$fromDate&toDate=$toDate&granularity=day"
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
    } -ErrorAction Stop
    
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "Summary: " -ForegroundColor Yellow
    if ($response.data.summary) {
        $response.data.summary | ConvertTo-Json | Write-Host
    } else {
        Write-Host "  (No data)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Revenue with seat class filter
Write-Host "[TEST 3] GET /api/reports/revenue (filtered by BUSINESS)" -ForegroundColor Green
$url = "$baseUrl/api/reports/revenue?fromDate=$fromDate&toDate=$toDate&seatClass=BUSINESS&granularity=day"
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
    } -ErrorAction Stop
    
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "Breakdown (by seatClass): " -ForegroundColor Yellow
    if ($response.data.breakdown) {
        $response.data.breakdown | ConvertTo-Json | Write-Host
    } else {
        Write-Host "  (No data)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing completed!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
