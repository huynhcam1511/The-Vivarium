# BIOME 01 — ANCIENT FOREST INTEGRATION PLAN
## GATE AF-1: INTEGRATION AUDIT & TECHNICAL ROADMAP
**Project:** THE VIVARIUM  
**Checklist:** 02 — Environment & Biomes  
**Workstream:** 04 WORLD (Architecture) × 01 ENGINE (Implementation) × 02 ART (Assets)  
**Status:** GATE AF-1 COMPLETED / PENDING DIRECTOR REVIEW & SIGN-OFF  
**Date:** 2026-11-11  

---

## 1. SOURCE OF TRUTH & REPOSITORY ISOLATION AUDIT

### 1.1 Canonical Workspace & Git Topology
- **Active Workspace Root:** `C:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`
- **Active Branch:** `task/021-world-integration`
- **Tracked Upstream:** `origin/task/021-world-integration`
- **HEAD Commit SHA:** `4e3e8e0c424c67bb266f9d6b65aa4705f10f837d`
- **Feature Target Lineage:** Commit `cb3547e` (Gate B.3 Final QA Correction) đã được xác minh bằng `git merge-base --is-ancestor cb3547e HEAD` (Exit code: 0), khẳng định mã nguồn hoàn toàn đồng nhất với baseline Task 021.
- **Worktree Boundary Guardrail:**
  - Để tuyệt đối không gây xung đột với mã nguồn đang sửa đổi của nhánh ENGINE, toàn bộ module cấu hình dữ liệu và scene thử nghiệm cho Ancient Forest sẽ được đặt trong **namespace riêng biệt** (`src/biomes/ancient_forest/` và `src/components/AncientForestPreviewScene.tsx`).
  - Không sửa đổi trực tiếp logic lõi của `WorldIntegrationScene.tsx`, `JobQueue.ts`, `DesignationManager.ts`, `OrganicTerrainRenderer.ts`.

---

## 2. MAPPING ANCIENT FOREST VÀO CÁC RENDERER HIỆN HỮU

Ancient Forest Vertical Slice sẽ kế thừa và kết nối các hệ thống con hiện có theo sơ đồ phân lớp:

```
+-----------------------------------------------------------------------------------------+
|                               ANCIENT FOREST PREVIEW SCENE                              |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [LAYER 1: BẦU TRỜI & KHÍ QUYỂN]                                                       |
|  -> WeatherRenderer (Rain, Storm, Fog, Sunlight rays tán xạ qua tán sồi)                |
|                                                                                         |
|  [LAYER 2: TÁN SỒI CỔ THỤ & CÂY CON (PASS 2 - FOREGROUND)]                             |
|  -> Oak V5 Trunk & Foliage (Z-Index 45) - Chuẩn bị sẵn Adapter đón Oak Hybrid V6        |
|                                                                                         |
|  [LAYER 3: THẢM THỰC VẬT RỪNG (FOREST FLOOR & VEGETATION)]                            |
|  -> Rêu, dương xỉ, hoa dại (Clover, Daisy, Grass Tuft) rải tự nhiên theo mật độ sinh thái|
|                                                                                         |
|  [LAYER 4: ĐỊA HÌNH HỮU CƠ & ĐỘ ẨM (SURFACE & SUBSURFACE TERRAIN)]                     |
|  -> OrganicTerrainRenderer (Lưới chuẩn 32x32px, phân tầng: Đất mùn xốp -> Đất sét)     |
|  -> Tích hợp độ ẩm thấm nước: Mưa làm tăng ẩm -> Biến đổi màu đất mùn sẫm màu          |
|                                                                                         |
|  [LAYER 5: THỦY VĂN HỒ NƯỚC (AQUATIC BASIN)]                                           |
|  -> AquaticRenderer (Hồ nước trũng tích tụ bùn lắng, nhận nước mưa xả xuống)           |
|                                                                                         |
|  [LAYER 6: HỆ RỄ NGẦM & HANG HỐC (PASS 1 - SUBTERRANEAN)]                               |
|  -> Subterranean Root Cavity (Z-Index 30) - Lộ diện khi đào khoét bùn đất                |
|  -> Tương thích Dig/Fill: Đào lộ rễ, lấp bùn sét (ClayMudStockpile) che phủ rễ          |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 3. ĐẶC TẢ DỮ LIỆU & HÀNH VI SINH THÁI MVP (GATE AF-2 SCOPE)

### 3.1 Cấu Hình Biome Data-Driven (`AncientForestConfig.ts`)
Tạo data profile độc lập tuân thủ hợp đồng thiết kế của `BIOME_DEFINITION_MATRIX_V1.md`:
- `biomeId`: `'ancient_forest'`
- `climate`:
  - `baseTemperatureCelsius`: $18.0$
  - `humidityPercent`: $85.0$
  - `rainMoistureAbsorptionRate`: $0.05$ (độ ẩm đất tăng khi trời mưa)
- `geology`:
  - `topsoilType`: `'forest_humus'` (Đất mùn đen dày)
  - `subsoilType`: `'clay_loam'` (Đất sét nén)
  - `soilCohesion`: $0.85$ (Rất ổn định nhờ rễ neo giữ)
  - `cellSizePixels`: $32$
- `subsurfaceRules`:
  - `rootDensityDepthRange`: $[0, 25]$ cells ($0 - 800\text{px}$)
  - `clayTransitionDepth`: $15$ cells ($480\text{px}$)

### 3.2 Tương Tác Sinh Thái MVP (Ecological Behavior MVP)
1. **Chu Trình Nước & Độ Ẩm (Hydrology & Moisture Diffusion):**
   - Khi `WeatherSystem` chuyển sang trạng thái mưa (`RAIN` / `STORM`), độ ẩm tại các cột đất bề mặt tăng dần từ $0.4 \rightarrow 1.0$.
   - Nước dư thừa dồn về vùng trũng hồ nước của `AquaticSystem`.
2. **Phân Tầng Đất Mùn vs Đất Sét (Soil Stratification):**
   - Đào ở độ sâu $0 - 15$ cells thu được mùn hữu cơ (Humus).
   - Đào ở độ sâu $>15$ cells thu được Bùn Sét (Clay Mud) đưa vào `ClayMudStockpile`.
3. **Neo Giữ Rễ & Mặt Nạ Đào Lộ Diện (Root-Soil Interaction):**
   - Khi đào tại vùng rễ, hệ rễ ngầm của Oak V5 được bộc lộ (Pass 1 Root Revelation).
   - Lấp đất bằng bùn sét sẽ khôi phục che phủ rễ mà không làm hỏng sprite rễ.

---

## 4. MA TRẬN PHÂN TÍCH THAY ĐỔI & RỦI RO XUNG ĐỘT (RISK & CONFLICT AUDIT)

| File / Module | Loại Thay Đổi | Nguy Cơ Xung Đột | Biện Pháp Cách Ly & Bảo Vệ |
| :--- | :--- | :--- | :--- |
| `src/biomes/ancient_forest/AncientForestConfig.ts` | **TẠO MỚI** | $0\%$ (File mới hoàn toàn) | Nằm trong namespace riêng. |
| `src/biomes/ancient_forest/AncientForestEcoSystem.ts` | **TẠO MỚI** | $0\%$ (File mới hoàn toàn) | Xử lý tick sinh thái độ ẩm thưa ($2\text{Hz}$). |
| `src/components/AncientForestPreviewScene.tsx` | **TẠO MỚI** | $0\%$ (Scene thử nghiệm riêng) | Không sửa `WorldIntegrationScene.tsx` của ENGINE. |
| `src/App.tsx` | **SỬA NHỎ** | Thấp (Thêm tab điều hướng UI) | Thêm nút chuyển sang scene `'ancient-forest'`, giữ nguyên scene hiện tại làm mặc định. |
| `src/engine/OrganicTerrainRenderer.ts` | **KHÔNG SỬA** | Cao nếu sửa trực tiếp | Gọi các API công khai hiện hữu (`setCell`, `getCell`, `setUndergroundStrata`). |
| `src/simulation/ClayMudStockpile.ts` | **KHÔNG SỬA** | Cao nếu sửa trực tiếp | Kế thừa nguyên vẹn instance kho vật liệu cho việc lấp đất. |

---

## 5. KẾ HOẠCH HÀNH ĐỘNG CHO CÁC GATE TIẾP THEO

- **Gate AF-1 (Hiện tại):** Hoàn thành hồ sơ Integration Audit & Roadmap. Trình Director phê duyệt.
- **Gate AF-2 (Sau khi được duyệt):**
  - Khởi tạo thư mục `src/biomes/ancient_forest/`.
  - Triển khai `AncientForestConfig.ts` & `AncientForestEcoSystem.ts`.
  - Xây dựng `AncientForestPreviewScene.tsx` tích hợp Oak V5, thảm thực vật, nước, thời tiết và tương tác độ ẩm.
- **Gate AF-3 (Sau khi Director duyệt AF-2):**
  - Chạy toàn bộ test suite (`e2e_test_suite.mjs` đạt $175/175$ PASS).
  - Thu thập visual evidence ở zoom $1\times, 2\times, 4\times$.
  - Đo đạc Frame Rate và Frame Time thực tế.
  - Xuất gói `BIOME_01_ANCIENT_FOREST_HANDOFF.zip`.

---

## 6. TUÂN THỦ RANH GIỚI BẢO VỆ (AUTHORIZATION BOUNDARY)
- **Source State:** Chưa viết code runtime mới, chưa chỉnh sửa file mã nguồn hiện hữu nào.
- **Artwork State:** Không tự tạo artwork, sử dụng $100\%$ asset đã bàn giao của Oak V5, Ground, Aquatic, Weather.
- **Git State:** Không commit, không merge `main`, không push remote.
- **Gate Status:** **GATE AF-1 COMPLETE / STRICT STOP FOR DIRECTOR APPROVAL.**
