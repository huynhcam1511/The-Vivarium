$dest = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\the-vivarium-web\public\assets\environment\underground"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK018_PACK003_ART_CANDIDATE.zip")
foreach ($entry in $zip.Entries) {
  if ($entry.FullName.EndsWith(".png") -and !($entry.FullName.Contains("QA_3x3"))) {
    $target = Join-Path $dest $entry.FullName
    Write-Host "Extracting PACK-003 : $($entry.FullName) -> $target"
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
    $sha = (Get-FileHash -Path $target -Algorithm SHA256).Hash
    Write-Host "  SHA256: $sha ($((Get-Item $target).Length) bytes)"
  }
}
$zip.Dispose()
