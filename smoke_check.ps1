Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root "Gugusay1.0"

function Invoke-Http {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [string]$Body
    )
    $args = @("-sS", "-m", "2", "-X", $Method)
    if ($Headers) {
        foreach ($k in $Headers.Keys) {
            $args += @("-H", "${k}: $($Headers[$k])")
        }
    }
    if ($Body) {
        $args += @("-H", "Content-Type: application/json", "--data", $Body)
    }
    $args += @("-w", "`n%{http_code}", $Url)

    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & curl.exe @args 2>$null
    $ErrorActionPreference = $oldEap
    if ($LASTEXITCODE -ne 0 -or -not $output) {
        return @{ status = 0; body = ""; ok = $false }
    }
    $text = ($output -join "`n")
    $lastBreak = $text.LastIndexOf("`n")
    if ($lastBreak -lt 0) {
        return @{ status = 0; body = $text; ok = $false }
    }
    $bodyText = $text.Substring(0, $lastBreak)
    $statusText = $text.Substring($lastBreak + 1).Trim()
    $statusCode = 0
    [void][int]::TryParse($statusText, [ref]$statusCode)
    return @{
        status = $statusCode
        body   = $bodyText
        ok     = ($statusCode -ge 200 -and $statusCode -lt 300)
    }
}

function Add-Result {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Name,
        [bool]$Pass,
        [string]$Detail
    )
    $List.Add([pscustomobject]@{
        Check  = $Name
        Result = $(if ($Pass) { "PASS" } else { "FAIL" })
        Detail = $Detail
    })
}

$results = New-Object 'System.Collections.Generic.List[object]'
$serverProc = $null
$stdoutLog = Join-Path $env:TEMP "twitter_smoke_server_out.log"
$stderrLog = Join-Path $env:TEMP "twitter_smoke_server_err.log"
$runnerPy = Join-Path $env:TEMP "twitter_smoke_runner.py"

try {
    $py = "python"
    $runnerCode = @"
import os
import sys
sys.path.insert(0, os.getcwd())
from backend.server import start_server
start_server()
"@
    Set-Content -Path $runnerPy -Value $runnerCode -Encoding UTF8
    if (Test-Path $stdoutLog) { Remove-Item $stdoutLog -Force }
    if (Test-Path $stderrLog) { Remove-Item $stderrLog -Force }
    $serverProc = Start-Process -FilePath $py -ArgumentList @($runnerPy) -WorkingDirectory $src -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

    $ready = $false
    for ($i = 0; $i -lt 25; $i++) {
        if ($serverProc.HasExited) { break }
        Start-Sleep -Milliseconds 200
        $probe = Invoke-Http -Method "GET" -Url "http://localhost:3000/api/update/config" -Headers $null -Body $null
        if ($probe.status -eq 200) {
            $ready = $true
            break
        }
    }

    $startDetail = "API reachable"
    if (-not $ready) {
        $errText = ""
        if (Test-Path $stderrLog) { $errText = (Get-Content $stderrLog -Raw) }
        if ((-not $errText) -and (Test-Path $stdoutLog)) { $errText = (Get-Content $stdoutLog -Raw) }
        $startDetail = if ($errText) { $errText.Trim() } else { "API not reachable on :3000" }
    }
    Add-Result -List $results -Name "Server start" -Pass $ready -Detail $startDetail
    if (-not $ready) {
        Write-Host "Server start error detail: $startDetail" -ForegroundColor Red
        throw "Server did not start in time."
    }

    $cfgResp = Invoke-Http -Method "GET" -Url "http://localhost:3000/api/update/config" -Headers $null -Body $null
    $cfgOk = $false
    $token = ""
    if ($cfgResp.status -eq 200) {
        $cfg = $cfgResp.body | ConvertFrom-Json
        $cfgOk = ($null -ne $cfg.owner -and $null -ne $cfg.repo -and $null -ne $cfg.channel -and $null -ne $cfg.request_token)
        if ($cfgOk) { $token = [string]$cfg.request_token }
    }
    Add-Result -List $results -Name "GET /api/update/config shape" -Pass $cfgOk -Detail "owner/repo/channel/request_token present"

    $checkNoToken = Invoke-Http -Method "GET" -Url "http://localhost:3000/api/update/check" -Headers $null -Body $null
    Add-Result -List $results -Name "GET /api/update/check without token" -Pass ($checkNoToken.status -eq 403) -Detail "status=$($checkNoToken.status)"

    $headers = @{ "X-Update-Token" = $token }
    $checkWithToken = Invoke-Http -Method "GET" -Url "http://localhost:3000/api/update/check" -Headers $headers -Body $null
    Add-Result -List $results -Name "GET /api/update/check with token" -Pass ($checkWithToken.status -eq 200) -Detail "status=$($checkWithToken.status)"

    $legacy = Invoke-Http -Method "POST" -Url "http://localhost:3000/api/update/download" -Headers $headers -Body "{}"
    Add-Result -List $results -Name "Legacy endpoint removed (/api/update/download)" -Pass ($legacy.status -eq 404) -Detail "status=$($legacy.status)"

    $progressBody = '{"lastViewedId":123,"lastViewedDatetime":"2026-02-25 12:34"}'
    $progressSave = Invoke-Http -Method "POST" -Url "http://localhost:3000/api/progress" -Headers $null -Body $progressBody
    if ($progressSave.status -ne 200) {
        $progressSave = Invoke-Http -Method "POST" -Url "http://localhost:3000/api/reading-progress" -Headers $null -Body $progressBody
    }
    $progressLoad = Invoke-Http -Method "GET" -Url "http://localhost:3000/api/progress" -Headers $null -Body $null
    $progressOk = ($progressLoad.status -eq 200)
    if ($progressSave.status -eq 200 -and $progressLoad.status -eq 200) {
        try {
            $p = $progressLoad.body | ConvertFrom-Json
            $progressOk = ($p.progress.last_viewed_id -eq 123)
        } catch {}
    }
    Add-Result -List $results -Name "POST/GET /api/progress" -Pass $progressOk -Detail "save=$($progressSave.status), load=$($progressLoad.status)"
}
finally {
    if ($serverProc -and -not $serverProc.HasExited) {
        Stop-Process -Id $serverProc.Id -Force
    }
    if (Test-Path $runnerPy) {
        Remove-Item $runnerPy -Force
    }
}

$results | Format-Table -AutoSize
$failed = @($results | Where-Object { $_.Result -eq "FAIL" }).Count
if ($failed -gt 0) {
    Write-Host ""
    Write-Host "Smoke check finished with $failed failure(s)." -ForegroundColor Red
    exit 1
}
else {
    Write-Host ""
    Write-Host "Smoke check passed." -ForegroundColor Green
    exit 0
}
