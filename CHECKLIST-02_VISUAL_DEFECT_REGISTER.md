# THE VIVARIUM — CHECKLIST 02 VISUAL DEFECT REGISTER
## Comprehensive Tracking, Root Cause Analysis & Mitigation Register for Environment & Biomes
**Document ID:** `CHECKLIST-02_VISUAL_DEFECT_REGISTER.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Date:** 2026-11-10T20:25:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Parent System:** Checklist 02 (Environment & Biomes)  
**Checklist 02 Status:** **IN PROGRESS (~25% COMPLETE) — STRICTLY REMAINS OPEN**  
**Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Scope, Purpose & Governance Mandate

Checklist 02 governs the Environment & Biomes subsystem of **THE VIVARIUM**, establishing the natural living substrate for all ecological entities. Per the project governance rules defined in `GAME/AGENTS.md` and `the-vivarium-web/CHECKLIST_02_PROGRESS.md`:
- **Checklist 01 (Art Direction & Visual Bible):** 100% COMPLETE & CLOSED.
- **Checklist 02 (Environment & Biomes):** **IN PROGRESS (~25%)**. Under strict directive constraints, **Checklist 02 MUST REMAIN OPEN**. It will only be submitted for closure after the ancient oak V5 sandwich masking is fully wired, multi-biome chunk architecture is staged, and the Game Director grants formal QA acceptance.
- **Checklist 03 (Fauna & Ant Colony System):** **PENDING (0%) — STRICTLY UNOPENED**.

This Visual Defect Register serves as the authoritative ledger tracking all 8 major visual defects identified during development and QA iterations (TASK-009 through TASK-021 Gate B.3), documenting their technical root causes, historical impact, mitigation states, and resolution roadmaps.

---

## 2. Checklist 02 Acceptance Gates (AG-01 through AG-06)

Every environmental asset and rendering pipeline must satisfy six objective technical gates:
1. **AG-01 (Layer Separation & Zero Planar Cuts):** No monolithic background concept paintings. All foliage, boughs, trunks, roots, ground flora, terrain strata, and water bodies must be discrete sprites with 100% clean alpha channels and zero planar canvas edge cuts.
2. **AG-02 (Seamless Anti-Grid Surfaces):** Loam, clay, peat, and sand textures must seamlessly tile horizontally and vertically without visible seams ($\Delta \text{seam} = 0.0\text{px}$) or periodic perceptual grid patterns.
3. **AG-03 (4-Level Geometric LOD Scaling):** Assets must maintain crisp definition at $0.5\times, 1.0\times, 2.0\times,$ and $4.0\times$ camera zoom levels without bilinear blur or alpha fringing.
4. **AG-04 (Organic Subterranean Isosurface):** Excavated chambers and transit shafts must use continuous organic isosurfaces (Marching Squares on 8px sub-grid) with multi-layer cutaway shading, completely hiding the underlying 32px simulation grid.
5. **AG-05 (Visual Bible Palette Adherence):** Strict fidelity to the naturalistic palette defined in `VISUAL_BIBLE.md` (Ancient bark `#2A1810`, Oak moss `#588157`, Foliage `#2D6A4F`, Saturated loam `#1F110A`, Riparian water `#2A6F97` $\to$ `#0F2A3F`).
6. **AG-06 (Sustained 60 FPS Performance):** Multi-layered parallax rendering, dynamic isosurface re-meshing, and particle weather systems must maintain a rock-solid 60 FPS on WebGL / PixiJS v8.

---

## 3. The 8 Visual Defects: Detailed Analysis & Mitigation Register

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                VISUAL DEFECT REGISTER TOPOGRAPHY                                │
│                                                                                                 │
│    [DEFECT 6: Sky/Weather Disconnection]                 [DEFECT 1: Chopped Branch]             │
│    Black background vs gradient atmosphere               Trunk top cutoff & 600px bough limit   │
│             │                                                         │                         │
│             ▼                                                         ▼                         │
│    ┌─────────────────┐                                      ┌──────────────────┐                │
│    │ WeatherRenderer │                                      │ Oak Layering     │                │
│    │ Gradient Sky    │                                      │ (Hybrid V5)      │                │
│    └────────┬────────┘                                      └─────────┬────────┘                │
│             │                                                         │                         │
│             │            [DEFECT 2: Floating Grass Ruler]             │                         │
│             │            12px border alpha gap & flat bottom line     │                         │
│             │                         │                               │                         │
│    ═════════╪═════════════════════════╪═══════════════════════════════╪══════════════ Groundline│
│             │                         ▼                               │                         │
│             │            ┌──────────────────────────┐                 │                         │
│             │            │ Undulating Groundline    │                 │                         │
│             │            │ + Scatter Grass Tufts    │                 ▼                         │
│             │            └──────────────────────────┘        ┌─────────────────┐                │
│             │                                                │ DUAL-PASS MASK  │                │
│             │            [DEFECT 4: Soil Tiling Vortex]      │ Pass 1: Roots   │                │
│             │            Periodic high-contrast speckles     │ Pass 2: Trunk   │                │
│             │                         │                      └────────┬────────┘                │
│             ▼                         ▼                               │                         │
│    ┌─────────────────┐   ┌──────────────────────────┐                 ▼                         │
│    │ DEFECT 8:       │   │ Dual TilingSprite Layer  │        [DEFECT 3: Root Disconnection]     │
│    │ Geometric       │   │ + 37px Offset Phase Shift│        Roots floating when excavated      │
│    │ Waterfall Sheet │   └──────────────────────────┘                                           │
│    └─────────────────┘                                                                          │
│             │            [DEFECT 5: 32px Cave Grid]          [DEFECT 7: Map Size Limitation]    │
│             ▼            Blocky stair-step excavation        Monolithic 75x32 grid claustrophobia│
│    ┌─────────────────┐                │                               │                         │
│    │ 6-Frame Animated│                ▼                               ▼                         │
│    │ Sprite Sequence │   ┌──────────────────────────┐        ┌─────────────────────────┐        │
│    └─────────────────┘   │ 8px Marching Squares     │        │ 64x64 Modular Chunk     │        │
│                          │ + 3-Tier Cutaway Shading │        │ Blueprint (15.8x Area)  │        │
│                          └──────────────────────────┘        └─────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Defect 01: Chopped Branch (Trunk & Main Bough Planar Cutoffs)
- **Defect Classification:** Asset Structural Truncation & Canvas Edge Clipping.
- **Visual Manifestation:** 
  The ancient oak tree trunk terminated abruptly at horizontal coordinate $Y=225\text{px}$ in `env_tree_ancient_trunk_base_v2.png`, leaving an unnatural flat cut in mid-air. Furthermore, the main lateral bough asset (`env_tree_bough_main_moss_v2.png`) had a source canvas of $1200\times 360\text{px}$, but the artwork only extended $600\text{px}$ horizontally, causing the lateral branch to truncate sharply instead of spreading across the canopy.
- **Technical Root Cause:** 
  Incomplete source asset extraction during TASK-011/012 from concept composites. The trunk and bough were extracted within constrained bounding boxes that clipped before the branches could taper into secondary limbs and canopy foliage.
- **Historical Manifestation in Checklist 02:** 
  Flagged as **CONDITIONAL PASS** in TASK-012. Temporary mitigation placed circular canopy leaf clumps (`env_foliage_canopy_clump_01_v2.png`) at Z: 20 and Z: 70 directly over the cut coordinates $(0, \text{groundY} - 340)$ to hide the flat edges.
- **Current Mitigation Status in Code/Assets:** 
  In the unified V5 master asset (`env_tree_ancient_unified_v5.png`, $1200\times 1680\text{px}$), the trunk, buttress, and upper limbs are rendered as a continuous, unified painting with natural bark tapering. However, the upper limb currently features a single central crown with a slight left lean, lacking the broad two-sided horizontal bough spread required by the Game Director's target silhouette.
- **Next Concrete Action for Task 021:** 
  Author `TASK-021_OAK_FORM_CORRECTION.md` specifying the architectural mounting sockets and layering system for the hybrid target silhouette (two large lateral spreading boughs: Left for beehive, Right for waterfall/fauna) without generating new artwork.

---

### Defect 02: Floating Grass Ruler (Non-Tileable Grass Strip & Flat Bottom)
- **Defect Classification:** Border Alpha Seam & Planar Horizon Discontinuity.
- **Visual Manifestation:** 
  The primary surface grass strip (`env_terrain_surface_grass.png`, $512\times 96\text{px}$) appeared like a stiff, flat wooden ruler laid across the terrain. When placed along the groundline, horizontal tiling produced visible vertical gap slits, and the perfectly straight horizontal bottom cut clashed violently with the undulating dirt beneath it.
- **Technical Root Cause:** 
  Alpha channel inspection of `env_terrain_surface_grass.png` revealed that columns $X \in [0, 5]$ and $X \in [506, 511]$ had alpha $A=0$, leaving a total $12\text{px}$ transparent seam between adjoining horizontal tiles. Additionally, the bottom edge ($Y=93$) was cut with a rigid planar boundary instead of having rootlets extending downward.
- **Historical Manifestation in Checklist 02:** 
  Marked **FAIL CHO PRODUCTION** in TASK-017 QA (`CHECKLIST_02_PROGRESS.md` line 89).
- **Current Mitigation Status in Code/Assets:** 
  Mitigated in `OrganicTerrainData.ts` and `OrganicTerrainRenderer.ts` by:
  1. Replacing the flat horizon with an undulating harmonic groundline: $Y = \text{surfaceHeightMap}[x] = \text{base} + 18 \sin(x \cdot 0.005) + 8 \cos(x \cdot 0.012)$.
  2. Bypassing the non-tileable $512\times 96$ strip and instead scattering individual botanical sprites: `env_grass_tuft_green.png` ($128\times 128\text{px}$), `env_flower_clover_white.png`, and `env_flower_daisy_golden.png`.
  3. Clamping vegetation pivots with a $-3\text{px}$ downward sink into the loam crust to completely conceal planar root cuts.
- **Next Concrete Action for Task 021:** 
  Maintain the algorithmic undulating surface and scattered botanical tuft pipeline. Await delivery by Game Director of a true seamless ($0.0\text{px}$ seam diff) grass strip asset for future multi-biome integration.

---

### Defect 03: Root Disconnection (Floating Roots upon Excavation)
- **Defect Classification:** Multi-Pass Layer Decoupling & Planar Seam Invalidation.
- **Visual Manifestation:** 
  In modular assemblies (V2 and V4), the subterranean roots were delivered as separate assets (`env_tree_root_deep_cluster_v2.png`). When a player or worker ant dug out the soil beneath the oak tree, roots either hung floating in mid-air detached from the trunk base, terminated abruptly at shallow depth ($Y=382\text{px}$), or clipped awkwardly along the flat groundline horizon.
- **Technical Root Cause:** 
  The trunk base ($723\text{px}$ wide, anchor at $Y=1.0$) and root cluster ($610\text{px}$ wide, anchor at $Y=0.0$) were rendered as two independent sprites. When the groundline undulated dynamically, coordinate mismatches caused the seam between trunk and roots to open up. Furthermore, without sandwich masking, roots were either drawn on top of the soil (visible when they should be buried) or under everything (invisible even when excavated).
- **Historical Manifestation in Checklist 02:** 
  Documented as a critical architectural failure in TASK-012 and TASK-017.
- **Current Mitigation Status in Code/Assets:** 
  Architecturally resolved in the Oak V5 prototype (`TASK-021_GATE_B3_REPORT.md`) via **Dual-Pass Sandwich Masking**:
  1. A single continuous $1200\times 1680\text{px}$ master texture (`env_tree_ancient_unified_v5.png`) is instantiated into two separate rendering passes.
  2. **Pass 1 (Roots - Z: 30):** Placed in `subterraneanObjectContainer` *behind* `soilContainer` (Z: 38), clipped below the groundline ($Y \ge \text{getSurfaceY}(x) - 6\text{px}$). 100% hidden by unexcavated soil; excavation immediately exposes the authentic woody fibers.
  3. **Pass 2 (Trunk & Buttress - Z: 45):** Placed in `trunkFrontGroup` *in front of* `soilContainer`, clipped into the groundline ($Y \le \text{getSurfaceY}(x) + 10\text{px}$).
  4. A $16\text{px}$ vertical overlap buffer guarantees zero seam tears. Empirically validated in Gate B.3 with 16,360 changed pixels on dig and 17,693 on backfill.
- **Next Concrete Action for Task 021:** 
  Wire the dual-pass sandwich masking system into `WorldIntegrationScene.tsx` in Gate 3 so the verified Oak V5 pipeline operates seamlessly with the Dig/Fill Worker MVP.

---

### Defect 04: Soil Tiling Optical Vortex (Periodic Tiling Repetition Artifact)
- **Defect Classification:** Spatial Frequency Texture Tiling Resonance.
- **Visual Manifestation:** 
  When the $512\times 512\text{px}$ loam texture (`terrain_soil_dark_loam.png`) was repeated across the $2400\times 1024\text{px}$ subterranean expanse, high-contrast mineral grains, rootlet knots, and pebble clusters aligned in periodic rows. When zooming out to $0.5\times - 1.0\times$, this created a disorienting, swirling "optical vortex" / checkerboard resonance pattern that destroyed biological immersion.
- **Technical Root Cause:** 
  Using a single `TilingSprite` layer with high-contrast localized features creates an identifiable spatial frequency that the human visual cortex immediately tracks as artificial repetition.
- **Historical Manifestation in Checklist 02:** 
  Reported in TASK-008 and TASK-013.
- **Current Mitigation Status in Code/Assets:** 
  Fully remediated in `OrganicTerrainRenderer.ts`:
  1. Upgraded to `terrain_soil_dark_loam_v2.png` with normalized contrast and a verified $0.0\text{px}$ seam diff.
  2. Implemented **Dual Overlapping TilingSprite Layers**:
     - Layer A: Primary loam texture at scale $(0.5, 0.5)$, alpha $1.0$.
     - Layer B: Secondary loam texture at scale $(0.48, 0.48)$, alpha $0.28$, shifted by a phase offset of $(\Delta X = +37\text{px}, \Delta Y = -23\text{px})$.
  3. The non-harmonic prime offset and subtle scale mismatch disrupt periodic spatial harmonics, canceling the optical vortex completely.
- **Next Concrete Action for Task 021:** 
  Retain the dual `TilingSprite` phase-shifted pipeline. Monitor performance when multi-strata (clay, peat) layers are re-enabled in subsequent tasks.

---

### Defect 05: 32px Cave Grid (Blocky Stair-Stepped Chamber Excavation)
- **Defect Classification:** Discrete Grid Logic Bleeding into Visual Presentation.
- **Visual Manifestation:** 
  Early iterations rendered subterranean chambers and tunnels as discrete $32\times 32\text{px}$ square tiles or boxy bounding rects, giving the ant colony burrows a rigid "Minecraft-like" appearance that violated the stylized naturalist aesthetic.
- **Technical Root Cause:** 
  Direct 1:1 mapping between the $32\text{px}$ simulation grid (`SubterraneanGrid.ts`) and the visual rendering primitives (`roundRect` or square fill).
- **Historical Manifestation in Checklist 02:** 
  Identified in TASK-013; addressed across TASK-014 and TASK-015.
- **Current Mitigation Status in Code/Assets:** 
  Completely remediated in `OrganicTerrainRenderer.ts`:
  1. **Sub-Grid Isosurface Generation:** Subdivides each $32\text{px}$ cell into an $8\times 8\text{px}$ Marching Squares sub-grid ($300\times 128 = 38,400$ sub-cells).
  2. **Gaussian Density Smoothing:** Samples a continuous $5\times 5$ Gaussian kernel ($w = \exp(-\text{distSq} / 1.6)$) over floating-point cell coordinates to generate a continuous density isosurface field ($\text{iso} = 0.5$).
  3. **3-Tier Cutaway Shading:**
     - Contact Occlusion Shadow: $5.5\text{px}$ stroke, `#160c07`, alpha $0.45$.
     - Compact Loam Rim: $2.8\text{px}$ stroke, `#2e1a10`, alpha $0.75$.
     - Peat Highlight: $1.4\text{px}$ stroke, `#4a2d1d`, alpha $0.65$.
     - Micro-pebbles scattered every 9th contour segment.
- **Next Concrete Action for Task 021:** 
  Maintain decoupling between the $32\text{px}$ simulation/job grid and the $8\text{px}$ Marching Squares renderer. Connect the new Designation Layer in Gate 2.

---

### Defect 06: Sky/Weather Disconnection (Pitch Black Sky Void)
- **Defect Classification:** Atmospheric Background Void & Lighting Discontinuity.
- **Visual Manifestation:** 
  When zooming out to $0.78\times$ or panning across the aboveground terrain, the sky background was empty, rendering as an ominous solid black void (`#000000`). Parallax mountain assets and rain particle effects floated against pitch black without atmospheric scattering, day/night diurnal lighting, or storm darkening.
- **Technical Root Cause:** 
  Lack of an atmospheric sky backdrop component in the web renderer scene graph. PixiJS default canvas clear color was black.
- **Historical Manifestation in Checklist 02:** 
  Discovered during Gate B.1 integration testing.
- **Current Mitigation Status in Code/Assets:** 
  Remediated in Gate B.3 in `WeatherRenderer.ts`:
  1. Integrated `skyBaseGraphics`, a multi-stop vertical atmospheric gradient covering the entire world bounds ($X \in [-1200, 1200], Y \in [-1200, 0]$).
  2. Dynamic weather-state color interpolation:
     - `CLEAR_SUNNY`: Radiant cerulean (`0x3a86c8` at zenith to `0x8ecae6` at horizon).
     - `STORMY_TEMPEST`: Heavy slate storm (`0x1b2838` to `0x3d5a80`).
     - `HEATWAVE`: Sweltering amber/terracotta (`0xe07a5f` to `0xf4a261`).
     - `OVERCAST_FOG`: Soft neutral mist (`0x6c757d` to `0xadb5bd`).
  3. Verified 100% PASS in Gate B.3 visual QA (`QA/TASK-021_B3/01_world_overview_b3.png`).
- **Next Concrete Action for Task 021:** 
  Register as remediated; maintain the dynamic gradient sky in `WorldIntegrationScene.tsx`.

---

### Defect 07: Map Size Limitation (Monolithic Fixed Grid Boundary)
- **Defect Classification:** Architectural Scalability & World Boundary Constraint.
- **Visual Manifestation:** 
  The playable game world is rigidly confined to a tiny $2400\times 1024\text{px}$ rectangle ($75\times 32$ cells). Panning the camera quickly hits impenetrable borders, preventing the exploration of adjacent biomes (meadows, wetlands, deep karst caverns, aquifers). As noted by the project owner: *"The world is too small, played in 1-2 days and it's over."*
- **Technical Root Cause:** 
  Monolithic single-grid architecture in `OrganicTerrainData.ts` using a single flat `Uint8Array(2400)`. Memory, coordinate transforms, and rendering loops were hardcoded to fixed dimensions.
- **Historical Manifestation in Checklist 02:** 
  Highlighted in `GAME/AGENTS.md` Section 3 as the primary architectural bottleneck of the project.
- **Current Mitigation Status in Code/Assets:** 
  Identified for architectural redesign. In accordance with strict Gate 1 constraints, **the existing terrain engine must NOT be replaced in Task 021**. The active runtime will continue operating on the $75\times 32$ grid to ensure stability for the Dig/Fill MVP.
- **Next Concrete Action for Task 021:** 
  Author `MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md` defining standard $64\times 64$ chunks ($2048\times 2048\text{px}$), a $2\times 3$ initial prototype layout yielding $25.16\text{M px}^2$ ($15.8\times$ expansion), standard conduit sockets (Tunnel, Root Vein, Aquifer), and a safe migration plan for future milestones.

---

### Defect 08: Geometric Waterfall (Boxy Rigid Water Sheet)
- **Defect Classification:** Rigidity & Unnatural Rectilinear Fluid Boundary.
- **Visual Manifestation:** 
  In the initial aquatic biome prototype, the waterfall plunging into the riparian lake basin was rendered as a rigid vertical rectangular column with perfectly straight edges, clashing with the sloping organic earthen cliffs.
- **Technical Root Cause:** 
  Use of a static placeholder rectangle sprite or un-animated texture quad to represent rushing water.
- **Historical Manifestation in Checklist 02:** 
  Flagged during PACK-004 review.
- **Current Mitigation Status in Code/Assets:** 
  Remediated in Gate B.2/B.3:
  1. Integrated the PACK-004 6-frame animated waterfall sprite sheet (`QA/TASK-021_B3/05_aquatic_waterfall_sheet.png`).
  2. Anchored against organic wet rock cliff faces with dynamic water foam particles at the plunge pool basin.
  3. Linked to `AquaticSystem.ts` for fluid volume and storm inflow modulation.
- **Next Concrete Action for Task 021:** 
  Register as remediated in prototype; verify animated playback and fluid boundary synchronization during Gate 3 QA.

---

## 4. Master Defect Tracking & Status Matrix

| Defect ID | Defect Name | Root Cause Category | Historical Task | Mitigation Mechanism | Verification Evidence | Current Status |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-01** | Chopped Branch | Asset Truncation | TASK-011 | Clustered foliage covering cutoffs; V5 unified trunk | `EnvironmentPreviewScene.tsx`, V5 Asset | **MITIGATED (Awaiting Right Bough)** |
| **DEF-02** | Floating Grass Ruler | Non-Tileable Asset | TASK-017 | Undulating wave groundline + scatter tufts with -3px sink | `02_zoom2x_tree_base_vegetation.png` | **MITIGATED (Algorithmic Groundline)** |
| **DEF-03** | Root Disconnection | Layering & Seam Cut | TASK-012 | Dual-Pass Sandwich Masking with 16px overlap buffer | `03b_root_dig_exposed.png` (16,360px diff) | **REMEDIATED (Wiring in Gate 3)** |
| **DEF-04** | Soil Tiling Vortex | Spatial Frequency | TASK-008 | Dual TilingSprite with +37px/-23px offset phase shift | `OrganicTerrainRenderer.ts` lines 88-102 | **REMEDIATED (Verified)** |
| **DEF-05** | 32px Cave Grid | Discrete Cell Bleed | TASK-013 | 8px Marching Squares + 3-tier cutaway shading | `01_v5_stratified_cave_cutaway.png` | **REMEDIATED (Verified)** |
| **DEF-06** | Sky/Weather Disconnection | Background Void | Gate B.1 | `WeatherRenderer.ts` dynamic multi-stop gradient sky | `01_world_overview_b3.png` | **REMEDIATED (Verified)** |
| **DEF-07** | Map Size Limitation | Monolithic Grid | AGENTS.md | Modular $64\times 64$ chunk blueprint ($15.8\times$ expansion) | `MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md` | **BLUEPRINT STAGED (Engine Unchanged)** |
| **DEF-08** | Geometric Waterfall | Rectilinear Quad | PACK-004 | 6-frame animated sprite sheet + wet rock gorge | `05_aquatic_waterfall_sheet.png` | **REMEDIATED (Verified)** |

---

## 5. Strict Governance Sign-Off: Checklist 02 Status

In strict adherence to the project owner's mandate:
- **Checklist 02 is NOT closed.** It remains actively **IN PROGRESS (~25% complete)**.
- **Checklist 03 is NOT opened.** It remains **PENDING (0%)**.
- All 8 visual defects are systematically tracked with concrete technical safeguards.

*Registered and certified by worker_gate1_1.*
