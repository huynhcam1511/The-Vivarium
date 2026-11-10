Add-Type -AssemblyName System.Drawing

function Inspect-Image($path) {
  $img = [System.Drawing.Image]::FromFile($path)
  Write-Host ("{0,-35} | {1,4}x{2,4} | {3}" -f (Split-Path $path -Leaf), $img.Width, $img.Height, $img.PixelFormat)
  $img.Dispose()
}

Write-Host "--- PACK-004 AQUATIC ---"
Get-ChildItem "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\the-vivarium-web\public\assets\environment\aquatic\*.png" | ForEach-Object { Inspect-Image $_.FullName }

Write-Host "`n--- PACK-005 WEATHER ---"
Get-ChildItem "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\the-vivarium-web\public\assets\environment\weather\*.png" | ForEach-Object { Inspect-Image $_.FullName }

Write-Host "`n--- PACK-003 UNDERGROUND ---"
Get-ChildItem "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\the-vivarium-web\public\assets\environment\underground\*.png" | ForEach-Object { Inspect-Image $_.FullName }
