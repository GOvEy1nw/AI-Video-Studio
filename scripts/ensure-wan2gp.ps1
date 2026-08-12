param(
    [ValidateSet('External', 'Managed')][string]$Mode = 'External',
    [string]$RootDir = '',
    [string]$GitExe = ''
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceFile = Join-Path $ScriptDir 'wangp-source.json'

function Resolve-WanGPRoot([string]$Value) {
    if (-not $Value) { return $null }
    $candidate = $Value.Trim()
    if (Test-Path $candidate -PathType Leaf) {
        if ((Split-Path -Leaf $candidate).ToLowerInvariant() -ne 'wgp.py') { return $null }
        $candidate = Split-Path -Parent $candidate
    }
    if (-not (Test-Path $candidate -PathType Container)) { return $null }
    return (Resolve-Path $candidate).Path
}

function Test-WanGPRoot([string]$Path) {
    foreach ($relative in @('wgp.py', 'shared\api.py', 'requirements.txt')) {
        if (-not (Test-Path (Join-Path $Path $relative) -PathType Leaf)) {
            throw "WanGP source is missing $relative at $Path"
        }
    }
}

function Move-WanGPDirectory([string]$Source, [string]$Destination) {
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            [IO.Directory]::Move($Source, $Destination)
            return
        } catch {
            if ($attempt -eq 20) { throw }
            Start-Sleep -Milliseconds 100
        }
    }
}

if ($Mode -eq 'External') {
    $externalRoot = Resolve-WanGPRoot $env:WANGP_ROOT
    if (-not $externalRoot) { $externalRoot = Resolve-WanGPRoot $env:WANGP_WGP_PATH }
    if (-not $externalRoot) {
        throw 'Set WANGP_ROOT or WANGP_WGP_PATH to an external Wan2GP checkout containing wgp.py, shared/api.py, and requirements.txt.'
    }
    Test-WanGPRoot $externalRoot
    Write-Host "Using external WanGP checkout at $externalRoot" -ForegroundColor Green
    return
}

if (-not $RootDir) { throw 'RootDir is required for managed WanGP setup.' }
if (-not (Test-Path $SourceFile)) { throw "WanGP source manifest not found: $SourceFile" }
if (-not $GitExe -or -not (Test-Path $GitExe -PathType Leaf)) { throw 'A bundled Git executable is required for managed WanGP setup.' }

$GitExe = (Resolve-Path $GitExe).Path
$GitRoot = Split-Path -Parent (Split-Path -Parent $GitExe)
$GitBin = Join-Path $GitRoot 'mingw64\bin'
$GitUsrBin = Join-Path $GitRoot 'usr\bin'
$GitExecPath = $GitBin
$GitCaBundle = Join-Path $GitRoot 'mingw64\etc\ssl\certs\ca-bundle.crt'
if (-not (Test-Path (Join-Path $GitBin 'git-remote-https.exe'))) { throw "Bundled Git HTTPS helper is missing: $GitBin" }
if (-not (Test-Path $GitCaBundle -PathType Leaf)) { throw "Bundled Git CA bundle is missing: $GitCaBundle" }
$env:PATH = "$GitBin;$GitUsrBin;$env:PATH"
$env:GIT_EXEC_PATH = $GitExecPath

$Source = Get-Content $SourceFile -Raw | ConvertFrom-Json
$Repository = [string]$Source.repository
$Branch = [string]$Source.branch
if (-not $Repository -or -not $Branch) { throw 'WanGP source manifest must define repository and branch.' }

$target = [IO.Path]::GetFullPath($RootDir)
$parent = Split-Path -Parent $target
New-Item -ItemType Directory -Force -Path $parent | Out-Null
$candidate = "$target.candidate-$PID-$([guid]::NewGuid().ToString('N'))"
$backup = "$target.backup-$PID-$([guid]::NewGuid().ToString('N'))"

try {
    Write-Host "Cloning WanGP $Branch into a temporary runtime directory..." -ForegroundColor Yellow
    & $GitExe -c http.sslBackend=openssl -c "http.sslCAInfo=$GitCaBundle" clone --filter=blob:none --branch $Branch --single-branch $Repository $candidate
    if ($LASTEXITCODE -ne 0) { throw "Failed to clone WanGP branch $Branch." }
    Test-WanGPRoot $candidate

    if (Test-Path $target) { Move-WanGPDirectory $target $backup }
    try {
        Move-WanGPDirectory $candidate $target
        Test-WanGPRoot $target
    } catch {
        if (Test-Path $target) { Remove-Item -LiteralPath $target -Recurse -Force }
        if (Test-Path $backup) { Move-WanGPDirectory $backup $target }
        throw
    }
    if (Test-Path $backup) { Remove-Item -LiteralPath $backup -Recurse -Force }
    Write-Host "Managed WanGP source ready at $target" -ForegroundColor Green
} finally {
    if (Test-Path $candidate) { Remove-Item -LiteralPath $candidate -Recurse -Force }
}
