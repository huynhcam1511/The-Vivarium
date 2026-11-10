# THE VIVARIUM — SOURCE OF TRUTH & REPOSITORY INTEGRITY AUDIT
## TASK-021: World Integration & Dig/Fill Worker MVP Baseline Audit
**Document ID:** `TASK-021_SOURCE_OF_TRUTH_AUDIT.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Audit Date:** 2026-11-10T20:20:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Verification Level:** Forensic / Empirical Verification  
**Repository Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Executive Summary

This forensic audit establishes the empirical source of truth for **THE VIVARIUM** codebase, repository configuration, active worktree state, git commit topology, and index staging integrity. 

Prior to commencing any implementation work in Gate 2 or Gate 3, this document certifies the exact workspace location, verifies active and target branch commit hashes, alerts engineering teams to a dangerous pre-reinstallation staging contamination in `.git/index`, identifies legacy path drift from a previous host machine (`ADMIN-PC`), and provides mandatory guardrails preventing accidental regressions, unauthorized merges, or remote pushes.

---

## 2. Workspace Topography & Filesystem Boundaries

### 2.1 Canonical Workspace Identity
The sole authoritative project root for all Task 021 operations is:
```
c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME
```

### 2.2 Subsystem Directory Map
| Subsystem / Layer | Absolute Path | Role & Technology |
| :--- | :--- | :--- |
| **Primary Project Root** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME` | Root repository containing shared assets, documentation, and Godot project |
| **Web Client Application** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME\the-vivarium-web` | Production TypeScript/React/PixiJS v8 web simulation client |
| **Godot Engine Prototype** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME\scenes` | Legacy Godot 4.x scene prototypes (`main.tscn`) |
| **Agent Teamwork Workspace** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\.agents\teamwork` | Agent communication, orchestrator plans, and survey reports (Metadata ONLY) |
| **QA Evidence Repository** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME\the-vivarium-web\QA` | Benchmark captures, pixel diff data, and zipped visual evidence |
| **Public Asset Directory** | `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME\the-vivarium-web\public\assets` | Master production and QA sprites (V2, V4, V5) |

### 2.3 Strict Boundary Directives
- **Zero Metadata Contamination:** `.agents/teamwork/` must contain ONLY coordination metadata (plans, progress, handoffs). Source code, unit tests, and production assets must never be written to `.agents/teamwork/`.
- **Target Deliverable Location:** All Gate 1 specifications and blueprints must reside directly in `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME\`.

---

## 3. Git Topology, Worktree Status & Commit Ledger

### 3.1 Git Worktree List
Execution of `git worktree list --porcelain` within `GAME` produces:
```
worktree C:/Users/zit/OneDrive/Tài liệu/ANTIGRAVITY/GAME-20261110T141646Z-1-001/GAME
HEAD 4e3e8e0c424c67bb266f9d6b65aa4705f10f837d
branch refs/heads/task/021-world-integration
```
There is exactly **one** active, registered git worktree connected to the `.git` repository directory.

### 3.2 Branch Topology & Remote Alignment
- **Current Active Branch:** `task/021-world-integration`
- **Tracked Upstream:** `origin/task/021-world-integration`
- **Remote Fetch/Push URL:** `https://github.com/huynhcam1511/The-Vivarium.git`
- **Local Branch Inventory:**
  - `main`
  - `task/021-world-integration`
- **Remote Tracking Branches:**
  - `origin/HEAD -> origin/main`
  - `origin/main`
  - `origin/task/018-underground`
  - `origin/task/019-aquatic`
  - `origin/task/020-weather`
  - `origin/task/021-world-integration`

### 3.3 Authoritative Commit Hash Ledger
The commit lineage confirms the exact branch synchronization points:

| Branch / Reference | Full Commit Hash | Short Hash | Author & Timestamp | Commit Subject |
| :--- | :--- | :---: | :--- | :--- |
| **`task/021-world-integration` (HEAD)** | `4e3e8e0c424c67bb266f9d6b65aa4705f10f837d` | `4e3e8e0` | Antigravity Bot<br>2026-10-22 13:48:13 +0700 | `chore(task-021): save complete task-021 worktree state before Windows reinstallation` |
| **`task/021-world-integration` (Feature Target)** | `cb3547e43bfaf5ee5463fa2c18d2bbcf6174956b` | `cb3547e` | Antigravity Bot<br>2026-10-21 23:26:18 +0700 | `feat(task-021): complete Gate B.3 Final QA correction - Camera 1:2:4 geometric zoom, empirical drag dig workload telemetry, and authentic Oak V5 root cavity diff` |
| **`main` (HEAD)** | `2a225442de0267c0ea0d04ce8b97bed86b2f9019` | `2a22544` | Antigravity Bot<br>2026-10-22 13:44:48 +0700 | `chore: save complete main workspace, QA reports, and assets before Windows reinstallation` |
| **Common Ancestor (`merge-base`)** | `6c28a32d6657954ec2ce095033c4155a0b943261` | `6c28a32` | 2026-10-20 03:52:16 +0700 | `feat: complete TASK-007 through TASK-015 - Art Direction, Ancient Oak V2 slice, Organic Terrain & Hand-Painted Subterranean Cave System` |

---

## 4. CRITICAL ALERT: Dirty Git Staging Index Contamination

### 4.1 Forensic Cause of Staging Anomaly
On 2026-10-22, prior to an operating system reinstallation on the developer workstation, a rapid backup commit `4e3e8e0` was executed. The commit only added `TASK-021_GATE_B3_QA_CORRECTION_HANDOFF.zip`. 

However, prior to that commit, someone or an automated script had staged 80 files into `.git/index`. Consequently, `.git/index` contains a contaminated state that regresses critical engine files back to an obsolete TASK-017 state.

### 4.2 Impacted Critical Engine Files
A line-by-line inspection of `git diff --cached` identifies severe regressions in the staged index:

1. **`the-vivarium-web/src/engine/OrganicTerrainRenderer.ts`:**
   - **Staged Regression:** 128 lines deleted (file truncated from 512 lines in `cb3547e` down to 384 lines).
   - **Stripped Architecture:** Removes `addSubterraneanLayer(layer: Container)`, `setUndergroundStrata(strata: UndergroundStrata)`, RLE row-span polygon rendering optimizations, and performance telemetry counters (`rebuildCount`, `avgRebuildDurationMs`).
   - **Direct Build Consequence:** TypeScript compilation fails (`TS2339: Property 'setUndergroundStrata' does not exist on type 'OrganicTerrainRenderer'`) inside `WorldIntegrationScene.tsx`.

2. **`the-vivarium-web/src/App.tsx`:**
   - **Staged Regression:** Strips preview routes and search parameters (`mode=integration`, `mode=qa-oak-unified-v5`, `mode=aquatic`, `mode=weather`).
   - **Direct QA Consequence:** Automated Puppeteer scripts cannot navigate to test scenes.

3. **`the-vivarium-web/tsconfig.app.json`:**
   - **Staged Regression:** Strips `"node"` from `"types": ["vite/client"]` and deletes `"exclude": ["src/**/*.test.ts"]`.
   - **Direct Build Consequence:** `npm run build` executes `tsc -b`, which tries to compile `src/aquatic/AquaticSystem.test.ts` and `src/weather/WeatherSystem.test.ts`. Because `node:test` and `node:assert` lack typing, build fails with `TS2591: Cannot find name 'test'`.

4. **Staged Old QA Artifacts:**
   - 77 files from older tasks (`TASK-017`, `TASK-017_V4`, `TASK-017_V5`) are staged for addition, bloating the index.

### 4.3 Mandatory Guardrails & Safeguards
To protect the integrity of the project:
1. **NEVER run `git commit -a`** or indiscriminately commit the staged index.
2. In Gate 3 (or when preparing builds), the engineering team must selectively restore or preserve the accepted `cb3547e` state of `OrganicTerrainRenderer.ts` and ensure `tsconfig.app.json` contains `"types": ["vite/client", "node"]` and `"exclude": ["src/**/*.test.ts"]`.
3. All Gate 1 deliverables are markdown specifications and blueprints; they do not alter source code and are immune from triggering build breaks.

---

## 5. Legacy Machine Path Drift Analysis & Remediation

### 5.1 The `ADMIN-PC` Ghost Worktrees
In `GAME/`, an untracked directory named `.worktrees` exists containing 4 subfolders:
- `.worktrees/task-018-underground`
- `.worktrees/task-019-aquatic`
- `.worktrees/task-020-weather`
- `.worktrees/task-021-world-integration`

Inspection of `.worktrees/task-021-world-integration/.git` shows:
```
gitdir: C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.git/worktrees/task-021-world-integration
```
Because the current machine environment user is `zit` (path: `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`), the path `C:/Users/ADMIN-PC/...` is non-existent. These subfolders are **orphaned historical artifacts** from the pre-reinstallation machine and do not function as active git worktrees.

### 5.2 Hardcoded Script Paths
Several node scripts and markdown files contain hardcoded absolute paths pointing to `ADMIN-PC`:
- `the-vivarium-web/scripts/capture_task017_v5.mjs` (Line 13: `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/...`)
- `the-vivarium-web/scripts/capture_task021_b3.mjs` (Line 9: `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/...`)
- `the-vivarium-web/art_direction/.../ASSET_PACK_002A_CONTRACT.md` (Line 42)

### 5.3 Remediation Protocol
- Any test or capture script executed by downstream agents must resolve paths relative to `import.meta.url` or `process.cwd()` using `path.resolve(__dirname, '..')`, rather than relying on legacy hardcoded paths.
- The `.worktrees` directory should remain untouched in Task 021 to avoid accidental data loss, but agents must never use it as a git target.

---

## 6. Verification Infrastructure Status

### 6.1 Unit Test Verification
The web application includes two unit test suites under `the-vivarium-web/src/`:
- `src/aquatic/AquaticSystem.test.ts`
- `src/weather/WeatherSystem.test.ts`

Both test suites execute independently of the Vite bundle using Node's native test runner via `npx tsx --test`:
- `AquaticSystem.test.ts`: 6/6 tests passing (initialization, oscillation, basin bounds, rain inflow, evaporation, harmonic profile).
- `WeatherSystem.test.ts`: 6/6 tests passing (clear sunny defaults, tempest transition, soil moisture dynamics, diurnal cycle, pause safety, aquatic inflow contract).

### 6.2 Browser Runtime & Console Health
The script `the-vivarium-web/check_console.mjs` utilizes Puppeteer to launch headless Chrome, inspect WebGL context initialization, listen to `console.error` and `pageerror`, and verify 0 uncaught runtime exceptions on the integrated world scene.

---

## 7. Mandatory Branch Safety & Guardrails Compliance

In accordance with user and orchestrator directives:
1. **Branch Isolation:** All commits, specifications, and code edits must remain strictly within branch `task/021-world-integration`.
2. **NO Merge to Main:** Under no circumstances may `task/021-world-integration` be merged into `main`.
3. **NO Push to Remote:** Strictly prohibited from pushing any commits to `origin` or any external remote repository.
4. **Checklist Protocol:**
   - **Checklist 02 (Environment & Biomes):** Must remain **OPEN / IN PROGRESS** (current completion ~25%).
   - **Checklist 03 (Fauna & Ant Colony):** Must remain **CLOSED / UNOPENED** (current completion 0%). Only architectural draft documentation is authorized.
5. **No Artwork Production:** No oak artwork may be generated or modified; artwork production is reserved for the Game Director.
6. **No Engine Replacement:** The existing terrain engine (`OrganicTerrainData.ts`) must NOT be replaced with the modular chunk engine.

---

## 8. Audit Certification

This document formally certifies that:
- The active repository path `GAME-20261110T141646Z-1-001/GAME` is verified.
- The git commit topology (`4e3e8e0`, `cb3547e`, `2a22544`, `6c28a32`) is verified.
- The staging contamination and legacy path drift are fully documented with actionable safeguards.
- The workspace is certified ready for the remaining Gate 1 blueprint deliverables.

*Certified by worker_gate1_1.*
