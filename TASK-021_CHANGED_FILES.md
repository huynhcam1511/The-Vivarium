# TASK-021: CHANGED FILES & AUDIT LOG (GATE B.2)
## THE VIVARIUM — CHECKLIST-02

**Branch:** `task/021-world-integration`  
**Base Commit (Gate B.1):** `13017f2`  
**Status:** ISOLATED WORKTREE COMMIT READY

---

### 1. MODIFIED CORE FILES

1. **`the-vivarium-web/src/aquatic/AquaticRenderer.ts`**
   - Integrated PACK-004 `env_waterfall_stream.png` 6-frame vertical sprite sheet slicing ($128 \times 440\text{px}$/frame) with loop animation.
   - Integrated PACK-004 `env_lake_bottom_mud.png` texture tiling with parabolic basin masking.
   - Integrated PACK-004 `env_flower_bluebell.png`, `env_moss_patch.png`, `env_fern_cluster.png` sprite instances with dynamic current sway.
   - Retained complete procedural fallback mechanisms if textures are absent.
   - Eliminated redundant frame redraws for static basin geometry.

2. **`the-vivarium-web/src/weather/WeatherRenderer.ts`**
   - Integrated PACK-005 `env_sky_mountain_001.png` parallax ridge tiling.
   - Integrated PACK-005 `env_sky_clouds_001.png` continuous cloud deck drifting with wind velocity.
   - Integrated PACK-005 `env_fx_fog_mist.png` ground and canopy mist ribbons with smooth alpha fading.
   - Integrated PACK-005 `env_canopy_leaf_fall.png` 24 swaying oak leaf sprites drifting on wind vector.
   - Optimized TilingSprite dimensions and cull state to prevent full-viewport overdraw overhead.

3. **`the-vivarium-web/src/engine/OrganicTerrainRenderer.ts`**
   - Implemented `dirtyBox` Marching Squares partial density re-evaluation, reducing excavation recalculation from $38,829$ points to $< 600$ points.
   - Integrated PACK-003 `env_terrain_clay_512.png` (middle strata), `env_terrain_peat_512.png` (deep bedrock), and `env_pebble_embedded.png` strata tiling layers with organic blend.

4. **`the-vivarium-web/src/components/WorldIntegrationScene.tsx`**
   - Added asynchronous asset loaders for PACK-003, PACK-004, and PACK-005 collections with fallback safety.
   - Upgraded pointer drag handling for continuous Dig/Fill with 45ms rate throttling.
   - Calibrated Smart Selection 32px grid indicator strictly to `terrainData.originX = -1200, originY = 0`.

---

### 2. NEW ASSETS INGESTED & QA HARNESS FILES

1. **`the-vivarium-web/public/assets/environment/aquatic/`**
   - `env_flower_bluebell.png`
   - `env_moss_patch.png`
   - `env_fern_cluster.png`
   - `env_lake_bottom_mud.png`
   - `env_waterfall_stream.png`

2. **`the-vivarium-web/public/assets/environment/weather/`**
   - `env_sky_mountain_001.png`
   - `env_sky_clouds_001.png`
   - `env_fx_fog_mist.png`
   - `env_canopy_leaf_fall.png`
   - `env_fx_rain_drop_01.png`

3. **`the-vivarium-web/public/assets/environment/underground/`**
   - `env_terrain_clay_512.png`
   - `env_terrain_peat_512.png`
   - `env_pebble_embedded.png`
   - `env_mask_organic_blend.png`

4. **`the-vivarium-web/scripts/capture_task021_b2.mjs`**
   - Automated Puppeteer acceptance test runner and high-precision frame-by-frame telemetry profiler.
