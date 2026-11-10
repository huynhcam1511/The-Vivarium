# THE VIVARIUM — OAK FORM & DUAL-PASS SANDWICH MASKING ARCHITECTURE
## Technical Specification for Hybrid Ancient Oak Silhouette & Dynamic Excavation Integration
**Document ID:** `TASK-021_OAK_FORM_CORRECTION.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Date:** 2026-11-10T20:30:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Parent System:** Ancient Oak Architecture (`Quercus robur`)  
**Strict Directive Constraint:** **DO NOT GENERATE OR REPLACE ARTWORK.** Role is strictly analysis, layering/masking pipeline design, coordinate socket specification, and hand-off asset integration readiness.  
**Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Executive Overview & Design Vision

The Ancient Oak Tree stands as the towering ecological and visual centerpiece of **THE VIVARIUM**, physically linking the sky, canopy, meadow horizon, and subterranean ant burrows into a single cohesive cross-section.

Historical iterations suffered from two mutually exclusive defects:
1. **Modular 4-Piece Assembly (V2 / PACK-002-A):** Offered multi-layer Z-ordering (roots behind soil, trunk in front), but suffered from catastrophic planar cuts (**"Chopped branch"** at $Y=225\text{px}$ and **"Root disconnection"** horizontal seam tears when the groundline undulated).
2. **Unified Continuous Prototype (V5):** Solved all seam tears with a single master painting (`env_tree_ancient_unified_v5.png`, $1200\times 1680\text{px}$), but currently features a single central crown with a slight left lean, lacking the broad, regal, two-sided lateral bough span required by the Game Director.

This specification formalizes the **Hybrid Ancient Oak Architecture**: uniting the **Old Oak Silhouette** (two massive lateral spreading branches, expansive canopy crown, flared buttress roots) with **V5 Continuous Dual-Pass Sandwich Masking** (a seamless trunk-to-root anatomical bridge dynamically clipped to the undulating groundline).

---

## 2. Anatomical Blueprint: Hybrid Target Silhouette

```
                                      THE HYBRID ANCIENT OAK BLUEPRINT
                                      
                                   ┌──────────────────────────────────┐
                                   │      WIDE SPREADING CANOPY       │
                                   │  (Z: 20 Back Foliage Parallax    │
                                   │   Z: 70 Front Foliage Parallax)  │
                                   └─────────────────┬────────────────┘
                                                     │
                   ┌─────────────────────────────────┴─────────────────────────────────┐
                   │               TWO MASSIVE LATERAL BOUGHS (Z: 45)                  │
  ◄ LEFT BOUGH (WEST LIMB)                         │                         RIGHT BOUGH (EAST LIMB) ►
  - Coordinates: X in [-480, -120], Y in [-620, -380]│  - Coordinates: X in [+120, +520], Y in [-580, -320]
  - Reserved: BEEHIVE KINGDOM                      │  - Reserved: PREDATOR PERCHES & WATERFALL CANOPY
  - Rough bark for comb attachment                 │  - Slender bough extending over riparian lake
  - Supports worker bee flight paths (Z: 60)       │  - Traversed by ant scouts & woodland birds
                   └─────────────────────────────────┬─────────────────────────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │   UNIFIED CENTRAL TRUNK   │
                                       │    (Width: 420px at waist)│
                                       └─────────────┬─────────────┘
  ═══════════════════════════════════════════════════╪═══════════════════════════════════════════════════ Groundline
  (Undulating Surface Horizon)         ┌─────────────┴─────────────┐         (Rolling Loam Crust)
                                       │    BUTTRESS ROOT FLARES   │
                                       │   (Flares outward to 780px)
                                       │ PASS 2: Y <= getSurfaceY +10
                                       └─────────────┬─────────────┘
  - - - - - - - - - - - - - - - - - - - - - - - - - -│- - - - - - - - - - - - - - - - - - - - - - - - - - 
  [16px Overlap Seam Safety Buffer]                  │                 [Seam Defect Risk: 0.0px]
  - - - - - - - - - - - - - - - - - - - - - - - - - -│- - - - - - - - - - - - - - - - - - - - - - - - - - 
                                       ┌─────────────┴─────────────┐
                                       │  DEEP SUBTERRANEAN ROOTS  │
                                       │  PASS 1: Y >= getSurfaceY -6
                                       │ (Broad Lateral Filaments) │
                                       │ (Revealed by Cavity Voids)│
                                       └───────────────────────────┘
```

### 2.1 Anatomical Component Specifications

#### 1. Left Lateral Bough (Beehive Reserved Sanctuary)
- **World Transform:** $X \in [-480, -120]\text{px}$, $Y \in [-620, -380]\text{px}$ (relative to tree trunk center $(0, \text{groundY})$).
- **Ecological Function:** Dedicated anchor for the wild honeybee colony (`Apis Mellifera`). The under-bough geometry features thick, rough, furrowed bark optimized for hexagonal wax comb attachment.
- **Flight Corridor:** Clear airspace around $Z=60$ allowing unhindered bee departures toward meadow clover and daisy patches.
- **Mounting Socket:** Left Bough Mounting Socket located at $(X = -85\text{px}, Y = \text{groundY} - 320\text{px})$.

#### 2. Right Lateral Bough (Riparian Gorge Canopy)
- **World Transform:** $X \in [+120, +520]\text{px}$, $Y \in [-580, -320]\text{px}$.
- **Ecological Function:** Spans outward over the riparian lake and waterfall gorge. Functions as a highway for foraging ant scouts (`Camponotus`), a hunting perch for praying mantises, and a roost for songbirds.
- **Foliage Density:** Light, sun-dappled foliage allowing god-rays (`ENV-LIGHT-SUN-RAY-01`) to penetrate down to the water surface.
- **Mounting Socket:** Right Bough Mounting Socket located at $(X = +95\text{px}, Y = \text{groundY} - 310\text{px})$.

#### 3. Trunk Waist & Buttress Flare (Continuous V5 Anchor)
- **Waist Diameter:** $420\text{px}$ wide at chest height ($Y = \text{groundY} - 180\text{px}$).
- **Buttress Flare:** Flaring outward dramatically to over $780\text{px}$ at $Y = 924\text{px}$ on the source canvas ($Y=0.55$ pivot).
- **Ground Integration:** Anchors into the undulating `surfaceHeightMap` without floating, using a dynamic $+10\text{px}$ downward penetration buffer.

#### 4. Subterranean Root System (Dual-Pass Pass 1)
- **Span:** Extends laterally $1100\text{px}$ across world coordinates $X \in [-550, +550]\text{px}$ and reaches depths down to $Y = \text{groundY} + 680\text{px}$.
- **Filament Architecture:** Heavy taproots branch into secondary woody ridges, tapering into fine micro-filaments ($2\text{px}-4\text{px}$ diameter) that snake through subterranean soil layers.
- **Excavation Reactivity:** Sits behind solid loam. When chambers are excavated, roots remain suspended across the voids, creating natural subterranean scaffolding for ant transit.

---

## 3. Dual-Pass Sandwich Masking Architecture

### 3.1 The Fundamental Visual Challenge
In a cross-section biological simulation:
- The aboveground trunk and buttress roots must sit **in front** of the soil and grass rim.
- The subterranean roots must sit **behind** solid unexcavated soil (completely hidden from view).
- When ant workers dig out soil, the subterranean roots must be **revealed in front of the cave backdrop** without any seams, clipping tears, or halo artifacts where the trunk crosses the groundline.

### 3.2 The Multi-Layer Z-Stack Hierarchy
To achieve this, the PixiJS v8 scene graph is organized into strict Z-layers:

```
┌──────┬────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Z    │ Layer / Container Name             │ Contents & Masking Rules                                │
├──────┼────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Z:80 │ `sunRayContainer`                  │ Additive sun rays (`0xfff2cc`), god-ray atmospheric haze│
│ Z:70 │ `canopyFrontContainer`             │ Foreground oak leaves overlapping boughs & bees         │
│ Z:60 │ `faunaFlyingContainer`             │ Honeybees, flight trails, pollen particles              │
│ Z:55 │ `faunaTerrestrialContainer`        │ Ant workers, soldiers, queen, pupae transport           │
│ Z:52 │ `groundFloraContainer`             │ Daisies, clovers, grass tufts (-3px sink into soil)     │
│ Z:50 │ `groundRimContainer`               │ Rolling green grass horizon stroke line                 │
│ Z:45 │ PASS 2: `trunkFrontGroup`          │ OAK TRUNK & BUTTRESS (Mask: Y <= getSurfaceY(x) + 10px) │
│ Z:45 │ `boughFrontContainer`              │ Left & Right lateral boughs                             │
│ ═════╪════════════════════════════════════╪═════════════════════════════════════════════════════════╡
│ Z:40 │ `earthenRimContainer`              │ Marching Squares 3-tier cutaway contour strokes         │
│ Z:38 │ `soilContainer` (TERRAIN MESH)     │ Dual TilingSprite loam (+37px phase offset), MASKED BY  │
│      │                                    │ Marching Squares 8px dynamic density isosurface void    │
│ ═════╪════════════════════════════════════╪═════════════════════════════════════════════════════════╡
│ Z:30 │ PASS 1: `subterraneanContainer`    │ SUBTERRANEAN OAK ROOTS (Mask: Y >= getSurfaceY(x) - 6px)│
│ Z:25 │ `caveBackdropContainer`            │ Warm umber bedrock fill (`0x21130b`) + 660nm red glow   │
│ Z:20 │ `canopyBackContainer`              │ Background canopy foliage creating depth                │
│ Z:10 │ `skyAtmosphereContainer`           │ Dynamic multi-stop weather gradient sky & far mountains │
└──────┴────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 4. Mathematical Clipping & Dynamic Masking Geometry

### 4.1 Transform Normalization
Both Pass 1 (Roots) and Pass 2 (Trunk) utilize the identical master texture and world transform to guarantee perfect pixel-for-pixel alignment:
- **Master Texture:** `env_tree_ancient_unified_v5.png` ($1200 \times 1680\text{ px}$).
- **Anchor Point:** `(0.50, 0.55)` — exactly at $(X = 600\text{px}, Y = 924\text{px})$, where trunk buttress transitions into root flares.
- **World Position:** $(X = 0, Y = \text{terrainData.getSurfaceY}(0))$.
- **Scale:** `(0.50, 0.50)` ($600 \times 840\text{ px}$ in world coordinates).

### 4.2 Pass 1: Subterranean Root Mask Formulation
Pass 1 roots are placed in `terrainRenderer.subterraneanObjectContainer` (Z: 30) and masked by a dynamic polygon `rootMask`:
$$\text{Polygon}_{\text{root}} = \left[ (-W, Y_{\text{max}}), (x_0, Y_{\text{surf}}(x_0) - \delta_1), \dots, (x_i, Y_{\text{surf}}(x_i) - \delta_1), \dots, (+W, Y_{\text{max}}) \right]$$
Where:
- $W = 600\text{px}$ (half-width of tree root span).
- $Y_{\text{max}} = Y_{\text{surf}}(0) + 1200\text{px}$ (deep world boundary).
- $\delta_1 = 6\text{px}$ (upward penetration into soil crust).
- Sampling resolution: $\Delta x = 16\text{px}$ across the tree width.

**Dynamic Excavation Interaction:**
Because Pass 1 sits behind `soilContainer` (Z: 38), it is **100% invisible** in unexcavated terrain. When an ant excavates a cell $(c, r)$, the Marching Squares algorithm clears the soil polygon over that sub-grid. The resulting cavity void immediately reveals the underlying root fibers without needing any complex sprite re-slicing.

### 4.3 Pass 2: Trunk & Buttress Flare Mask Formulation
Pass 2 trunk is placed in `trunkFrontGroup` (Z: 45) and masked by dynamic polygon `trunkMask`:
$$\text{Polygon}_{\text{trunk}} = \left[ (-W, Y_{\text{min}}), (+W, Y_{\text{min}}), \dots, (x_i, Y_{\text{surf}}(x_i) + \delta_2), \dots, (-W, Y_{\text{surf}}(-W) + \delta_2) \right]$$
Where:
- $Y_{\text{min}} = Y_{\text{surf}}(0) - 1200\text{px}$ (sky boundary).
- $\delta_2 = 10\text{px}$ (downward penetration below surface).

### 4.4 The 16px Overlap Seam Safety Buffer
$$\text{Overlap Band} = \left(Y_{\text{surf}}(x) + \delta_2\right) - \left(Y_{\text{surf}}(x) - \delta_1\right) = 10\text{px} - (-6\text{px}) = 16\text{px}$$

**Safety Proof:**
Along the entire groundline, both Pass 1 and Pass 2 render the identical source texture pixels across a $16\text{px}$ vertical band. Because `soilContainer` also covers this band at the surface, this mathematical overlap buffer guarantees:
1. Zero transparent cracks or background sky bleeding across the horizon, even under extreme camera zoom scaling ($0.4\times$ to $4.5\times$).
2. Immunity to sub-pixel floating-point rounding errors during WebGL rasterization.
3. Perfect visual continuity between the rough vertical trunk bark and subterranean root flare ridges.

---

## 5. Empirical Verification & Diff Telemetry (Gate B.3 QA)

The sandwich masking architecture was empirically stress-tested and certified in Gate B.3 (`TASK-021_ROOT_MASK_DIFF_DATA.json`):

| Test State | Canvas Frame Capture | Quantitative Pixel Diff | Visual Telemetry & Analysis |
| :--- | :--- | :---: | :--- |
| **1. Undisturbed Terrain** | `03a_root_before_dig.png` | **0 px** exposed | 100% solid loam coverage. Zero root pixels penetrate surface or cavity; roots fully concealed behind soil container. |
| **2. Dynamic Dig Excavation** | `03b_root_dig_exposed.png` | **16,360 px** changed (Canvas)<br>**1,418 px** changed (Root Box) | 4-cell excavation across root core ($X \in [680, 920], Y \in [440, 640]$). Marching Squares opens void; authentic V5 woody fibers cleanly revealed. |
| **3. Backfill Restoration** | `04_root_fill_recovered.png` | **17,693 px** recovered<br>**0 px** unfilled defect | Mud deposit restores solid soil mesh over void. Roots cleanly re-covered beneath loam; zero ghost artifacts or alpha fringes. |

---

## 6. Implementation Readiness & Handoff Guidelines

### 6.1 Hand-Off Asset Mounting Sockets
When the Game Director delivers the finalized wide-canopy artwork, the engine will mount the boughs using the following normalized attachment contracts:
```typescript
export interface OakBoughMountingConfig {
  leftBough: {
    assetId: 'ENV-TREE-BOUGH-LEFT-V5',
    localSocket: { x: -85, y: -320 },
    zIndex: 45,
    beehiveAnchor: { x: -240, y: -410 },
  };
  rightBough: {
    assetId: 'ENV-TREE-BOUGH-RIGHT-V5',
    localSocket: { x: +95, y: -310 },
    zIndex: 45,
    predatorPerch: { x: +320, y: -380 },
  };
}
```

### 6.2 Strict Boundary Confirmation
- No new art files were authored.
- The V5 master asset (`env_tree_ancient_unified_v5.png`) remains unaltered as the production candidate.
- Dual-pass sandwich masking is fully verified and ready for live integration in Gate 3.

*Specification authored and certified by worker_gate1_1.*
