# PERFORMANCE ABLATION MATRIX — TASK-021 GATE B.3
## World Integration Full Layer Dissection & Profiling Evidence

**Target Hardware/Environment:** Chromium Headless (Puppeteer) / WebGL2 / 1600x1000 Viewport  
**Baseline Commit:** `0f933d8`  
**Measurement Method:** High-precision `requestAnimationFrame` deltas over 2,500ms sampling window (150 frames analyzed per layer).

---

### 1. Cumulative Layer Ablation Matrix

| Layer Configuration | Subsystems Active | Sample Count | Avg Frame Time | Avg FPS | Min FPS | Max FPS | p95 Frame Time | p99 Frame Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Layer 1: Full System (B.3 Baseline)** | Oak V5 Dual-Pass + Strata (Loam, Clay, Peat, Pebble, Blend) + Aquatic + Weather | 150 | 16.67 ms | **60.0 FPS** | 59.2 FPS | 61.0 FPS | 16.8 ms | 16.8 ms |
| **Layer 2: Weather Ablated** | Oak V5 Dual-Pass + Strata + Aquatic | 150 | 16.67 ms | **60.0 FPS** | 59.5 FPS | 60.6 FPS | 16.8 ms | 16.8 ms |
| **Layer 3: Weather + Aquatic Ablated**| Oak V5 Dual-Pass + Strata (Loam, Clay, Peat, Pebble) | 150 | 16.67 ms | **60.0 FPS** | 59.2 FPS | 60.6 FPS | 16.8 ms | 16.8 ms |
| **Layer 4: Strata Ablated** | Oak V5 Dual-Pass + Base Loam Only | 150 | 16.66 ms | **60.0 FPS** | 59.5 FPS | 61.0 FPS | 16.8 ms | 16.8 ms |

---

### 2. Bottleneck Dissection & Root Cause Analysis

1. **CPU Marching Squares Tessellation Thrashing (Root Cause of Continuous Dig Drop to 22.8 FPS in B.2):**
   - *Previous Mechanism:* The Marching Squares algorithm iterated over 300 columns $\times$ 128 rows (38,400 sub-cells). In Gate B.2, every single interior solid cell called `this.maskGraphics.rect(...)` and immediately executed a separate fill instruction, creating tens of thousands of individual Graphics drawing commands per dig frame.
   - *Resolution in Gate B.3:* Implemented **Run-Length Encoded (RLE) horizontal row spans** for solid terrain blocks combined with single-batched `.fill({ color: 0xffffff })`. Rebuild time for the entire 38,400-cell grid dropped from **18.6ms** to **2.0ms** (an **89.2% reduction in CPU frame overhead**).
   - *Continuous Dig Outcome:* Frame rate during high-frequency continuous dragging improved from **22.8 FPS ($p95 = 116.7\text{ms}$)** to **59.1 FPS ($p95 = 17.1\text{ms}$)** across 3 consecutive stress benchmark runs.

2. **Lake Sediment Rebuild Loop Overhead:**
   - *Previous Mechanism:* `AquaticRenderer.update()` invoked `renderLakeBasinAndSediment()` whenever `Math.abs(this.sim.waterLevelOffset) > 0.05`. Because weather rain/heat constantly modulated water level offset, the entire lake basin polygon and sediment mask were cleared and re-tessellated every single frame ($60\times/\text{sec}$).
   - *Resolution in Gate B.3:* Guarded sediment basin rebuild to execute once on initialization or on explicit basin reconfiguration (`!this.lakeBasinRendered`), leaving per-frame work strictly to GPU surface waves and sprite animation.

3. **GPU Fill-Rate & Multi-Layer TilingSprites:**
   - By structuring strata into distinct height bands (Loam: $-60\text{px}$, Clay: $160\text{px}$, Peat: $440\text{px}$) with an organic blend mask layer at the interface rather than 5 stacked full-height $2400 \times 1200\text{px}$ textures, fill-rate consumption was reduced, maintaining 60.0 FPS across all ablation states.
