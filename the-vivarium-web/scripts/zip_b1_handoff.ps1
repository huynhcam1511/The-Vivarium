$zip = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B1_FINAL_HANDOFF.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

$items = @(
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_GATE_B1_CORRECTION_REPORT.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_PERFORMANCE_RAW_METRICS.json",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_ROOT_MASK_DIFF_EVIDENCE.zip",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\TASK-021_VISUAL_DEFECT_REPORT.md",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\01_root_masking_before_dig.png",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\02_root_masking_after_dig.png",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\02_root_mask_pixel_diff.png",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\03_waterfall_organic_contour.png",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\04_lake_basin_organic_blend.png",
  "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration\QA\TASK-021_B1\05_performance_after_dig_overview.png"
)

Compress-Archive -Path $items -DestinationPath $zip
Get-Item $zip | Select-Object Name, Length, LastWriteTime
