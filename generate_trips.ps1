# Bulk Generate Trips for ALL Routes — 2026-04-21 to 2026-05-05
$BASE_URL = "http://localhost:8080"
$FROM_DATE = "2026-04-21"
$TO_DATE   = "2026-05-05"

# Helper: null-coalesce for older PS
function NullCoal($a, $b) { if ($null -ne $a) { return $a } else { return $b } }

# Step 1: Login
Write-Host "`n[1] Logging in..." -ForegroundColor Cyan
$loginBody = '{"username":"admin","password":"root@123456"}'
$loginResp = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$TOKEN = NullCoal $loginResp.result.token $loginResp.result.accessToken
if (-not $TOKEN) { Write-Host "LOGIN FAILED!" -ForegroundColor Red; exit 1 }
Write-Host "Token OK: $($TOKEN.Substring(0,20))..." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $TOKEN" }

# Step 2: Get all routes
Write-Host "`n[2] Fetching routes..." -ForegroundColor Cyan
$routeResp = Invoke-RestMethod -Uri "$BASE_URL/api/planning/routes?size=100" -Method GET -Headers $headers
$routeList = $routeResp.result
if ($routeList -is [System.Management.Automation.PSCustomObject]) {
    $routes = $routeList.content
} else {
    $routes = $routeList
}
Write-Host "Found $($routes.Count) routes:" -ForegroundColor Green
$routes | ForEach-Object { Write-Host "  ID=$($_.id) | $($_.name)" }

# Step 3: Generate trips per route
Write-Host "`n[3] Generating trips ($FROM_DATE to $TO_DATE)..." -ForegroundColor Cyan
$totalCreated = 0
$totalSkipped = 0

foreach ($route in $routes) {
    $bodyObj = @{ routeId = [int]$route.id; fromDate = $FROM_DATE; toDate = $TO_DATE; forceRegenerate = $false }
    $body = $bodyObj | ConvertTo-Json -Compress
    try {
        $resp = Invoke-RestMethod -Uri "$BASE_URL/api/operation/trips/generate" -Method POST -ContentType "application/json" -Headers $headers -Body $body
        $created = NullCoal $resp.result.totalTripsCreated 0
        $skipped = NullCoal $resp.result.totalSkipped 0
        $totalCreated += $created
        $totalSkipped += $skipped
        $shortName = if ($route.name.Length -gt 35) { $route.name.Substring(0,35) } else { $route.name }
        Write-Host "  [OK] Route $($route.id) '$shortName' -> +$created trips, skipped: $skipped" -ForegroundColor Green
    } catch {
        Write-Host "  [ERR] Route $($route.id): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host "TOTAL CREATED : $totalCreated" -ForegroundColor Green
Write-Host "TOTAL SKIPPED : $totalSkipped" -ForegroundColor Gray

# Step 4: Verify per-date
Write-Host "`n[4] Trip count by date:" -ForegroundColor Cyan
$dates = @("2026-04-21","2026-04-22","2026-04-23","2026-04-24","2026-04-25","2026-04-26","2026-04-27","2026-04-28","2026-04-29","2026-04-30","2026-05-01","2026-05-02","2026-05-03","2026-05-04","2026-05-05")
foreach ($date in $dates) {
    try {
        $resp = Invoke-RestMethod -Uri "$BASE_URL/api/operation/trips?fromDate=$date&toDate=$date&size=1" -Method GET -Headers $headers
        $trips = $resp.result
        if ($trips -is [System.Array]) { $count = $trips.Count }
        elseif ($null -ne $trips.totalElements) { $count = $trips.totalElements }
        else { $count = 0 }
        $color = if ($count -gt 0) { "Green" } else { "Red" }
        Write-Host "  $date -> $count trips" -ForegroundColor $color
    } catch {
        Write-Host "  $date -> ERROR" -ForegroundColor Red
    }
}
Write-Host "`nDone! Refresh admin page to see trips." -ForegroundColor Green
