param(
    [Parameter(Mandatory = $true)][string]$PythonExe,
    [Parameter(Mandatory = $true)][string]$ProjectDir
)

$ErrorActionPreference = "Stop"
$env:PYTHONWARNINGS = "ignore:The pynvml package is deprecated.*:FutureWarning"
$BackendDir = Join-Path $ProjectDir "backend"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UvExe = Join-Path (Split-Path -Parent $PythonExe) "Scripts\uv.exe"
$PythonRoot = Split-Path -Parent $PythonExe
$PythonVersion = (Get-Content (Join-Path $BackendDir ".python-version") -Raw).Trim()
$RequirementsFile = Join-Path $env:TEMP "aivs-requirements-$PID.txt"
$FilteredRequirementsFile = Join-Path $env:TEMP "aivs-requirements-no-torch-$PID.txt"
$WanGPRoot = Join-Path $ProjectDir "Wan2GP"

if (-not (Test-Path $PythonExe)) { throw "Bundled Python not found: $PythonExe" }
if (-not (Test-Path $UvExe)) { throw "Bundled uv not found: $UvExe" }
if (-not (Test-Path (Join-Path $BackendDir "uv.lock"))) { throw "Pinned dependency lock is missing." }
if (-not (Test-Path $WanGPRoot)) { throw "Bundled WanGP checkout is missing: $WanGPRoot" }

try {
    Write-Output "AIVS_STEP:1:Resolving pinned dependencies"
    & $UvExe export --frozen --no-hashes --no-editable --no-emit-project --no-header --no-annotate --project $BackendDir |
        Set-Content -Path $RequirementsFile -Encoding utf8
    if ($LASTEXITCODE -ne 0) { throw "uv export failed." }
    Get-Content $RequirementsFile |
        Where-Object { $_ -notmatch "^(torch|torchvision|torchaudio)(\[.*\])?\s*[=<>!~]" } |
        Set-Content -Path $FilteredRequirementsFile -Encoding utf8

    Write-Output "AIVS_STEP:2:Installing GPU runtime"
    & (Join-Path $ScriptDir "install-wangp-stack.ps1") -PythonExe $PythonExe -UvExe $UvExe -SkipWan2gpCheckout
    if ($LASTEXITCODE -ne 0) { throw "WanGP GPU stack install failed." }

    Write-Output "AIVS_STEP:3:Installing application dependencies"
    & $UvExe pip install -r $FilteredRequirementsFile --index-strategy unsafe-best-match --python $PythonExe
    if ($LASTEXITCODE -ne 0) { throw "Application dependency install failed." }

    Write-Output "AIVS_STEP:4:Installing Python headers"
    & $UvExe python install $PythonVersion --quiet
    if ($LASTEXITCODE -ne 0) { throw "Python header runtime download failed." }
    $UvPython = & $UvExe python find $PythonVersion 2>$null
    if (-not $UvPython) { throw "Matching uv-managed Python not found." }
    $UvPrefix = & $UvPython -c "import sys; print(sys.prefix)"
    $IncludeSource = Join-Path $UvPrefix "Include"
    if (-not (Test-Path $IncludeSource)) { $IncludeSource = Join-Path $UvPrefix "include" }
    $LibsSource = Join-Path $UvPrefix "libs"
    if (-not (Test-Path $IncludeSource) -or -not (Test-Path $LibsSource)) {
        throw "Matching Python headers or import libraries are unavailable."
    }
    Copy-Item -Path $IncludeSource -Destination (Join-Path $PythonRoot "Include") -Recurse -Force
    Copy-Item -Path $LibsSource -Destination (Join-Path $PythonRoot "libs") -Recurse -Force

    Write-Output "AIVS_STEP:5:Verifying runtime"
    & $PythonExe -c "import fastapi, torch; from ltx_pipelines import distilled; print(torch.__version__)"
    if ($LASTEXITCODE -ne 0) { throw "Runtime verification failed." }

} finally {
    Remove-Item -Force $RequirementsFile, $FilteredRequirementsFile -ErrorAction SilentlyContinue
}
