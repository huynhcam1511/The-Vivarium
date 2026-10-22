## 2026-10-21T11:11:17Z
You are Worker M1 (teamwork_preview_worker) assigned to implement Milestone M1: Core QA Correction & Validation for DIRECTOR TASK-021.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Essential References
- Your Working Directory: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\worker_m1
- Mandatory User Request File: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\ORIGINAL_REQUEST.md
  MANDATORY: You MUST read ORIGINAL_REQUEST.md first before starting work!
- Project Scope Document: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\orchestrator_1\PROJECT.md
- Comprehensive Explorer Investigation Reports (Read these first for complete details and code snippets):
  - R1 Camera Zoom: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\explorer_survey_1\handoff.md
  - R2 Dig Benchmark: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\explorer_survey_2\handoff.md
  - R3 Root Mask & R4 Clean Patch: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.agents\teamwork\explorer_survey_3\handoff.md
- Project Worktree: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration
- Branch: task/021-world-integration
- Baseline Commit: 7dd0919

## Your Exclusive File Ownership
You have exclusive write access to:
1. `the-vivarium-web/src/engine/OrganicTerrainRenderer.ts`
2. `the-vivarium-web/src/components/WorldIntegrationScene.tsx`
3. `the-vivarium-web/src/aquatic/AquaticRenderer.ts`
4. `the-vivarium-web/scripts/capture_task021_b3.mjs`
5. `the-vivarium-web/scripts/generate_root_diff.mjs`
6. `QA/TASK-021_B3/` (all reports, screenshots, JSON telemetry, patches, and zip archives)

## Concrete Implementation Objectives
Implement the complete technical solution following the Explorer recommendations:

1. **R1: Camera Visual Zoom Fix & Geometric Measurement (1x, 2x, 4x)**:
   - In `WorldIntegrationScene.tsx`, bind `window.__CAMERA__` as a dynamic getter returning `cameraRef.current`, and clean up handles on unmount.
   - In `capture_task021_b3.mjs`:
     - Freeze particles/animations by selecting `CLEAR_SUNNY` weather and pausing simulation.
     - Center camera strictly at `(0, -180)` and capture `09a_camera_zoom_1x.png`, `09b_camera_zoom_2x.png`, `09c_camera_zoom_4x.png`.
     - Implement automated physical pixel distance measurement between fixed world markers $P_1(-60, -140)$ and $P_2(+80, -220)$ across screenshots, verifying strict 1 : 2 : 4 geometric ratio (161.25 px : 322.49 px : 644.98 px).
     - Calculate pixel diff proving prominent visual magnification on trunk (>500,000 changed pixels).
     - Output `QA/TASK-021_B3/TASK-021_CAMERA_ZOOM_GEOMETRIC_VERIFICATION.json`.

2. **R2: Empirical Continuous Dig Workload Benchmark**:
   - In `OrganicTerrainRenderer.ts`, instrument `rebuildTerrainMesh` to track `rebuildCount`, `rebuildDurations`, `avgRebuildDurationMs`, `maxRebuildDurationMs`, `totalRebuildCpuTimeMs`, with `resetRebuildMetrics()`.
   - In `capture_task021_b3.mjs`, implement DOM event spy on `window` to record pointer events.
   - Calibrate continuous mouse drag digging across solid subterranean strata (screen Y=580, 640, 700 with camera at (0,0,0.78)), ensuring non-zero solid-to-void cell count deltas (>= 30 cells/run) across 3 consecutive runs.
   - Record exact raw JSON telemetry to `QA/TASK-021_B3/TASK-021_PERFORMANCE_RAW_METRICS.json` with pointer events, solid/void cell counts before and after, rebuild metrics, and frame deltas.
   - Verify sustained >= 55 FPS and p95 <= 35 ms.

3. **R3: Oak V5 Root Mask Visual Verification**:
   - In `OrganicTerrainRenderer.ts`, create `subterraneanObjectContainer` at index 1 (between `cavityBackgroundGraphics` and `soilContainer`).
   - In `WorldIntegrationScene.tsx`, attach `rootBackGroup` via `addSubterraneanLayer` so roots are covered by soil when intact and revealed against bedrock when excavated.
   - In `capture_task021_b3.mjs`, jump camera to root focus `(0, 80, 1.4)`, capture `03a_root_before_dig.png`, excavate at root branch coordinates $(0, 90)$ and $(\pm 25, 116)$, capture `03b_root_dig_exposed.png`, execute Fill, and capture `04_root_fill_recovered.png`.
   - In `generate_root_diff.mjs`, restrict comparison to cavity bounding box ($X \in [680, 920]$, $Y \in [440, 640]$), generating `03c_root_filament_diff.png` and `QA/TASK-021_B3/TASK-021_ROOT_MASK_DIFF_DATA.json` proving exposed root filaments in cavity and complete restoration on Fill (< 10 changed pixels).

4. **R4: Regression Testing, Clean Patch & Final Packaging**:
   - In `AquaticRenderer.ts`, optimize lake sediment with `cachedBasinHash` and `invalidateLakeBasin()`.
   - Guard debug handles and clean up on unmount in `WorldIntegrationScene.tsx`.
   - Update `QA/TASK-021_B3/TASK-021_GATE_B3_REPORT.md` so text strictly reflects raw JSON data.
   - Execute `npm run build` in `the-vivarium-web` and verify clean build exit code 0.
   - Generate `QA/TASK-021_B3/TASK-021_GATE_B3_QA_CORRECTION.patch` via `git diff 7dd0919 HEAD` (or staged diff), and verify `git apply --check` passes cleanly against baseline commit `7dd0919`.
   - Create `QA/TASK-021_B3/TASK-021_GATE_B3_QA_CORRECTION_HANDOFF.zip`.
