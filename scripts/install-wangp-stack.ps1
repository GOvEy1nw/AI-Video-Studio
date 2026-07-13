param(
    [string]$PythonExe = "",              # backend venv python; defaults to backend\.venv\Scripts\python.exe
    [string]$UvExe = "",                  # bundled uv.exe; defaults to PATH
    [switch]$SkipWan2gpRequirements,      # skip Wan2GP/requirements.txt (debug only)
    [switch]$SkipWan2gpCheckout,          # use an already-packaged Wan2GP directory
    [switch]$List                          # print detected runtime and exit
)

$ErrorActionPreference = "Stop"

function Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Skip($msg) { Write-Host "[SKIP] $msg" -ForegroundColor DarkGray }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$StacksFile = Join-Path $ScriptDir "wangp-stacks.json"

if (-not (Test-Path $StacksFile)) { throw "Stack config not found: $StacksFile" }
$Config = Get-Content $StacksFile -Raw | ConvertFrom-Json
$StackDef = $Config.stack
if (-not $StackDef) { throw "Single CUDA stack definition is missing." }

if (-not $PythonExe) { $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe" }
if (-not $List -and -not (Test-Path $PythonExe)) {
    throw "Backend Python venv not found at $PythonExe. Run pnpm setup:dev:win first to create the venv."
}

if (-not $UvExe) {
    $UvCommand = Get-Command uv -ErrorAction SilentlyContinue
    if (-not $UvCommand) { throw "uv not found. Provide -UvExe or install uv." }
    $UvExe = $UvCommand.Source
}
if (-not $List -and -not (Test-Path $UvExe)) { throw "uv executable not found at $UvExe" }

function Get-SupportedGpu {
    $NvidiaSmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
    if (-not $NvidiaSmi) {
        throw "NVIDIA GPU tools not found. AiVS requires an RTX 20, 30, 40 or 50 series GPU with NVIDIA driver $($Config.minimum_driver) or newer."
    }

    $Output = & $NvidiaSmi.Source --query-gpu=name,driver_version --format=csv,noheader 2>&1
    if ($LASTEXITCODE -ne 0) { throw "nvidia-smi failed: $($Output -join ' ')" }

    foreach ($Line in $Output) {
        $Parts = ([string]$Line).Split(",", 2)
        if ($Parts.Count -ne 2) { continue }
        $Name = $Parts[0].Trim()
        $DriverText = $Parts[1].Trim()
        if ($Name -notmatch "\bRTX\s+(20|30|40|50)\d{2}\b") { continue }

        try { $Driver = [version]$DriverText } catch { throw "Cannot parse NVIDIA driver version '$DriverText'." }
        $MinimumDriver = [version]$Config.minimum_driver
        if ($Driver -lt $MinimumDriver) {
            throw "NVIDIA driver $DriverText is unsupported. AiVS requires driver $($Config.minimum_driver) or newer for CUDA 13.0."
        }

        return [PSCustomObject]@{
            Name = $Name
            Driver = $DriverText
            Generation = "RTX_$($Matches[1])"
        }
    }

    $Names = ($Output | ForEach-Object { ([string]$_).Split(",", 2)[0].Trim() }) -join ", "
    throw "Unsupported NVIDIA GPU: $Names. AiVS requires an RTX 20, 30, 40 or 50 series GPU. GTX cards are not supported."
}

$Gpu = Get-SupportedGpu
$Kernels = $Config.auto_kernels_by_gpu.($Gpu.Generation)
if (-not $Kernels) { throw "Kernel set is missing for GPU generation '$($Gpu.Generation)'." }

Write-Host ""
Write-Host "Runtime:      $($StackDef.id) - $($StackDef.label)" -ForegroundColor Cyan
Write-Host "GPU:          $($Gpu.Name)" -ForegroundColor Cyan
Write-Host "GPU class:    $($Gpu.Generation)" -ForegroundColor Cyan
Write-Host "Driver:       $($Gpu.Driver)" -ForegroundColor Cyan
Write-Host "Kernels:      $($Kernels -join ', ')" -ForegroundColor Cyan
Write-Host "Python:       $PythonExe" -ForegroundColor Cyan
Write-Host ""

if ($List) { return }

Write-Host "Installing torch stack ($($StackDef.id))..." -ForegroundColor Yellow
$TorchArgs = $StackDef.torch -split " "
$UvArgs = @("pip", "install", "--python", $PythonExe, "--force-reinstall") + $TorchArgs
& $UvExe @UvArgs
if ($LASTEXITCODE -ne 0) { throw "Failed to install torch stack." }
Ok "torch stack installed"

foreach ($Kernel in $Kernels) {
    $Spec = $StackDef.$Kernel
    if (-not $Spec) {
        Skip "$Kernel has no spec for runtime $($StackDef.id)"
        continue
    }

    Write-Host "Installing kernel '$Kernel'..." -ForegroundColor Yellow
    if ($Spec -like "http*") {
        & $UvExe pip install --python $PythonExe $Spec
    } else {
        $Parts = $Spec -split " "
        & $UvExe pip install --python $PythonExe @Parts
    }
    if ($LASTEXITCODE -ne 0) { throw "Failed to install kernel '$Kernel' ($Spec)." }
    Ok "$Kernel installed"
}

if ($StackDef.bitsandbytes) {
    Write-Host "Installing bitsandbytes..." -ForegroundColor Yellow
    & $UvExe pip install --python $PythonExe $StackDef.bitsandbytes
    if ($LASTEXITCODE -ne 0) { throw "Failed to install bitsandbytes." }
    Ok "bitsandbytes installed"
}

if (-not $SkipWan2gpRequirements) {
    if (-not $SkipWan2gpCheckout) {
        & (Join-Path $ScriptDir "ensure-wan2gp.ps1")
        if ($LASTEXITCODE -ne 0) { throw "ensure-wan2gp.ps1 failed; cannot install Wan2GP requirements." }
    }

    $LocalWan2GPDir = Join-Path $ProjectDir "Wan2GP"
    if (Test-Path $LocalWan2GPDir) {
        $RequirementsFile = Join-Path (Resolve-Path $LocalWan2GPDir) "requirements.txt"
        if (Test-Path $RequirementsFile) {
            Write-Host "Installing Wan2GP requirements.txt..." -ForegroundColor Yellow
            & $UvExe pip install --python $PythonExe -r $RequirementsFile
            if ($LASTEXITCODE -ne 0) { throw "Failed to install Wan2GP requirements.txt." }
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
Write-Host "WanGP runtime '$($StackDef.id)' installed for $($Gpu.Generation)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
