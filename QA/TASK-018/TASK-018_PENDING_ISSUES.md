# TASK-018 PENDING ISSUES & DEPENDENCY AUDIT

**Project:** THE VIVARIUM — Living Ecosystem Sandbox  
**Package:** CHECKLIST-02 | PACK-003 — UNDERGROUND (Địa Tầng Nâng Cao & Hang Ngầm)  
**Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-018-underground`  
**Branch:** `task/018-underground`  
**Commit:** `6544243`  
**Status:** **ENGINEERING PASS / ART ACCEPTANCE PENDING DELIVERY**  

---

## 1. Pending Raw Art Assets (PACK-003)

In accordance with `CHECKLIST_02_PROGRESS.md` and `VISUAL_BIBLE.md`, the following 4 raw artwork assets for PACK-003 have **NOT** yet been produced or handed over by the 2D Art / Art Director pipeline:

| Asset ID | Filename Specification | Description / Standard | Current Status | Art Acceptance |
| :--- | :--- | :--- | :--- | :--- |
| `ENV-TERRAIN-CLAY-01` | `env_terrain_clay_512.png` | Seamless dense clay stratum layer ($512 \times 512\text{ px}$) | **MISSING / PENDING DELIVERY** | **NOT ACCEPTED** (Awaiting Art Delivery) |
| `ENV-TERRAIN-PEAT-01` | `env_terrain_peat_512.png` | Seamless fibrous dark peat soil stratum ($512 \times 512\text{ px}$) | **MISSING / PENDING DELIVERY** | **NOT ACCEPTED** (Awaiting Art Delivery) |
| `ENV-TRANSITION-MASK-01` | `env_mask_organic_blend.png` | Alpha blend mask for clay-to-peat organic strata transition | **MISSING / PENDING DELIVERY** | **NOT ACCEPTED** (Awaiting Art Delivery) |
| `ENV-PEBBLE-EMBED-01` | `env_pebble_embedded.png` | Embedded micro-gravel and stone inclusions in subterranean walls | **MISSING / PENDING DELIVERY** | **NOT ACCEPTED** (Awaiting Art Delivery) |

> **Strict Non-Invention Policy:** In compliance with Senior Engineer mission directives (*"Integrate available approved assets; do not generate or redesign art"*), no synthetic, placeholder, or generative art was created or substituted. The art status for PACK-003 remains explicitly unapproved until official delivery and formal evaluation.

---

## 2. Art & Visual Backlog Items (Inherited from TASK-015 Review)

The following 3 visual Polish issues were noted in the master progress tracker and are scheduled for resolution upon delivery of the PACK-003 art assets:
1. **Cavity Interior Shading:** Subtle residual shading patterns visible in specific lighting conditions inside excavated cavities when red observation glow is active.
2. **Micro-geometry Wall Variation:** Natural variation along cave wall contours currently utilizes procedural Gaussian perturbation; will receive final hand-painted fidelity when `env_mask_organic_blend.png` and `env_pebble_embedded.png` are integrated.
3. **Chamber Ecological Props:** Interior decoration props (ant eggs, brood clumps, storage seed piles, deep tree root penetration) are tracked for subsequent milestone packages.

---

## 3. Engineering & Technical Readiness

- **TileMapLayer Autotile & Fallback:** Subterranean system is architected with dual-renderer support (`TileMapLayer` autotiling + legacy `_draw()` fallback) driven by `GameManager.use_tilemap_terrain`.
- **AStarGrid2D Dynamic Routing:** Fully integrated with real-time invalidation on digging/filling, supporting worker ant navigation without passing through solid soil.
- **Isosurface Smoothing (Web):** 8px Marching Squares subgrid with soft cutaway shading is operational in the web prototype engine.
- **Round-Trip Serialization:** Tested and verified 100% compatible with Firebase RTDB format across save/load events.

---

## 4. Upstream / Downstream Dependencies & Integration

- **Upstream Dependencies:**
  - `PACK-001` (Dark Loam V2): Fully integrated and approved.
  - `PACK-002-A` (Ancient Oak 4-Layer V2): Integrated in vertical slice.
  - `PACK-002-B1` (Surface Grass & Wildflowers): Integrated in prototype mode.
- **Downstream Hand-off:**
  - When the 4 raw art files for PACK-003 are delivered, they can be directly dropped into the existing `SubterraneanGrid` material and shader pipelines with zero refactoring of pathfinding or simulation logic.
- **Branch Safety:** No dependencies on `task/019-aquatic` or `task/020-weather`. Zero cross-branch contamination.
