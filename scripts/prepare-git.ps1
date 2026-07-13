param(
    [string]$OutputDir = "git-bootstrap"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$OutputPath = Join-Path $ProjectDir $OutputDir
$TempDir = Join-Path $env:TEMP "aivs-mingit"
$ArchivePath = Join-Path $TempDir "mingit.zip"
$MinGitVersion = "2.55.0.2"
$MinGitUrl = "https://github.com/git-for-windows/git/releases/download/v2.55.0.windows.2/MinGit-$MinGitVersion-64-bit.zip"
$MinGitSha256 = "e3ea2944cea4b3fabcd69c7c1669ef69b1b66c05ac7806d81224d0abad2dec31"

if (Test-Path $OutputPath) { Remove-Item -Recurse -Force $OutputPath }
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

try {
    Invoke-WebRequest -Uri $MinGitUrl -OutFile $ArchivePath -UseBasicParsing
    $ActualSha256 = (Get-FileHash -Path $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ActualSha256 -ne $MinGitSha256) {
        throw "MinGit checksum mismatch. Expected $MinGitSha256, got $ActualSha256."
    }

    Expand-Archive -Path $ArchivePath -DestinationPath $OutputPath -Force
    $GitExe = Join-Path $OutputPath "cmd\git.exe"
    if (-not (Test-Path $GitExe)) { throw "MinGit executable not found after extraction." }

    $GitVersion = & $GitExe --version
    if ($LASTEXITCODE -ne 0) { throw "Bundled Git verification failed." }
    Write-Host "Git bootstrap ready: $GitVersion" -ForegroundColor Green
} finally {
    Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
}
