try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body '{"username": "admin", "password": "root@123456"}' -ContentType "application/json"
    $token = $loginResp.data.accessToken
    Write-Host "Login success, token obtained."

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $body = @{
        "busId" = 1
        "tripId" = 6
        "driverId" = 4
        "status" = "SCHEDULED"
        "notes" = "Test from API Script to verify DB save"
    } | ConvertTo-Json

    $assignResp = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/operation/bus-assignments" -Method Post -Headers $headers -Body $body
    Write-Host "Create Assignment Success:"
    $assignResp | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
}
