param(
    [string]$RepoUrl = "",
    [string]$CloneDir = "Wan2GP",
    [switch]$InstallPythonDeps,
    [string]$PythonExe = "",
    [string]$RootDir = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$LocalWan2GPDir = Join-Path $ProjectDir $CloneDir
$SourceFile = Join-Path $ScriptDir "wangp-source.json"

if (-not (Test-Path $SourceFile)) {
    throw "WanGP source manifest not found: $SourceFile"
}
$Source = Get-Content $SourceFile -Raw | ConvertFrom-Json
$ExpectedRevision = [string]$Source.revision
if ($ExpectedRevision -notmatch "^[0-9a-f]{40}$") {
    throw "WanGP revision must be a full 40-character Git SHA."
}
$ExpectedVersion = [string]$Source.wangpVersion
if (-not $ExpectedVersion) {
    throw "WanGP source manifest must define wangpVersion."
}
if (-not $RepoUrl) {
    $RepoUrl = [string]$Source.repository
}
if (-not $RepoUrl) {
    throw "WanGP source manifest must define repository."
}

function Resolve-Wan2GPDir {
    param(
        [string]$LocalDir,
        [string]$ExplicitRoot
    )

    if (Test-Path $LocalDir) {
        return (Resolve-Path $LocalDir).Path
    }

    $rawCandidates = @()
    if ($ExplicitRoot) {
        $rawCandidates += $ExplicitRoot
    }
    foreach ($envKey in "WANGP_ROOT", "WANGP_WGP_PATH") {
        $rawValue = [Environment]::GetEnvironmentVariable($envKey)
        if ($rawValue) {
            $rawCandidates += $rawValue
        }
    }

    foreach ($rawCandidate in $rawCandidates) {
        if (-not $rawCandidate) {
            continue
        }
        $candidate = $rawCandidate.Trim()
        if (-not $candidate) {
            continue
        }
        if (Test-Path $candidate -PathType Leaf) {
            if ([System.IO.Path]::GetFileName($candidate).ToLowerInvariant() -eq "wgp.py") {
                $candidate = Split-Path -Parent $candidate
            } else {
                continue
            }
        }
        if ((Test-Path $candidate -PathType Container) -and (Test-Path (Join-Path $candidate "wgp.py"))) {
            return (Resolve-Path $candidate).Path
        }
    }

    return $null
}

$Wan2GPDir = Resolve-Wan2GPDir -LocalDir $LocalWan2GPDir -ExplicitRoot $RootDir
$ResolvedLocalWan2GPDir = $null
if (Test-Path $LocalWan2GPDir) {
    $ResolvedLocalWan2GPDir = (Resolve-Path $LocalWan2GPDir).Path
}

if (-not $Wan2GPDir) {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "git not found. Install Git before running setup, or set WANGP_ROOT to an existing Wan2GP checkout."
    }
    Write-Host "Cloning Wan2GP into $LocalWan2GPDir..." -ForegroundColor Yellow
    git clone --filter=blob:none --branch $Source.branch --single-branch $RepoUrl $LocalWan2GPDir
    if ($LASTEXITCODE -ne 0) {
        throw "git clone failed for Wan2GP."
    }
    $Wan2GPDir = (Resolve-Path $LocalWan2GPDir).Path
    $ResolvedLocalWan2GPDir = $Wan2GPDir
    Write-Host "Using repo-local Wan2GP checkout at $Wan2GPDir" -ForegroundColor Green
} elseif ($ResolvedLocalWan2GPDir -and ((Resolve-Path $Wan2GPDir).Path -eq $ResolvedLocalWan2GPDir)) {
    Write-Host "Wan2GP checkout found at $Wan2GPDir" -ForegroundColor Green
} else {
    Write-Host "Using external Wan2GP checkout at $Wan2GPDir" -ForegroundColor Green
}

$IsLocalCheckout = $ResolvedLocalWan2GPDir -and ((Resolve-Path $Wan2GPDir).Path -eq $ResolvedLocalWan2GPDir)
if ($IsLocalCheckout) {
    $LocalChanges = @(git -c "safe.directory=$Wan2GPDir" -C $Wan2GPDir status --porcelain --untracked-files=no)
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to inspect WanGP checkout at $Wan2GPDir."
    }
    if ($LocalChanges.Count -gt 0) {
        throw "WanGP checkout has local source changes. Commit them in the WanGP fork or restore the pinned checkout before continuing."
    }
    $CurrentRevision = (git -c "safe.directory=$Wan2GPDir" -C $Wan2GPDir rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $CurrentRevision -ne $ExpectedRevision) {
        git -c "safe.directory=$Wan2GPDir" -C $Wan2GPDir fetch $RepoUrl $ExpectedRevision --depth 1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to fetch pinned WanGP revision $ExpectedRevision."
        }
        git -c "safe.directory=$Wan2GPDir" -C $Wan2GPDir checkout --detach $ExpectedRevision
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to check out pinned WanGP revision $ExpectedRevision."
        }
    }
}

$ActualRevision = (git -c "safe.directory=$Wan2GPDir" -C $Wan2GPDir rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $ActualRevision -ne $ExpectedRevision) {
    throw "WanGP revision mismatch. Expected $ExpectedRevision, found $ActualRevision."
}
Write-Host "WanGP revision: $ActualRevision" -ForegroundColor Green

$ApiFile = Join-Path $Wan2GPDir "shared\api.py"
$RequirementsFile = Join-Path $Wan2GPDir "requirements.txt"

if (-not (Test-Path $ApiFile)) {
    throw "Wan2GP checkout does not expose shared/api.py yet. Update the checkout to a version that includes the new API."
}

$VersionMatch = Select-String -Path (Join-Path $Wan2GPDir "wgp.py") -Pattern '^WanGP_version\s*=\s*"([^"]+)"$'
if (-not $VersionMatch -or $VersionMatch.Matches[0].Groups[1].Value -ne $ExpectedVersion) {
    throw "WanGP version mismatch. Expected $ExpectedVersion from $SourceFile."
}
Write-Host "WanGP source: $($Source.branch) @ $ExpectedVersion ($($Source.aivsTag))" -ForegroundColor Green

if ($InstallPythonDeps) {
    if (-not $PythonExe) {
        throw "PythonExe is required when -InstallPythonDeps is used."
    }
    if (-not (Test-Path $PythonExe)) {
        throw "Python executable not found at $PythonExe"
    }
    if (-not (Test-Path $RequirementsFile)) {
        throw "Wan2GP requirements.txt not found at $RequirementsFile"
    }

    Write-Host "Installing Wan2GP Python dependencies from $Wan2GPDir into $PythonExe..." -ForegroundColor Yellow
    uv pip install --python $PythonExe -r $RequirementsFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Wan2GP dependencies."
    }
}
