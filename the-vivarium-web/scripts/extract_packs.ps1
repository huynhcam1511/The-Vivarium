$dest = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\the-vivarium-web\public\assets\environment"
if (!(Test-Path "$dest\aquatic")) { New-Item -ItemType Directory -Path "$dest\aquatic" -Force }
if (!(Test-Path "$dest\weather")) { New-Item -ItemType Directory -Path "$dest\weather" -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Extract-ZipEntries($zipPath, $destDir, $prefix) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName.EndsWith(".png") -and !($entry.FullName.Contains("QA_3x3"))) {
      $target = Join-Path $destDir $entry.FullName
      Write-Host "Extracting $prefix : $($entry.FullName) -> $target"
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
      $sha = (Get-FileHash -Path $target -Algorithm SHA256).Hash
      Write-Host "  SHA256: $sha ($((Get-Item $target).Length) bytes)"
    }
  }
  $zip.Dispose()
}

Extract-ZipEntries "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK019_PACK004_ART_CANDIDATE.zip" "$dest\aquatic" "PACK-004"
Extract-ZipEntries "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK020_PACK005_ART_CANDIDATE.zip" "$dest\weather" "PACK-005"
