# THE VIVARIUM — DIG/FILL GAMEPLAY TECHNICAL SPECIFICATION
## The 2-Layer Designation, Job Queue, 3–5s Timed Excavation & Physical Stockpile Hauling Architecture
**Document ID:** `TASK-021_DIG_FILL_GAMEPLAY_CORRECTION.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Date:** 2026-11-10T20:35:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Parent System:** Subterranean Simulation & Ant Colony Worker Loop  
**Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Executive Summary & Problem Statement

In the legacy prototype (`WorldRenderer.ts` and `SubterraneanGrid.ts`), user interaction with the terrain operated as an unconstrained, instant "god-mode brush": clicking or dragging over the soil immediately set cell solid state to false or true without simulation delay, worker involvement, pathfinding, or resource expenditure. Furthermore:
- Backfilling was executed instantaneously without consuming resources.
- Excavation was executed instantaneously without an excavation timer or progress indicator.
- Clay mud was simply an abstract integer counter (`resources.mud = 64`) rather than a physical, finite, spatial stockpile entity.

This technical specification establishes the **Authoritative 2-Layer Dig/Fill Architecture** for Gate 2 MVP implementation:
1. **Layer 1: Player Designation Layer:** The player designates cells for excavation or backfilling. Designated cells display distinct visual dashed/ghost highlights. Instant direct manipulation is strictly confined to `DEV_MODE / QA_DEBUG`.
2. **Layer 2: Job Queue & Autonomous Worker Execution:** A centralized `JobQueue` dispatches work orders to autonomous ant workers. Workers pathfind to adjacent walkable cells, execute a **3.0 to 5.0 second timed dig with a floating progress bar**, or physically travel to a **finite Clay Mud Stockpile** to retrieve mud balls before hauling and backfilling.

---

## 2. The 2-Layer Architecture Model

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 1: PLAYER DESIGNATION & VISUAL FEEDBACK                   │
│                                                                                        │
│   Player Input (Pointer Click / Drag) ───► [DesignationManager]                        │
│                                                   │                                    │
│   ┌───────────────────────────────────────────────┴────────────────────────────────┐   │
│   ▼                                                                                ▼   │
│   DIG DESIGNATION                                                 BACKFILL DESIGNATION │
│   - Cell must be currently SOLID (isSolid == true)                - Cell must be VOID  │
│   - Visual: Dashed Amber/Gold outline (#f59e0b)                   - Visual: Dashed     │
│   - Stored in: designationMap<"cx,cy", DIG>                         Emerald (#10b981)  │
│   - Unlocks cancellation via right-click / toggle                                      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Dispatches Work Orders
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 2: SIMULATION JOB QUEUE & WORKER EXECUTION                │
│                                                                                        │
│   [JobQueue] ◄─── Dispatches nearest pending job to idle worker                        │
│         │                                                                              │
│         ├───────────────────────────────────────────────┐                              │
│         ▼                                               ▼                              │
│   [DIG JOB PIPELINE]                              [BACKFILL JOB PIPELINE]              │
│   1. Worker claims cell (locks job)               1. Worker claims cell (locks job)    │
│   2. A* Pathfinding to walkable neighbor          2. Pathfinds to [ClayMudStockpile]   │
│   3. Ant state: MOVING_TO_JOB                     3. Ant state: RETRIEVING_MUD         │
│   4. Arrives at neighbor tile                     4. Check stockpile finite inventory: │
│   5. Ant state: DIGGING                           │   - If empty: Worker yields job    │
│   6. Start 3.0s - 5.0s timer + Active             │   - If available: withdraw(1)      │
│      Floating Progress Bar indicator              5. Ant state: HAULING_MUD            │
│   7. Timer finishes:                              6. Pathfinds to designated cell      │
│      - OrganicTerrainData.setSolid(cx, cy, false) 7. Arrives at neighbor tile          │
│      - Worker picks up mud ball                   8. Ant state: BACKFILLING            │
│      - Rebuilds terrain mesh                      9. Timer finishes (1.5s - 2.5s):     │
│      - Hauls mud to designated dump / stockpile   │   - OrganicTerrainData.setSolid(T) │
│                                                   │   - Deposits mud ball              │
│                                                   │   - Rebuilds terrain mesh          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1: Player Designation Specification

### 3.1 Designation Semantics & Constraints
- **Dig Designation (`DIG`):**
  - **Precondition:** Cell $(cx, cy)$ must be solid (`terrainData.isSolid(cx, cy) === true`).
  - **Visual Indicator:** High-visibility pulsing dashed amber/gold border (`#f59e0b`, alpha $0.85$, line width $2\text{px}$, stroke dash $[4, 3]$) rendered in `designationOverlayGraphics`.
  - **Concurrency:** Multiple cells can be queued in batch via mouse-drag rectangle or line selection.
- **Backfill Designation (`FILL`):**
  - **Precondition:** Cell $(cx, cy)$ must be hollow/void (`terrainData.isSolid(cx, cy) === false`).
  - **Visual Indicator:** Pulsing dashed emerald/cyan border (`#10b981`, alpha $0.85$, line width $2\text{px}$, stroke dash $[4, 3]$).
  - **Resource Dependency:** A backfill designation requires at least 1 unit of Clay Mud available in colony reserves.
- **Cancellation (`CANCEL`):**
  - Right-clicking or dragging with the Cancel tool over a designated cell immediately removes it from `DesignationManager` and aborts any unassigned job.

### 3.2 Coordinate Alignment with `OrganicTerrainData`
All designations map directly to the canonical simulation coordinate system:
- **Grid Size:** $75\text{ columns} \times 32\text{ rows} = 2,400\text{ cells}$.
- **Cell Size:** $32\text{px} \times 32\text{px}$.
- **World Origin:** $X = -1200\text{px}, Y = 0\text{px}$.
- **Transform Equations:**
  $$\text{cellX} = \left\lfloor \frac{wx - (-1200)}{32} \right\rfloor, \quad \text{cellY} = \left\lfloor \frac{wy - 0}{32} \right\rfloor$$
  $$wx_{\text{center}} = -1200 + \text{cellX} \times 32 + 16, \quad wy_{\text{center}} = \text{cellY} \times 32 + 16$$

### 3.3 Strict DEV / QA Mode Isolation
- **Instant Brush Dig/Fill:** Instant excavation or solid deposition on mouse drag is **strictly confined to DEV/QA/DEBUG mode** (activated via `?mode=dev-instant-brush` or explicit developer toggle in the debug toolbar).
- In standard simulation play, player clicks *only* queue designations.

---

## 4. Layer 2: Job Queue & Worker State Machine

### 4.1 Worker Ant State Machine Transitions
The worker ant state machine is formalized to handle designated labor:

```
               ┌──────────────┐
               │     IDLE     │◄───────────────────────────┐
               └──────┬───────┘                            │
                      │ Claims Job                         │
         ┌────────────┴────────────┐                       │
         ▼                         ▼                       │
   [DIG ORDER]              [BACKFILL ORDER]               │
         │                         │                       │
         ▼                         ▼                       │
┌──────────────────┐      ┌──────────────────┐             │
│  MOVING_TO_JOB   │      │  RETRIEVING_MUD  │             │
│ (Pathfind to adj)│      │(Path to stockpile│             │
└────────┬─────────┘      └────────┬─────────┘             │
         │ Arrives                 │ Arrives & withdraws(1)│
         ▼                         ▼                       │
┌──────────────────┐      ┌──────────────────┐             │
│     DIGGING      │      │   HAULING_MUD    │             │
│ (3.0s-5.0s timer │      │ (Path to target) │             │
│  + progress bar) │      └────────┬─────────┘             │
└────────┬─────────┘               │ Arrives               │
         │ Completes               ▼                       │
         ▼                ┌──────────────────┐             │
┌──────────────────┐      │   BACKFILLING    │             │
│   HAULING_MUD    │      │ (1.5s-2.5s timer │             │
│ (Path to stock/  │      │  + progress bar) │             │
│  surface dump)   │      └────────┬─────────┘             │
└────────┬─────────┘               │ Completes             │
         │ Drops mud               │ Restores solid ground │
         └─────────────────────────┴───────────────────────┘
```

### 4.2 Timed Dig Execution (3.0s to 5.0s per 32px Cell)
- **Excavation Duration Formula:**
  $$T_{\text{dig}} = T_{\text{base}} \times \text{Hardness}(\text{strata}) \times \frac{1}{\text{WorkerEfficiency}}$$
  - $T_{\text{base}} \in [3.0, 5.0]\text{ seconds}$.
  - Topsoil Loam: Hardness $= 1.0 \implies 3.5\text{s}$.
  - Deep Dense Clay: Hardness $= 1.3 \implies 4.55\text{s}$.
  - Gravel / Pebble Strata: Hardness $= 1.45 \implies 5.0\text{s}$.
- **Floating Progress Bar Indicator:**
  During the `DIGGING` state, a dedicated PixiJS graphics container renders a progress bar floating $8\text{px}$ above the cell:
  - **Background Track:** Width $28\text{px}$, Height $4\text{px}$, Color `#1f110a`, Alpha $0.8$, Rounded corners $2\text{px}$.
  - **Progress Fill:** Width $26\text{px} \times (\text{elapsed} / T_{\text{dig}})$, Height $2\text{px}$, Color `#f59e0b` (Amber), Glow `#fbbf24`.
  - **Animation Polish:** Subtle $0.5\text{px}$ vertical oscillation synchronized with ant mandible digging animation.

### 4.3 Timed Backfill Execution (1.5s to 2.5s per Cell)
- **Duration:** $T_{\text{fill}} \in [1.5, 2.5]\text{ seconds}$.
- **Floating Progress Bar:** Emerald fill (`#10b981`), indicating ground restoration.
- **Completion Event:**
  - `OrganicTerrainData.setSolid(cx, cy, true)`.
  - `OrganicTerrainRenderer.rebuildTerrainMesh(false, dirtyBox)`.
  - Mud ball entity removed from ant mandibles.

---

## 5. Physical Clay Mud Stockpile Chamber System

### 5.1 Elimination of Infinite Resource Generation
In previous iterations, mud was created out of thin air when backfilling, or simply incremented an abstract global counter when digging. 

The new architecture requires a **Physical Stockpile Chamber**:
```typescript
export interface StockpileChamber {
  id: string;
  name: 'Central Clay Mud Reserve';
  chamberBounds: { minCx: number, maxCx: number, minCy: number, maxCy: number };
  worldPosition: { x: number, y: number };
  resourceType: 'CLAY_MUD';
  currentCount: number;
  maxCapacity: number; // e.g., 64 mud balls
  pickupWaypoint: { cx: number, cy: number };
}
```

### 5.2 Stockpile Interaction Rules
1. **Hauling Excavated Soil:**
   When an ant finishes digging, it carries a mud ball (`carriedResource = 'MUD'`). If the stockpile is below `maxCapacity`, the ant pathfinds to `pickupWaypoint` and deposits the mud (`currentCount += 1`). If the stockpile is full, it deposits the mud at an aboveground surface waste mound.
2. **Backfill Mud Withdrawal:**
   When claiming a Backfill job, the worker queries `ClayMudStockpile.withdraw(1)`.
   - If `currentCount > 0`: Decrements inventory by 1, spawns visual mud ball in ant mandibles, and dispatches worker to backfill site.
   - If `currentCount === 0`: The job cannot be started; worker marks job as `STALLED_NO_RESOURCES` and resumes foraging or nursing.

---

## 6. Ant Placeholder Representation (DEV Mode)

In accordance with strict project constraints, **no new fauna artwork or sprite sheets may be produced in this task**. 

For Gate 2 implementation in `the-vivarium-web`:
- If final ant sprite sheets are not yet provided by the Game Director, worker entities will utilize a clean **Temporary Geometric / Procedural Ant Representation**:
  - Head ($r=3\text{px}$, `#2d1a0e`), Thorax ($4\times 6\text{px}$, `#1a0f08`), Gaster ($6\times 8\text{px}$, `#2d1a0e`).
  - Animated 6-leg tripod oscillation.
  - Carried mud represented as a small brown sphere ($r=3.5\text{px}$, `#c47b4d`) held in front of the head.
  - Clearly marked in UI and code as: `NON_FINAL_DEV_PLACEHOLDER_FAUNA`.

---

## 7. Interface Contracts & API Signatures

### 7.1 Designation Layer API (`DesignationManager.ts`)
```typescript
export type DesignationType = 'DIG' | 'FILL';

export interface Designation {
  cx: number;
  cy: number;
  type: DesignationType;
  assignedWorkerId: string | null;
  status: 'PENDING' | 'IN_PROGRESS';
}

export class DesignationManager {
  addDesignation(type: DesignationType, cx: number, cy: number): boolean;
  removeDesignation(cx: number, cy: number): boolean;
  getDesignation(cx: number, cy: number): Designation | undefined;
  getPendingDesignations(): Designation[];
  assignWorker(cx: number, cy: number, workerId: string): void;
}
```

### 7.2 Job Queue API (`JobQueue.ts`)
```typescript
export interface DigJob {
  id: string;
  type: 'DIG' | 'FILL';
  targetCell: { cx: number, cy: number };
  workDuration: number;
  progress: number; // 0.0 to 1.0
}

export class JobQueue {
  enqueue(job: DigJob): void;
  popNearestJob(workerPos: { x: number, y: number }, type?: 'DIG' | 'FILL'): DigJob | null;
  completeJob(jobId: string): void;
  cancelJob(jobId: string): void;
}
```

### 7.3 Stockpile API (`ClayMudStockpile.ts`)
```typescript
export class ClayMudStockpile {
  getAvailableCount(): number;
  deposit(amount: number): boolean;
  withdraw(amount: number): boolean;
  getPickupLocation(): { x: number, y: number, cx: number, cy: number };
}
```

---

## 8. Gate 2 Readiness Certification

This specification delivers:
- Precise 2-layer designation and autonomous worker mechanics.
- Bounded 3.0–5.0s excavation timers with floating progress bar specifications.
- Finite mud stockpile hauling loop, completely eliminating infinite resource generation.
- Clear development boundaries safeguarding production code and preparing for Gate 2 execution.

*Authored and certified by worker_gate1_1.*
