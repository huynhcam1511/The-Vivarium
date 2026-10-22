# TASK-021: REGRESSION TEST RESULTS (GATE B.2)
## THE VIVARIUM — CHECKLIST-02

**Test Date:** 2026-10-21  
**Test Suite:** Unit & Runtime Automated Acceptance  
**Status:** **ALL 10 REGRESSION GATES PASSED**

---

### 1. REGRESSION VERIFICATION MATRIX

| Gate ID | System Area | Verification Requirement | Result | Evidence / Details |
| :--- | :--- | :--- | :---: | :--- |
| **REG-01** | **PixiJS Canvas Count** | Single canvas instance; no React StrictMode double canvas | **PASS** | `canvases.length === 1` verified in Puppeteer automation |
| **REG-02** | **TypeScript & Build** | `npm run build` cleanly without type errors or broken paths | **PASS** | Build succeeded in $547\text{ms}$ with zero TS errors |
| **REG-03** | **Console JS Errors** | No fatal uncaught exceptions or WebGL pipeline warnings | **PASS** | `jsErrors.length === 0` recorded across full test run |
| **REG-04** | **Weather -> Aquatic Coupling** | Rain increases water level; Heat evaporates lake volume | **PASS** | Inflow adds $+10\text{px}$, Heat evaporates $-8\text{px}$ dynamically |
| **REG-05** | **Weather -> Underground Coupling** | Rain increases soil moisture; Heat dries subterranean soil | **PASS** | Soil moisture modulates dynamically from $43\%$ to $48\%$ |
| **REG-06** | **Weather -> Vegetation Sway** | Wind speed couples to rotation angle of surface vegetation | **PASS** | $child.rotation = \sin(\dots) + (wind.speed \times 0.008)$ active |
| **REG-07** | **Camera Navigation & Presets** | Smooth Pan, Wheel Zoom, and Presets (OVERVIEW, TREE, LAKE, WATERFALL, CAVE) | **PASS** | All 5 presets jump and interpolate to exact target coordinates |
| **REG-08** | **32px Grid Calibration** | Cursor preview matches exact 32px terrain grid under zoom | **PASS** | Calibrated to origin $(-1200, 0)$; zero drift at 1x, 2x, 4x zoom |
| **REG-09** | **Oak V5 Dual-Pass Masking** | Roots concealed behind soil, trunk flared over groundline | **PASS** | Undulating contour mask matches `terrainData.getSurfaceY(x)` |
| **REG-10** | **Gameplay Preservation** | Dig and Fill tools remain fully functional | **PASS** | Verified full Dig $\rightarrow$ After $\rightarrow$ Fill round-trip restoration |
