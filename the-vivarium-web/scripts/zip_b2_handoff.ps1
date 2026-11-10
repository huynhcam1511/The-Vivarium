$zip = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B2_FINAL_HANDOFF.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

$items = @(
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B2_REPORT.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_ART_INTEGRATION_MATRIX.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_VISUAL_QA_RESULTS.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_PERFORMANCE_RAW_METRICS.json",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_REGRESSION_TEST_RESULTS.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_CHANGED_FILES.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B2_CHANGES.patch",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B2_VISUAL_EVIDENCE.zip"
)

Compress-Archive -Path $items -DestinationPath $zip
Get-Item $zip | Select-Object Name, Length, LastWriteTime
