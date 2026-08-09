param(
    [switch]$CheckOnly,
    [switch]$InstallPythonDeps,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$Wan2GPDir = Join-Path $ProjectDir "Wan2GP"
$SourceFile = Join-Path $ScriptDir "wangp-source.json"
$FocusedTests = @(
    "backend/tests/test_wangp_bridge.py",
    "backend/tests/test_wangp_model_packs.py",
    "backend/tests/test_prompt_relay.py",
    "backend/tests/test_director_generation.py",
    "backend/tests/test_director_compiler.py",
    "backend/tests/test_reframe_wangp_mapping.py",
    "backend/tests/test_wangp_source.py"
)

function Assert-LastExitCode([string]$Message) {
    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

if (-not (Test-Path $SourceFile)) {
    throw "WanGP source manifest not found: $SourceFile"
}
if (-not (Test-Path (Join-Path $Wan2GPDir ".git"))) {
    throw "Repo-local WanGP Git checkout not found: $Wan2GPDir"
}

$Source = Get-Content $SourceFile -Raw | ConvertFrom-Json
$RepoUrl = [string]$Source.repository
$Branch = [string]$Source.branch
if (-not $RepoUrl) {
    throw "WanGP source manifest must define repository."
}
if (-not $Branch) {
    throw "WanGP source manifest must define branch."
}
$RemoteLine = git ls-remote $RepoUrl "refs/heads/$Branch"
Assert-LastExitCode "Failed to resolve WanGP branch $Branch from $RepoUrl."
if (-not $RemoteLine) {
    throw "WanGP branch not found: $Branch"
}
$CandidateRevision = ($RemoteLine -split "\s+")[0]

$GitArgs = @("-c", "safe.directory=$Wan2GPDir", "-C", $Wan2GPDir)
$CurrentRevision = (git @GitArgs rev-parse HEAD).Trim()
Assert-LastExitCode "Failed to read current WanGP revision."

git @GitArgs fetch $RepoUrl $CandidateRevision --depth 1
Assert-LastExitCode "Failed to fetch WanGP branch head $CandidateRevision."

$ChangedFiles = @(git @GitArgs diff --name-only $CurrentRevision $CandidateRevision)
Assert-LastExitCode "Failed to compare WanGP revisions."

Write-Host "WanGP candidate" -ForegroundColor Cyan
Write-Host "  source:   $RepoUrl"
Write-Host "  branch:   $Branch"
Write-Host "  current:  $CurrentRevision"
Write-Host "  candidate:$CandidateRevision"
git @GitArgs diff --shortstat $CurrentRevision $CandidateRevision
Assert-LastExitCode "Failed to summarize WanGP candidate."

$SensitivePatterns = @(
    "shared/api.py",
    "wgp.py",
    "requirements.txt",
    "defaults/*",
    "models/*/*_handler.py"
)
$SensitiveFiles = @($ChangedFiles | Where-Object {
    $File = $_
    $SensitivePatterns | Where-Object { $File -like $_ }
})
if ($SensitiveFiles.Count -gt 0) {
    Write-Host "Compatibility review required:" -ForegroundColor Yellow
    $SensitiveFiles | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "No bridge, dependency, model-handler, or default-profile files changed." -ForegroundColor Green
}

if ($CheckOnly) {
    Write-Host "Check-only complete; checkout and manifest unchanged." -ForegroundColor Green
    exit 0
}

$LocalChanges = @(git @GitArgs status --porcelain --untracked-files=no)
Assert-LastExitCode "Failed to inspect WanGP checkout."
if ($LocalChanges.Count -gt 0) {
    throw "WanGP checkout has local source changes. Commit them in the fork or restore the checkout first."
}

try {
    git @GitArgs checkout --detach $CandidateRevision
    Assert-LastExitCode "Failed to check out WanGP branch head $CandidateRevision."

    $PythonFiles = @($ChangedFiles | Where-Object { $_.EndsWith(".py") } | ForEach-Object { Join-Path $Wan2GPDir $_ } | Where-Object { Test-Path $_ })
    if ($PythonFiles.Count -gt 0) {
        uv run --project $BackendDir python -m py_compile @PythonFiles
        Assert-LastExitCode "WanGP Python compilation failed."
    }

    if ($InstallPythonDeps) {
        $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
        if (-not (Test-Path $PythonExe)) {
            throw "Backend Python environment not found: $PythonExe"
        }
        & (Join-Path $ScriptDir "install-wangp-stack.ps1") -PythonExe $PythonExe -SkipWan2gpCheckout
        Assert-LastExitCode "WanGP dependency installation failed."
    } elseif ($ChangedFiles -contains "requirements.txt") {
        Write-Warning "requirements.txt changed. Re-run with -InstallPythonDeps before GPU testing."
    }

    uv run --project $BackendDir rtk pytest -q @FocusedTests --tb=short
    Assert-LastExitCode "Focused WanGP compatibility tests failed."

    if ($Full) {
        pnpm typecheck
        Assert-LastExitCode "Typecheck failed."
        uv run --project $BackendDir rtk pytest -q (Join-Path $BackendDir "tests") --tb=short
        Assert-LastExitCode "Backend test suite failed."
        pnpm build:frontend
        Assert-LastExitCode "Frontend build failed."
    }
} catch {
    git @GitArgs checkout --detach $CurrentRevision | Out-Null
    Write-Warning "WanGP checkout restored to $CurrentRevision."
    throw
}

Write-Host "WanGP AiVS branch head validated." -ForegroundColor Green
Write-Host "Manual GPU gate: Z-Image, LTX2, Prompt Relay default/high epsilon, cancellation, model reload." -ForegroundColor Yellow
