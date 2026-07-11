param(
    [string]$SourceDir = "python-embed",
    [string]$OutputDir = "release",
    [int]$PartSizeMB = 1900
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$SourcePath = Join-Path $ProjectDir $SourceDir
$OutputPath = Join-Path $ProjectDir $OutputDir
$ArchivePath = Join-Path $OutputPath "python-embed-win32.tar.gz"

if (-not (Test-Path $SourcePath -PathType Container)) {
    throw "Python runtime directory not found: $SourcePath"
}

New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
Remove-Item -Force $ArchivePath -ErrorAction SilentlyContinue
Get-ChildItem -Path $OutputPath -Filter "python-embed-win32.part*" | Remove-Item -Force

tar -czf $ArchivePath -C (Split-Path -Parent $SourcePath) (Split-Path -Leaf $SourcePath)
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create Python runtime archive."
}

$partSize = $PartSizeMB * 1MB
$buffer = New-Object byte[] (1MB)
$parts = @()
$input = [System.IO.File]::OpenRead($ArchivePath)
try {
    $partNumber = 0
    while ($input.Position -lt $input.Length) {
        $partNumber++
        $partName = "python-embed-win32.part{0:D2}" -f $partNumber
        $partPath = Join-Path $OutputPath $partName
        $output = [System.IO.File]::Create($partPath)
        try {
            $remaining = [Math]::Min([int64]$partSize, [int64]($input.Length - $input.Position))
            while ($remaining -gt 0) {
                $count = $input.Read($buffer, 0, [int][Math]::Min([int64]$buffer.Length, $remaining))
                if ($count -eq 0) { throw "Unexpected end of Python runtime archive." }
                $output.Write($buffer, 0, $count)
                $remaining -= $count
            }
        } finally {
            $output.Dispose()
        }
        $partInfo = Get-Item $partPath
        $parts += [ordered]@{
            name = $partName
            size = $partInfo.Length
            sha256 = (Get-FileHash $partPath -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }
} finally {
    $input.Dispose()
}

$archive = Get-Item $ArchivePath
$manifest = [ordered]@{
    archiveSha256 = (Get-FileHash $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    totalSize = $archive.Length
    parts = $parts
}
$manifestPath = Join-Path $OutputPath "python-embed-win32.manifest.json"
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, (New-Object System.Text.UTF8Encoding $false))
$depsHashPath = Join-Path $ProjectDir "python-deps-hash.txt"
$manifest.archiveSha256 | Set-Content -Path $depsHashPath -NoNewline -Encoding ascii
Copy-Item -Force $depsHashPath (Join-Path $OutputPath "python-deps-hash.txt")
Remove-Item -Force $ArchivePath

Write-Host "Runtime assets ready in $OutputPath" -ForegroundColor Green
Write-Host "Upload python-embed-win32.manifest.json, python-embed-win32.part*, and python-deps-hash.txt with the installer." -ForegroundColor Green
