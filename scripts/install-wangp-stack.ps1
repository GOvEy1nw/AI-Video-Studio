param(
    [string]$Stack = "",                  # cu130 | cu128 | "" (auto-detect)
    [string]$GpuGeneration = "",          # RTX_50 | RTX_40 | RTX_30 | RTX_20 | GTX_10 | "" (auto-detect)
    [string]$PythonExe = "",              # backend venv python; defaults to backend\.venv\Scripts\python.exe
    [string]$UvExe = "",                  # bundled uv.exe; defaults to PATH
    [switch]$SkipWan2gpRequirements,      # skip Wan2GP/requirements.txt (debug only)
    [switch]$SkipWan2gpCheckout,           # use an already-packaged Wan2GP directory
    [switch]$List                          # print detected stack and exit
)

$ErrorActionPreference = "Stop"

function Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Skip($msg) { Write-Host "[SKIP] $msg" -ForegroundColor DarkGray }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$StacksFile = Join-Path $ScriptDir "wangp-stacks.json"

if (-not (Test-Path $StacksFile)) {
    throw "Stack config not found: $StacksFile"
}

$Config = Get-Content $StacksFile -Raw | ConvertFrom-Json

if (-not $PythonExe) {
    $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
}
if (-not $List -and -not (Test-Path $PythonExe)) {
    throw "Backend Python venv not found at $PythonExe. Run pnpm setup:dev:win first to create the venv."
}

if (-not $UvExe) {
    $UvCommand = Get-Command uv -ErrorAction SilentlyContinue
    if (-not $UvCommand) {
        throw "uv not found. Provide -UvExe or install uv."
    }
    $UvExe = $UvCommand.Source
}
if (-not $List -and -not (Test-Path $UvExe)) {
    throw "uv executable not found at $UvExe"
}

# ---------------------------------------------------------------------------
# GPU generation detection via nvidia-smi.
# ---------------------------------------------------------------------------
function Detect-GpuGeneration {
    $nvidiaSmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
    if (-not $nvidiaSmi) {
        Write-Host "[WARN] nvidia-smi not found; cannot auto-detect GPU generation." -ForegroundColor Yellow
        return $null
    }

    try {
        $output = & nvidia-smi --query-gpu=name --format=csv,noheader 2>&1
        $name = ($output | Select-Object -First 1).Trim()
    } catch {
        Write-Host "[WARN] nvidia-smi query failed: $_" -ForegroundColor Yellow
        return $null
    }

    Write-Host "Detected GPU: $name" -ForegroundColor Cyan

    # Map NVIDIA product names to architecture generations. The RTX 50
    # series (Blackwell) needs CUDA 12.8+/13.x; RTX 40 (Ada) and RTX 30
    # (Ampere) work on either stack but prefer cu130; RTX 20 (Turing) and
    # GTX 10 (Pascal) lack the compute capability for sparge/lightx2v.
    if ($name -match "RTX 50\d{2}") { return "RTX_50" }
    if ($name -match "RTX 40\d{2}") { return "RTX_40" }
    if ($name -match "RTX 30\d{2}") { return "RTX_30" }
    if ($name -match "RTX 20\d{2}") { return "RTX_20" }
    if ($name -match "GTX 10\d{2}") { return "GTX_10" }

    Write-Host "[WARN] Could not classify GPU '$name' into a known generation." -ForegroundColor Yellow
    return $null
}

function Resolve-Stack {
    param([string]$Gpu)

    # RTX 50 (Blackwell) needs cu130 for full support. RTX 30/40 also
    # prefer cu130 (the recommended WanGP stack). RTX 20 / GTX 10 fall
    # back to cu128. Unknown GPU defaults to cu128 (broader compat).
    if ($Gpu -in @("RTX_50", "RTX_40", "RTX_30")) { return "cu130" }
    return "cu128"
}

# ---------------------------------------------------------------------------
# Resolve the active stack + GPU generation.
# ---------------------------------------------------------------------------
if (-not $GpuGeneration) {
    $GpuGeneration = Detect-GpuGeneration
    if (-not $GpuGeneration) {
        $GpuGeneration = "RTX_40"  # safe default for the auto-detect-failed case
        Write-Host "[WARN] Defaulting GPU generation to $GpuGeneration." -ForegroundColor Yellow
    }
}

if (-not $Stack) {
    $Stack = Resolve-Stack -Gpu $GpuGeneration
}

$StackDef = $Config.stacks.$Stack
if (-not $StackDef) {
    throw "Unknown stack '$Stack'. Available: $($Config.stacks.PSObject.Properties.Name -join ', ')"
}

$kernels = $Config.auto_kernels_by_gpu.$GpuGeneration
if (-not $kernels) {
    Write-Host "[WARN] No kernel list for GPU generation '$GpuGeneration'; installing none." -ForegroundColor Yellow
    $kernels = @()
}

Write-Host ""
Write-Host "Stack:       $Stack - $($StackDef.label)" -ForegroundColor Cyan
Write-Host "GPU class:   $GpuGeneration" -ForegroundColor Cyan
Write-Host "Kernels:     $($kernels -join ', ')" -ForegroundColor Cyan
Write-Host "Python:      $PythonExe" -ForegroundColor Cyan
Write-Host ""

if ($List) {
    return
}

# ---------------------------------------------------------------------------
# Install torch stack first so subsequent wheel installs can resolve
# against the correct CUDA runtime.
# ---------------------------------------------------------------------------
Write-Host "Installing torch stack ($Stack)..." -ForegroundColor Yellow
$torchArgs = $StackDef.torch -split ' '
# torch==2.10.0 torchvision==0.25.0 torchaudio==2.10.0 --index-url https://...
# Use --force-reinstall so the stack installer can override whatever
# version `uv sync` pulled in from pyproject.toml (e.g. switching from
# cu130 to cu128 on older GPUs requires downgrading torch).
$uvArgs = @("pip", "install", "--python", $PythonExe, "--force-reinstall") + $torchArgs
& $UvExe @uvArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install torch stack."
}
Ok "torch stack installed"

# ---------------------------------------------------------------------------
# Install curated kernel wheels. Each entry in `kernels` is a key into
# the stack definition (e.g. "sage2", "flash"); the corresponding value
# is either a URL (install the wheel directly) or a PyPI spec (install
# normally). Empty string entries are skipped.
# ---------------------------------------------------------------------------
foreach ($kernel in $kernels) {
    $spec = $StackDef.$kernel
    if (-not $spec) {
        Skip "$kernel has no spec for stack $Stack"
        continue
    }

    Write-Host "Installing kernel '$kernel'..." -ForegroundColor Yellow
    if ($spec -like "http*") {
        & $UvExe pip install --python $PythonExe $spec
    } else {
        $parts = $spec -split ' '
        & $UvExe pip install --python $PythonExe @parts
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install kernel '$kernel' ($spec)."
    }
    Ok "$kernel installed"
}

# ---------------------------------------------------------------------------
# bitsandbytes (always installed regardless of GPU generation).
# ---------------------------------------------------------------------------
if ($StackDef.bitsandbytes) {
    Write-Host "Installing bitsandbytes..." -ForegroundColor Yellow
    & $UvExe pip install --python $PythonExe $StackDef.bitsandbytes
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install bitsandbytes."
    }
    Ok "bitsandbytes installed"
}

# ---------------------------------------------------------------------------
# Wan2GP's own requirements.txt (everything else WanGP needs).
# ---------------------------------------------------------------------------
if (-not $SkipWan2gpRequirements) {
    # Ensure the Wan2GP checkout exists (idempotent - skips clone if present).
    if (-not $SkipWan2gpCheckout) {
        & (Join-Path $ScriptDir "ensure-wan2gp.ps1")
        if ($LASTEXITCODE -ne 0) {
            throw "ensure-wan2gp.ps1 failed; cannot install Wan2GP requirements."
        }
    }
    $LocalWan2GPDir = Join-Path $ProjectDir "Wan2GP"
    if (Test-Path $LocalWan2GPDir) {
        $RequirementsFile = Join-Path (Resolve-Path $LocalWan2GPDir) "requirements.txt"
        if (Test-Path $RequirementsFile) {
            Write-Host "Installing Wan2GP requirements.txt..." -ForegroundColor Yellow
            & $UvExe pip install --python $PythonExe -r $RequirementsFile
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install Wan2GP requirements.txt."
            }
            Ok "Wan2GP requirements installed"
        } else {
            Write-Host "[WARN] Wan2GP requirements.txt not found; skipping." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARN] Wan2GP checkout not found; run ensure-wan2gp.ps1 first." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "WanGP stack '$Stack' installed for $GpuGeneration" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

