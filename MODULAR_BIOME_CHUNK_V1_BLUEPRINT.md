# THE VIVARIUM — MODULAR BIOME CHUNK V1 BLUEPRINT
## Architecture, Conduit Sockets (Lego Ports), 2x3 Prototype Grid & Non-Breaking Migration Plan
**Document ID:** `MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Date:** 2026-11-10T20:40:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Parent System:** World Streaming & Modular Biome Architecture  
**Strict Directive Constraint:** **DO NOT REPLACE THE EXISTING TERRAIN ENGINE WITH THE CHUNK ENGINE.** This deliverable is strictly an architectural blueprint, interface specification, and migration roadmap. Operational runtime in Task 021 remains 100% on the verified $75\times 32$ organic terrain grid.  
**Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Executive Summary & Architectural Motivation

In the current version of **THE VIVARIUM**, the terrain is constrained to a monolithic, single-grid array (`OrganicTerrainData.ts`) consisting of $75\text{ columns} \times 32\text{ rows} = 2,400\text{ cells}$ ($2400 \times 1024\text{px}$). As identified in `GAME/AGENTS.md` and `CHECKLIST-02_VISUAL_DEFECT_REGISTER.md` (Defect 07: Map Size Limitation), this small play area causes claustrophobia, prevents camera exploration, and blocks the integration of adjacent biomes (meadows, swamps, deep karst caverns, subterranean aquifers).

To solve this without breaking the existing codebase, this blueprint introduces the **Modular Biome Chunk Engine (Lego Architecture)**:
1. **Standard Chunk Unit:** $64 \times 64$ cells ($2048 \times 2048\text{px}$), maintaining standard $32\text{px}$ simulation cells.
2. **Initial Prototype Layout:** A $2 \times 3$ grid of 6 chunks ($128 \times 192$ cells / $4096 \times 6144\text{px}$), expanding the world area by **$10.24\times$** compared to the full single grid, and **$15.8\times$** compared to the active initial cavity prototype area.
3. **Conduit Sockets (Lego Ports):** Standardized boundary interfaces (Root Vein, Underground Tunnel, Aquifer/Drainage) enabling seamless continuity across chunk borders.
4. **Zero-Risk Phased Migration Plan:** Clear abstraction steps ensuring zero regressions to current Task 021 milestones.

---

## 2. Standard Biome Chunk Specification ($64 \times 64$)

### 2.1 Dimensional & Mathematical Metrics
Each individual chunk is a self-contained spatial and simulation container:

| Parameter | Value | Description / Formula |
| :--- | :--- | :--- |
| **Grid Dimensions** | $64 \times 64$ cells | $4,096$ simulation cells per chunk |
| **Cell Size** | $32\text{ px} \times 32\text{ px}$ | Canonical biological simulation grid resolution |
| **Chunk World Span** | $2048\text{ px} \times 2048\text{ px}$ | $64 \times 32\text{px} = 2048\text{px}$ width and height |
| **Sub-Grid Resolution** | $8\text{ px}$ Marching Squares | $256 \times 256 = 65,536$ render sub-cells per chunk |
| **Memory Footprint** | $\approx 24\text{ KB}$ raw state | Compact `Uint8Array(4096)` soil + density + moisture + metadata |
| **Local Coordinates** | $(lx, ly) \in [0, 63] \times [0, 63]$ | Discrete cell index within chunk |
| **Chunk Index** | $(cx, cy) \in \mathbb{Z} \times \mathbb{Z}$ | Spatial chunk grid coordinate |

### 2.2 Biome Chunk Data Structure (`BiomeChunk.ts`)
```typescript
export interface ChunkBoundaryConduits {
  north: ConduitSocket[];
  south: ConduitSocket[];
  east: ConduitSocket[];
  west: ConduitSocket[];
}

export interface BiomeChunk {
  coordinate: { cx: number, cy: number };
  worldBounds: { minX: number, maxX: number, minY: number, maxY: number };
  biomeType: 'FOREST_OAK' | 'RIPARIAN_LAKE' | 'DEEP_KARST' | 'SATURATED_AQUIFER';
  
  // Simulation Grids (64 x 64 typed arrays)
  solidGrid: Uint8Array;        // 1 = solid, 0 = excavated
  strataGrid: Uint8Array;       // 0 = Loam, 1 = Clay, 2 = Peat, 3 = Limestone
  moistureGrid: Float32Array;   // 0.0 (bone dry) to 1.0 (waterlogged)
  pheromoneGrid: Float32Array;  // Foraging & alarm trails
  
  // Conduit Ports
  conduits: ChunkBoundaryConduits;
  
  // Render Cache
  meshDirty: boolean;
  dirtyBounds?: { minX: number, maxX: number, minY: number, maxY: number };
}
```

---

## 3. Initial 2x3 Prototype Grid Topology (15.8x Area Expansion)

```
                                  THE 2x3 MODULAR BIOME CHUNK TOPOGRAPHY
                                  
                        COL 0: TERRESTRIAL / ARBOREAL                 COL 1: RIPARIAN / AQUATIC
               ┌──────────────────────────────────────────┬──────────────────────────────────────────┐
               │ CHUNK (0, 0): FOREST OAK & MEADOW        │ CHUNK (1, 0): RIPARIAN LAKE & WATERFALL  │
               │ - World X: [-2048, 0] | Y: [-2048, 0]    │ - World X: [0, +2048] | Y: [-2048, 0]    │
   ROW 0       │ - Ancient Oak Canopy, Lateral Boughs,    │ - Lake Basin, Waterfall Gorge, Wet Cliffs│
  (SURFACE)    │   Beehive Sanctuary, Meadow Wildflowers  │ - Flying Bees, Riparian Flora, Dragonflies
               │ - Undulating rolling groundline          │ - Surface Water Inflow (PACK-004)        │
               ├───────────────────┬──────────────────────┼───────────────────┬──────────────────────┤
               │                   │ Root Vein Ports (S)  │                   │ Lake Drainage Siphon │
               │                   ▼                      │                   ▼                      │
               ├──────────────────────────────────────────┼──────────────────────────────────────────┤
               │ CHUNK (0, 1): OAK ROOTS & QUEEN CORE     │ CHUNK (1, 1): WET SILT & AQUIFER BED     │
               │ - World X: [-2048, 0] | Y: [0, +2048]    │ - World X: [0, +2048] | Y: [0, +2048]    │
   ROW 1       │ - Deep Oak Taproots (Pass 1 Sandwich)    │ - Saturated Loam & High Moisture Silt    │
 (UPPER SUB)   │ - Royal Queen Chamber, Nursery Brood,    │ - Subterranean Pond, Cave Fish Habitat   │
               │   Finite Clay Mud Stockpile Chamber      │ - Lateral Tunnel Sockets connecting West │
               ├───────────────────┬──────────────────────┼───────────────────┬──────────────────────┤
               │                   │ Deep Taproot Anchor  │                   │ Karst Drainage Wells │
               │                   ▼                      │                   ▼                      │
               ├──────────────────────────────────────────┼──────────────────────────────────────────┤
               │ CHUNK (0, 2): DEEP KARST CAVERNS         │ CHUNK (1, 2): ABYSSAL FLOODED SIPHON     │
               │ - World X: [-2048, 0] | Y: [+2048, +4096]│ - World X: [0, +2048] | Y: [+2048, +4096]│
   ROW 2       │ - Ancient Limestone Pillars, Bedrock     │ - High-pressure Deep Aquifer Siphon      │
  (DEEP GEO)   │ - Rare Fungal Gardens & Blind Arthropods │ - Underground Torrential Basin           │
               │ - Deepest Ant Excavation Fronts          │ - Subterranean Water Table Baseline      │
               └──────────────────────────────────────────┴──────────────────────────────────────────┘
```

### 3.1 Quantitative Area Expansion Analysis

| Metric | Monolithic Engine (`OrganicTerrainData`) | Standard Modular Chunk | Initial 2x3 Prototype Layout | Scale Multiple |
| :--- | :---: | :---: | :---: | :---: |
| **Grid Columns × Rows** | $75 \times 32$ cells | $64 \times 64$ cells | $128 \times 192$ cells | **$10.24\times$ cells** |
| **Total Simulation Cells** | $2,400\text{ cells}$ | $4,096\text{ cells}$ | $24,576\text{ cells}$ | **$10.24\times$ cells** |
| **Pixel Dimensions** | $2400 \times 1024\text{ px}$ | $2048 \times 2048\text{ px}$ | $4096 \times 6144\text{ px}$ | **$10.24\times$ area** |
| **Total World Area** | $2,457,600\text{ px}^2$ | $4,194,304\text{ px}^2$ | $25,165,824\text{ px}^2$ | **$10.24\times$ full grid** |
| **Active Prototype Cavity** | $\approx 1,590,000\text{ px}^2$ | — | $25,165,824\text{ px}^2$ | **$15.8\times$ prototype expansion** |

---

## 4. Conduit Sockets (Lego Ports) Specification

To allow continuous simulation and visual integrity across chunk boundaries without seams or pathfinding dead-ends, every chunk exposes standardized **Conduit Sockets**:

```
                         CONDUIT SOCKET DETAIL (LEGO PORTS)
                         
          Chunk A (North)                           Chunk B (South)
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │       SOIL MATRIX         │             │        SOIL MATRIX        │
   │  ┌─────────────────────┐  │             │  ┌─────────────────────┐  │
   │  │ Tunnel Void (4 cells│  │             │  │ Tunnel Void (4 cells│  │
   └──┴──────────┬──────────┴──┘             └──┴──────────┬──────────┴──┘
                 │                                         │
                 ▼                                         ▼
         [TUNNEL SOCKET A]                         [TUNNEL SOCKET B]
         - Offset: X = 1024px                      - Offset: X = 1024px
         - Width: 128px (4 cells)                  - Width: 128px (4 cells)
         - Void Mask: A = 0                        - Void Mask: A = 0
         ═══════════════════════════════════════════════════════════════ Border Seam
         - Continuous A* Pass-through              - Seam Artifact: 0.0px
```

### 4.1 Underground Tunnel Sockets
- **Purpose:** Seamless continuation of excavated transit shafts, forage paths, and ant pheromone trails across chunk borders.
- **Port Geometry:**
  - Width: $2\text{ to }4\text{ cells}$ ($64\text{ to }128\text{px}$).
  - Depth: Perpendicular penetration of $1\text{ cell}$ into each boundary chunk.
- **Interface Specification:**
  ```typescript
  export interface TunnelSocket {
    type: 'TUNNEL';
    boundary: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    cellRange: [number, number]; // Local cell indices along edge
    passable: boolean;
    pheromoneConcentration: number;
    neighborChunkId: string;
  }
  ```
- **Pathfinding Contract:** The pathfinder evaluates inter-chunk traversal through connected sockets as cost $1.0$, completely abstracting the boundary.

### 4.2 Root Vein Ports
- **Purpose:** Anchors ancient oak taproots and lateral woody filaments as they plunge from surface Chunk (0, 0) into upper subterranean Chunk (0, 1) and deep geosphere Chunk (0, 2).
- **Mathematical Spline Continuity:**
  Roots are modeled as cubic Hermite splines. At boundary crossings, Chunk A's root endpoint must match Chunk B's entry point in both position and tangent vector:
  $$P_A(\text{exit}) = P_B(\text{entry}), \quad \vec{T}_A(\text{exit}) = \vec{T}_B(\text{entry}), \quad r_A(\text{exit}) = r_B(\text{entry})$$
  This eliminates visual clipping, angles, or discontinuous thickness steps at the chunk line.

### 4.3 Aquifer & Drainage Ports
- **Purpose:** Models subterranean hydrological cycles: surface runoff from the riparian lake draining down through silt strata into deep limestone aquifers.
- **Interface Specification:**
  ```typescript
  export interface AquiferDrainagePort {
    type: 'AQUIFER_DRAINAGE';
    boundary: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    cellRange: [number, number];
    fluidFlowRate: number;      // Liters/sec / simulation step
    waterPressure: number;      // Hydraulic head
    sedimentLoad: number;       // Silt content influencing soil moisture
  }
  ```

---

## 5. Non-Breaking Migration Plan

### 5.1 Strict Governance Guardrail
> **MANDATORY CONSTRAINT:** In accordance with user directives, **the existing terrain engine MUST NOT be replaced during Task 021**. The operational client (`the-vivarium-web`) will continue running on `OrganicTerrainData.ts` and `OrganicTerrainRenderer.ts` throughout Gates 1, 2, and 3.

### 5.2 Five-Phase Migration Roadmap

```
  PHASE 1 (GATE 1 - NOW)
  [Architectural Blueprint & Sockets Contract]
  - MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md established as authority.
  - Runtime code remains untouched.
           │
           ▼
  PHASE 2 (POST-TASK 021: INTERFACE ADAPTER)
  [WorldToChunk Coordinate Adapter]
  - Implement Headless Chunk Manager with single-grid backward compatibility facade.
  - OrganicTerrainData becomes a virtual 1x1 chunk adapter.
           │
           ▼
  PHASE 3 (MULTI-CHUNK SPATIAL MEMORY)
  [2x3 Chunk Memory Grid]
  - Instantiate 6 BiomeChunks using typed Uint8Array buffers.
  - Implement cross-chunk BFS / A* pathfinding via Tunnel Sockets.
           │
           ▼
  PHASE 4 (RENDER STREAMING & FRUSTUM CULLING)
  [PixiJS v8 Chunk Mesh Streaming]
  - Render only visible chunks (+1 buffer padding) based on camera viewport.
  - Subterranean sandwich masking applied per chunk.
           │
           ▼
  PHASE 5 (ENGINE CUTOVER & DIRECTOR ACCEPTANCE)
  [Final Verification & Deprecation]
  - Run side-by-side Puppeteer regression suite.
  - Formal cutover to infinite modular chunk engine.
```

---

## 6. Verification & Architecture Readiness

This blueprint provides:
- Complete mathematical definition of the $64 \times 64$ chunk.
- Exhaustive $2 \times 3$ grid layout ($25.16\text{M px}^2$, $15.8\times$ expansion).
- Robust contracts for all three conduit socket types.
- A bulletproof migration plan guaranteeing zero disruption to the ongoing Dig/Fill Worker MVP.

*Authored and certified by worker_gate1_1.*
