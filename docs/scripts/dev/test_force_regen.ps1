$loginBody = '{"username":"admin","password":"root@123456"}'
$loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$TOKEN = $loginResp.result.token
if (-not $TOKEN) { $TOKEN = $loginResp.result.accessToken }
$headers = @{ Authorization = "Bearer $TOKEN" }

# Force regenerate route 1
$bodyObj = @{ routeId = 1; fromDate = "2026-04-21"; toDate = "2026-05-20"; forceRegenerate = $true }
$body = $bodyObj | ConvertTo-Json -Compress

try {
    $resp = Invoke-RestMethod -Uri "http://localhost:8080/api/operation/trips/generate" -Method POST -ContentType "application/json" -Headers $headers -Body $body
    Write-Host "Success! Created: $($resp.result.totalTripsCreated), Skipped: $($resp.result.totalSkipped)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResp = $reader.ReadToEnd()
        Write-Host "Details: $errResp"
    }
}
