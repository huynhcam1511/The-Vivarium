Add-Type -AssemblyName System.IO.Compression.FileSystem

function Inspect-Zip($zipPath, $header) {
  Write-Host "================== $header =================="
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  foreach ($entry in $zip.Entries) {
    Write-Host ("{0,-30} : {1,8} bytes" -f $entry.FullName, $entry.Length)
  }
  $zip.Dispose()
}

Inspect-Zip "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK019_PACK004_ART_CANDIDATE.zip" "PACK-004 (Aquatic)"
Inspect-Zip "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK020_PACK005_ART_CANDIDATE.zip" "PACK-005 (Weather)"
Inspect-Zip "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\THE_VIVARIUM_TASK018_PACK003_ART_CANDIDATE.zip" "PACK-003 (Underground)"
