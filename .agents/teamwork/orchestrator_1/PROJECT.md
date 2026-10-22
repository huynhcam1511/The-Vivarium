# Project: DIRECTOR TASK-021 — GATE B.3 FINAL QA CORRECTION

## Architecture
- **Engine Core & Rendering Hierarchy**:
  - `WorldIntegrationScene.tsx`: Top-level integration scene managing PixiJS `Application`, `worldStage`, and tool events.
  - `CameraController.ts`: Viewport camera math; translates screen coordinates to world coordinates via zoom and stage offset.
  - `OrganicTerrainRenderer.ts`: Multi-layer marching squares terrain renderer (`cavityBackgroundGraphics` at index 0, `subterraneanObjectContainer` at index 1, `soilContainer` with `maskGraphics` at index 2).
  - `OrganicTerrainData.ts`: Grid simulation holding soil strata and cell solid/void states.
  - `AquaticRenderer.ts`: Lake basin and sediment rendering with cached basin hash to prevent per-frame redraws.
- **QA Automation & Verification Pipeline**:
  - `capture_task021_b3.mjs`: Automated Puppeteer runner for R1 (Camera zoom & geometric measurement), R2 (Continuous dig workload benchmark with telemetry logging), and R3 (Root exposure & fill sequence).
  - `generate_root_diff.mjs`: Pixel diff analyzer with cavity bounding-box isolation.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1 Camera Handle Dynamic Binding | Expose active mounted `cameraRef.current` via dynamic getter on `window.__CAMERA__` with unmount cleanup | M1 | Survey E1 |
| 2 | R1 Geometric Ratio Measurement | Fixed world markers P1(-60, -140) and P2(80, -220) produce strict 1:2:4 pixel ratio across 1x, 2x, 4x screenshots with static weather | M1 | Survey E1 |
| 3 | R2 Terrain Rebuild Telemetry | Instrument `OrganicTerrainRenderer.ts` to log rebuild count, durations, avg, max, and total CPU time | M1 | Survey E2 |
| 4 | R2 Subterranean Drag Digging Benchmark | Continuous drag digging at screen Y=580, 640, 700 modifying >= 30 solid cells/run, logging pointer events and frame deltas | M1 | Survey E2 |
| 5 | R2 Sustained Performance Telemetry | Validate >= 55 FPS and p95 <= 35 ms across 3 consecutive runs, logging to `TASK-021_PERFORMANCE_RAW_METRICS.json` | M1 | Survey E2 |
| 6 | R3 Subterranean Layer Ordering | Insert `rootBackGroup` into `terrainRenderer.subterraneanObjectContainer` between cavity background and soil container | M1 | Survey E3 |
| 7 | R3 Subterranean Root Dig Coordinates | Focus camera at (0, 80, 1.4) and dig at world (0, 90) and (±25, 116) exposing real Oak V5 root branches | M1 | Survey E3 |
| 8 | R3 Cavity Pixel Diff Isolation | Isolate cavity bounding box in `generate_root_diff.mjs` verifying >= 4,000 changed root pixels and <= 10 unfilled pixels | M1 | Survey E3 |
| 9 | R4 Lake Sediment Dynamic Cache | Cache basin hash in `AquaticRenderer.ts` avoiding per-frame redraw while exposing `invalidateLakeBasin()` | M1 | Survey E3 |
| 10 | R4 Debug Handle Cleanliness & Build | Guard window handles with DEV/QA check and cleanup on unmount; pass `npm run build` cleanly | M1 | Survey E3 |
| 11 | R4 Clean Git Patch & Archive | Generate verified `TASK-021_GATE_B3_QA_CORRECTION.patch` against `7dd0919` and package `TASK-021_GATE_B3_QA_CORRECTION_HANDOFF.zip` | M1 | Survey E3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core QA Correction & Validation | Implement R1, R2, R3, R4 fixes, execute test suite, verify metrics, build, and package handoff archive | None | IN_PROGRESS |

## Interface Contracts
### `WorldIntegrationScene` ↔ `CameraController`
- `window.__CAMERA__` resolves via dynamic getter to `cameraRef.current`.
- `jumpTo(x: number, y: number, zoom: number)` updates `worldStage` transform immediately and synchronously updates screen position.

### `WorldIntegrationScene` ↔ `OrganicTerrainRenderer`
- `terrainRenderer.addSubterraneanLayer(layer: Container)` inserts `rootBackGroup` at index 1 (behind `soilContainer`, in front of `cavityBackgroundGraphics`).
- `terrainRenderer.rebuildTerrainMesh(full, dirtyBox)` logs rebuild telemetry: `rebuildCount`, `rebuildDurations`, `totalRebuildTimeMs`.
- `terrainRenderer.resetRebuildMetrics()` clears telemetry before benchmarking.

### `AquaticRenderer` ↔ `WorldIntegrationScene`
- `renderLakeBasinAndSediment()` triggered only when `cachedBasinHash !== currentBasinHash`.
- `invalidateLakeBasin()` manually invalidates cache when basin geometry changes.

## Code Layout
- `the-vivarium-web/src/engine/OrganicTerrainRenderer.ts` — Terrain meshing, layer ordering, rebuild metrics
- `the-vivarium-web/src/components/WorldIntegrationScene.tsx` — Window handles getter/cleanup, root layer attachment
- `the-vivarium-web/src/aquatic/AquaticRenderer.ts` — Lake sediment cache optimization
- `the-vivarium-web/scripts/capture_task021_b3.mjs` — QA benchmark & capture script
- `the-vivarium-web/scripts/generate_root_diff.mjs` — Root cavity pixel-diff analyzer
- `QA/TASK-021_B3/` — Output evidence artifacts, JSON logs, screenshots, patch, and zip archive
