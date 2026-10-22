# TASK-021: ART INTEGRATION MATRIX (GATE B.2)
## THE VIVARIUM — CHECKLIST-02

**Author:** Technical Developer (Antigravity)  
**Authority:** Game Director (ChatGPT)  
**Status:** ALL 10 DIRECTOR-APPROVED PACK-004/005 ASSETS INTEGRATED WITH CONDITIONAL PACK-003 STRATA

---

### 1. PACK-004 — AQUATIC ASSETS (TASK-019 INTAKE)

| Asset ID | File Name | Resolution | Format | SHA256 Checksum | Integration Location & Purpose | Fallback Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **AQ-01** | `env_flower_bluebell.png` | $128 \times 128$ | 32-bit RGBA | `3E1656CD8DA3...` | Riparian lake shore flora; swaying with water current | Procedural Bezier bells |
| **AQ-02** | `env_moss_patch.png` | $128 \times 128$ | 32-bit RGBA | `A0202E855249...` | Moist rock and shoreline vegetation clusters | Procedural 3-layer velvet ellipses |
| **AQ-03** | `env_fern_cluster.png` | $128 \times 128$ | 32-bit RGBA | `0285E4890BE9...` | Shaded woodland bank fronds with natural scaling | Procedural arching fronds |
| **AQ-04** | `env_lake_bottom_mud.png` | $768 \times 128$ | 24-bit RGB | `B6B0354F3F4B...` | Subterranean basin mud layer with parabolic mask | Procedural umber basin polygon |
| **AQ-05** | `env_waterfall_stream.png` | $128 \times 2640$ | 32-bit RGBA | `E8CDB97ADD50...` | 6-frame cascading water sprite sheet ($128 \times 440\text{px}$/frame) | Procedural sine/bezier stream |

---

### 2. PACK-005 — WEATHER ASSETS (TASK-020 INTAKE)

| Asset ID | File Name | Resolution | Format | SHA256 Checksum | Integration Location & Purpose | Fallback Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **WE-01** | `env_sky_mountain_001.png` | $1024 \times 512$ | 32-bit RGBA | `776EA3F7AF2B...` | Distant mountain horizon silhouette with weather tint | Procedural dual-ridge polygons |
| **WE-02** | `env_sky_clouds_001.png` | $1024 \times 512$ | 32-bit RGBA | `CC0D2A551FBB...` | Parallax scrolling cloud deck; speed couples to wind | Procedural billowy ellipses |
| **WE-03** | `env_fx_fog_mist.png` | $1024 \times 512$ | 32-bit RGBA | `A31AFB6D4702...` | Ground and canopy mist layer active during FOGGY_MIST | Procedural rounded mist ribbons |
| **WE-04** | `env_canopy_leaf_fall.png` | $512 \times 512$ | 32-bit RGBA | `D729DA32E479...` | 24 individual swaying leaf sprites drifting with wind vector | Procedural ellipse petals |
| **WE-05** | `env_fx_rain_drop_01.png` | $512 \times 512$ | 32-bit RGBA | `585AA8376D93...` | Slanted rainfall streaks with ground splash dynamics | Procedural line streaks |

---

### 3. PACK-003 — UNDERGROUND ASSETS (TASK-018 CONDITIONAL INTAKE)

| Asset ID | File Name | Resolution | Format | SHA256 Checksum | Integration Location & Purpose | Fallback Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **UG-01** | `env_terrain_clay_512.png` | $512 \times 512$ | 24-bit RGB | `2AEDBB32A5BA...` | Subterranean middle strata ($Y \in [180, 500]$) | Out-of-phase dark loam tiling |
| **UG-02** | `env_terrain_peat_512.png` | $512 \times 512$ | 24-bit RGB | `3EC298370F51...` | Deep bedrock peat strata ($Y \in [480, 1080]$) | Out-of-phase dark loam tiling |
| **UG-03** | `env_pebble_embedded.png` | $512 \times 512$ | 32-bit RGBA | `11B8D776BAAD...` | Subterranean mineral inclusions and micro-pebbles | Procedural perimeter crumbs |
| **UG-04** | `env_mask_organic_blend.png` | $512 \times 512$ | 32-bit RGBA | `98D44B0D90E5...` | Strata boundary modulation mask | Procedural Marching Squares mask |
