$src = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1"
$zip = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_ROOT_MASK_DIFF_EVIDENCE.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$files = Get-ChildItem -Path $src | Where-Object { $_.Name -like "*root*" -or $_.Name -like "*DIFF*" }
Compress-Archive -Path $files.FullName -DestinationPath $zip
Get-Item $zip | Select-Object Name, Length, LastWriteTime
