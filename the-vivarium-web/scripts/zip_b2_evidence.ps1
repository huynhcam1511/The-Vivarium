$src = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B2"
$zip = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B2_VISUAL_EVIDENCE.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$pngs = Get-ChildItem -Path $src -Filter "*.png"
Compress-Archive -Path $pngs.FullName -DestinationPath $zip
Get-Item $zip | Select-Object Name, Length, LastWriteTime
