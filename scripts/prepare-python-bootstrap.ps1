param(
    [string]$PythonVersion = (Get-Content "$PSScriptRoot\..\backend\.python-version" -Raw).Trim(),
    [string]$OutputDir = "python-bootstrap"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$OutputPath = Join-Path $ProjectDir $OutputDir
$TempDir = Join-Path $env:TEMP "aivs-python-bootstrap"
$PythonUrl = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"
$GetPipUrl = "https://bootstrap.pypa.io/get-pip.py"

if (Test-Path $OutputPath) { Remove-Item -Recurse -Force $OutputPath }
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

$PythonZip = Join-Path $TempDir "python-embed.zip"
Invoke-WebRequest -Uri $PythonUrl -OutFile $PythonZip -UseBasicParsing
Expand-Archive -Path $PythonZip -DestinationPath $OutputPath -Force

$PthFile = Get-ChildItem -Path $OutputPath -Filter "python*._pth" | Select-Object -First 1
if (-not $PthFile) { throw "Embedded Python path configuration not found." }
$PthContent = Get-Content $PthFile.FullName
$PthContent = $PthContent | ForEach-Object {
    if ($_ -match "^#import site") { "import site" } else { $_ }
}
Set-Content -Path $PthFile.FullName -Value $PthContent -Encoding ascii

$PythonExe = Join-Path $OutputPath "python.exe"
$GetPipPath = Join-Path $TempDir "get-pip.py"
Invoke-WebRequest -Uri $GetPipUrl -OutFile $GetPipPath -UseBasicParsing
& $PythonExe $GetPipPath --no-warn-script-location
if ($LASTEXITCODE -ne 0) { throw "pip bootstrap failed." }
& $PythonExe -m pip install --upgrade pip uv --no-warn-script-location --quiet
if ($LASTEXITCODE -ne 0) { throw "uv bootstrap failed." }

$UvExe = Join-Path $OutputPath "Scripts\uv.exe"
if (-not (Test-Path $UvExe)) { throw "Bundled uv executable not found." }
Remove-Item -Recurse -Force $TempDir
Write-Host "Python bootstrap ready: $OutputPath" -ForegroundColor Green
