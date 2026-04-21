$loginBody = '{"username":"admin","password":"root@123456"}'
$loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$TOKEN = $loginResp.result.token
if (-not $TOKEN) { $TOKEN = $loginResp.result.accessToken }
$headers = @{ Authorization = "Bearer $TOKEN" }
$date = "2026-04-21"
$resp = Invoke-RestMethod -Uri "http://localhost:8080/api/operation/trips?fromDate=$date&toDate=$date" -Method GET -Headers $headers
$trips = if ($resp.result -is [System.Array]) { $resp.result } else { $resp.result.content }
Write-Host "Total trips on $date : $($trips.Count)"
$unassigned = $trips | Where-Object { $null -eq $_.busId -and $null -eq $_.busLicensePlate }
Write-Host "Unassigned (no bus): $($unassigned.Count)"
if ($trips.Count -gt 0) {
    Write-Host "Sample trip 1 busId: $($trips[0].busId)"
    Write-Host "Sample trip 1 status: $($trips[0].status)"
    Write-Host "Sample date: $($trips[0].departureDate)"
}
