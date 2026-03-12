try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body '{"username": "admin", "password": "root@123456"}' -ContentType "application/json"
    $token = $loginResp.data.accessToken
    Write-Host "Login success, token obtained."

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }

    $body = @{
        "busId"          = 2
        "startDepotId"   = 1
        "scheduledStart" = "2026-03-10T21:00:00"
        "scheduledEnd"   = "2026-03-11T05:00:00"
        "tripIds"        = @(6, 7)
        "notes"          = "Test DB persistence using API"
    } | ConvertTo-Json -Depth 3

    $assignResp = Invoke-RestMethod -Uri "http://localhost:8080/api/bus-assignments" -Method Post -Headers $headers -Body $body
    Write-Host "Create Assignment Success:"
    $assignResp | ConvertTo-Json -Depth 3 | Write-Host
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
}
