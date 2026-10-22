# TASK-019 PENDING ISSUES & INTEGRATION DEPENDENCIES
## PACK-004 — AQUATIC SUBSYSTEM

> **Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-019-aquatic`  
> **Branch:** `task/019-aquatic`  
> **Base Commit:** `6c28a32`  
> **Current Commit:** `6b36635`  
> **Evaluation Status:** **PARTIAL** (Architecture, Simulation & Procedural Rendering Complete; Pending Final 2D Raster Art Assets Delivery)

---

## 1. Missing / Pending Raw Art Assets (External Dependency on 2D Art Team)
In accordance with `CHECKLIST_02_PROGRESS.md` and `ENVIRONMENT_ASSET_MANIFEST.csv`, the following 5 raw 2D sprite sheets remain **PENDING** delivery from the Art Team:

1. `ENV-FLOWER-BLUEBELL-01` (`env_flower_bluebell.png` — $128 \times 128$ canvas, $30 \times 42$ render logic)
   - *Current Status:* Rendered via vector/procedural blossom clusters in `AquaticRenderer.ts`.
   - *Pending Action:* Replace procedural blossom routine with sprite sheet texture once delivered.
2. `ENV-MOSS-PATCH-01` (`env_moss_patch.png` — $128 \times 128$ canvas, $64 \times 32$ render logic)
   - *Current Status:* Rendered via 3-tier velvet cushion contours (`#385E3B`, `#588157`, `#74A57F`).
   - *Pending Action:* Bind raster texture to shoreline rocks and soil rim.
3. `ENV-FERN-CLUSTER-01` (`env_fern_cluster.png` — $128 \times 128$ canvas, $56 \times 48$ render logic)
   - *Current Status:* Rendered via dynamic quadratic curves with leaflet pinnules.
   - *Pending Action:* Replace with approved sprite asset.
4. `ENV-LAKE-BOTTOM-MUD` (`env_lake_bottom_mud.png` — $768 \times 128$ canvas, $384 \times 64$ render logic)
   - *Current Status:* Rendered via parabolic basin sediment polygon with silt rim styling.
   - *Pending Action:* Map tileable sediment texture onto basin bottom mesh.
5. `ENV-WATER-FALL-STREAM` (`env_waterfall_stream.png` — $128 \times 440$ canvas, $64 \times 220$ render logic, 6-frame spritesheet)
   - *Current Status:* Procedural 4-strand turbulent flow lines + particle foam splash pool.
   - *Pending Action:* Bind 6-frame animated sprite sheet to waterfall gorge.

---

## 2. Integration Dependencies & Contract Bindings

### A. Weather System (TASK-020 / PACK-005)
- **Interface Contract:** `IAquaticEnvironment.applyRainInflow(inflowRate, dt)` & `IAquaticEnvironment.evaporateWater(heatRate, dt)`.
- **Expected Binding:**
  - `WeatherSystem.getAquaticRainInflow()` $\rightarrow$ `AquaticSystem.applyRainInflow()` to dynamically raise lake water level (up to $+25\text{ px}$) and attenuate water clarity during storms (`STORMY_TEMPEST`).
  - `WeatherSystem.getTemperature()` during `HEATWAVE` $\rightarrow$ `AquaticSystem.evaporateWater()` to lower water level (down to $-20\text{ px}$).
- **Status:** **Ready for Integration.** Both task branches maintain decoupled interfaces.

### B. Subterranean & Terrain System (TASK-018 / PACK-003)
- **Interface Contract:** `IAquaticEnvironment.getSedimentMoisture()` $\rightarrow$ returns $0.85 - 1.0$ saturation value.
- **Expected Binding:**
  - Cave cells adjacent to lake basin boundary ($X \in [1350, 1980], Y \ge 570$) query moisture to trigger subterranean ceiling water droplets and fungal garden growth.
  - Boundary safety: Digging brush in `OrganicTerrainData` should prohibit excavation breaching the lake basin floor unless flood mechanics are activated.
- **Status:** **Ready for Integration.**

### C. Fauna Cross-Interaction (Ants & Bees)
- **Bees:** Riparian flowers (Bluebells, woodland ferns) expose nectar pools for honeybee foraging trips.
- **Ants:** Worker ants drink from the lake waterline while constrained from stepping into deep water.
- **Status:** **Ready for Integration.**

---

## 3. Known Non-Blocking Limitations
1. **LOD Scaling:** When zooming to extreme LOD 3 ($>3.0\times$), procedural graphics scale smoothly without pixelation, but lack micro-texture brush strokes until raw high-resolution $2\times / 4\times$ hand-painted textures are supplied.
2. **Audio SFX:** Water rushing, splash, and bubbling audio triggers are implemented as logic events, awaiting sound asset ingestion.
