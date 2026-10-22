# Original User Request

## 2026-10-21T10:43:51Z

Execute DIRECTOR TASK-021 — GATE B.3 FINAL QA CORRECTION in THE VIVARIUM ecosystem sandbox. Resolve camera visual zoom 1x/2x/4x scaling with physical pixel distance measurements, verify actual continuous drag dig workload performance with full pointer events and solid cell deltas, and visually verify authentic Oak V5 root branch exposure under excavation.

Working directory: c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-021-world-integration
Branch: task/021-world-integration
Baseline commit: 7dd0919
Integrity mode: development

## Requirements

### R1. Camera Visual Zoom Fix & Geometric Measurement (1x, 2x, 4x)
- Resolve why camera zoom screenshots 1x, 2x, 4x previously showed zero change on the trunk.
- Inspect CameraController.jumpTo() and the actual PixiJS container transform (worldStage / worldContainer). Align the QA script camera controls with the actual scene camera.
- Capture three screenshots at identical world target (0, -180), disabling any unrelated animations.
- Measure physical screen pixel distance between two fixed world markers across the three screenshots to prove strict geometric ratio 1 : 2 : 4 (accounting for viewport bounds if applicable).
- Do not certify PASS solely based on JSON stageScale.

### R2. Empirical Continuous Dig Workload Benchmark
- Investigate and resolve discrepancy between reported FPS and RAW JSON metrics.
- Perform genuine continuous mouse drag dig stress across solid terrain cells.
- Log exact pointer events, count of solid/void cells before and after, number of terrain rebuilds, rebuild CPU duration, and frame deltas.
- Confirm non-zero solid-to-void cell changes occurred in each run.
- Execute minimum 3 consecutive benchmark runs (Before, During, After) under identical conditions, providing raw logs proving real excavation workload.

### R3. Oak V5 Root Mask Visual Verification
- Select dig coordinates that intersect real Oak V5 root branches with non-zero alpha pixels.
- Capture Before Dig, After Dig, and After Fill at fixed camera and weather.
- Produce pixel-diff specifically isolating exposed root filaments inside the excavated cavity, cleanly distinguishing from ground background or UI changes.
- Verify that Fill restores solid soil and re-covers root filaments completely.

### R4. Regression Testing & Clean Patch Validation
- Verify git apply --check of the patch on a clean base at 7dd0919.
- Verify Weather -> Aquatic and Weather -> Underground coupling.
- Ensure lake sediment is not redrawn continuously every frame while preserving dynamic updates when basin changes.
- Keep production clean of unnecessary debug handles.
- Pass npm run build cleanly.

## Acceptance Criteria

### Camera Zoom Verification
- [ ] Three screenshots captured at identical world target with static visual elements.
- [ ] Measured distance between fixed world points scales at strict 1 : 2 : 4 ratio.
- [ ] Verified via image diff with clear, visible magnification.

### Performance Verification
- [ ] Proven continuous drag digging altering terrain cells in each run.
- [ ] Raw JSON telemetry logging pointer events, cell count changes, rebuild times, and frame deltas.
- [ ] Sustained frame rate >= 55 FPS during dig with p95 <= 35 ms across 3 consecutive runs.

### Root Mask Verification
- [ ] Pixel diff confirms authentic root pixels revealed in the cavity.
- [ ] Fill operation re-covers roots completely.

### Packaging & Git Safety
- [ ] Archive TASK-021_GATE_B3_QA_CORRECTION_HANDOFF.zip generated with all required evidence.
- [ ] No merge to main. No push to remote. Working tree clean on task/021-world-integration.
