try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body '{"username": "admin", "password": "root@123456"}' -ContentType "application/json"
    $token = $loginResp.result.token
    Write-Host "Login success, token obtained."

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    # 1) Public endpoint smoke test
    $publicResp = Invoke-RestMethod -Uri "http://localhost:8080/api/catalog/provinces" -Method Get
    Write-Host "Public endpoint success: /api/catalog/provinces"

    # 2) Protected endpoint smoke test
    $fleetResp = Invoke-RestMethod -Uri "http://localhost:8080/api/fleet/buses" -Method Get -Headers $headers
    Write-Host "Protected endpoint success: /api/fleet/buses"
    $fleetResp | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
}
