param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$gameNode = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/qrcode'))) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
$gamePort = if ($env:PORT) { $env:PORT } else { '3000' }
$gameUrl = "http://localhost:$gamePort"
$gameHealthUrl = "http://127.0.0.1:$gamePort/api/config"
$gameReady = $false
try {
    $gameConfig = Invoke-RestMethod -Uri $gameHealthUrl -TimeoutSec 3
    $gameReady = $null -ne $gameConfig.publicUrl
} catch {}
if (-not $gameReady) {
    $gameProcess = Start-Process -FilePath $gameNode -ArgumentList 'server.js' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'server-error.log') -PassThru
    $gameProcess.Id | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'data-guardians.pid')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $gameConfig = Invoke-RestMethod -Uri $gameHealthUrl -TimeoutSec 3
            $gameReady = $null -ne $gameConfig.publicUrl
            if ($gameReady) { break }
        } catch {}
    }
}
if (-not $gameReady) { throw 'Server did not start. Check server-error.log or whether the port is already in use.' }
if (-not $NoBrowser) { Start-Process $gameUrl }
Write-Host "Data Guardians: $gameUrl"
Write-Host "Player network address: $($gameConfig.publicUrl)"
