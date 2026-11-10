$src = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\QA\TASK-017"
$zip = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\QA\TASK-017\TASK-017_VISUAL_EVIDENCE.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$pngs = Get-ChildItem -Path $src -Filter "*.png"
Compress-Archive -Path $pngs.FullName -DestinationPath $zip
Get-Item $zip | Select-Object Name, Length, LastWriteTime
