param(
    [switch]$CheckOnly,
    [switch]$Full
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir 'backend'
$SourceFile = Join-Path $ScriptDir 'wangp-source.json'
$FocusedTests = @(
    'backend/tests/test_wangp_bridge.py',
    'backend/tests/test_wangp_model_packs.py',
    'backend/tests/test_director_generation.py',
    'backend/tests/test_director_compiler.py',
    'backend/tests/test_reframe_wangp_mapping.py',
    'backend/tests/test_wangp_source.py'
)

function Assert-LastExitCode([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Resolve-ExternalWanGPRoot {
    foreach ($value in @($env:WANGP_ROOT, $env:WANGP_WGP_PATH)) {
        if (-not $value) { continue }
        $root = $value.Trim()
        if (Test-Path $root -PathType Leaf) { $root = Split-Path -Parent $root }
        if ((Test-Path (Join-Path $root 'wgp.py')) -and (Test-Path (Join-Path $root 'shared\api.py')) -and (Test-Path (Join-Path $root 'requirements.txt'))) {
            return (Resolve-Path $root).Path
        }
    }
    throw 'Set WANGP_ROOT or WANGP_WGP_PATH to an external Wan2GP checkout containing wgp.py, shared/api.py, and requirements.txt.'
}

if (-not (Test-Path $SourceFile)) { throw "WanGP source manifest not found: $SourceFile" }
$Source = Get-Content $SourceFile -Raw | ConvertFrom-Json
$RepoUrl = [string]$Source.repository
$Branch = [string]$Source.branch
if (-not $RepoUrl -or -not $Branch) { throw 'WanGP source manifest must define repository and branch.' }

$WanGPRoot = Resolve-ExternalWanGPRoot
if (-not (Test-Path (Join-Path $WanGPRoot '.git'))) { throw "External WanGP checkout is not a Git checkout: $WanGPRoot" }
$CurrentRevision = (git -c "safe.directory=$WanGPRoot" -C $WanGPRoot rev-parse HEAD).Trim()
Assert-LastExitCode 'Failed to read current external WanGP revision.'
$RemoteLine = git ls-remote $RepoUrl "refs/heads/$Branch"
Assert-LastExitCode "Failed to resolve WanGP branch $Branch from $RepoUrl."
if (-not $RemoteLine) { throw "WanGP branch not found: $Branch" }
$CandidateRevision = ($RemoteLine -split '\s+')[0]

Write-Host 'WanGP external source' -ForegroundColor Cyan
Write-Host "  root:     $WanGPRoot"
Write-Host "  source:   $RepoUrl"
Write-Host "  branch:   $Branch"
Write-Host "  current:  $CurrentRevision"
Write-Host "  remote:   $CandidateRevision"
if ($CurrentRevision -eq $CandidateRevision) {
    Write-Host 'External source matches the configured AiVS branch head.' -ForegroundColor Green
} else {
    Write-Warning 'External source differs from the configured AiVS branch head. Update it in its owning WanGP checkout; AiVS will not modify it.'
}

if ($CheckOnly) { exit 0 }

uv run --project $BackendDir rtk pytest -q @FocusedTests --tb=short
Assert-LastExitCode 'Focused WanGP compatibility tests failed.'

if ($Full) {
    pnpm typecheck
    Assert-LastExitCode 'Typecheck failed.'
    pnpm build:frontend
    Assert-LastExitCode 'Frontend build failed.'
}

Write-Host 'External WanGP source validated without modification.' -ForegroundColor Green
