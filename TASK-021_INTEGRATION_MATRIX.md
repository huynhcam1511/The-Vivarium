# TASK-021: INTEGRATION MATRIX & ARCHITECTURE CONTRACT
## GATE A.2: WORLD INTEGRATION CANDIDATE BUILD
**Project:** The Vivarium  
**Worktree:** `.worktrees/task-021-world-integration`  
**Candidate Commit SHA:** `1bdb6c0b439a3b98fe96998fab319432b3d891f6`  
**Date:** 2026-10-21  

---

## 1. KIẾN TRÚC TÍCH HỢP ĐỒNG BỘ TRONG `WorldIntegrationScene.tsx`

Bản Integration Candidate giải quyết triệt để vấn đề phân tầng hiển thị đa hệ thống bằng kiến trúc phân lớp đồ họa chuyên biệt (Multi-layer Stage Hierarchy):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Z: 90] UI OVERLAY & CONTROLS (Thanh telemetry, bảng điều khiển thời tiết)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 80] WEATHER FOREGROUND (Hạt mưa rơi theo gió, sương mù, lá rụng bay)      │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 70] CANOPY & FOLIAGE (Tán lá cây cổ thụ đung đưa theo sức gió)            │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 60] AQUATIC SURFACE & WATERFALL (Mặt nước hồ sóng sánh, dòng thác đổ bọt)│
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 55] LIVING FAUNA (Cá bơi lội, vịt trời, sinh vật outworld)                │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 50] GROUND SURFACE & VEGETATION (Dải cỏ, hoa chuông, cúc trắng, rêu ẩm)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 45] TREE TRUNK & BOUGH (Thân cây sồi bám đất, cành ngang tổ ong)          │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 40] SUBTERRANEAN MARCHING TERRAIN (Vách đất mụn, khoang hang đào bới)    │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 35] TREE ROOTS & SEDIMENT (Hệ rễ cây ngầm, lớp bùn trầm tích lòng hồ)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Z: 10] DISTANT HORIZON & SKY TINT (Bầu trời động, mây trôi, ánh sáng nắng)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MA TRẬN KẾT NỐI RUNTIME (COUPLING MATRIX)

| Kênh kết nối | Nguồn phát | Đối tượng nhận | Dữ liệu truyền tải | Hành vi thực tế đo lường được |
| :--- | :--- | :--- | :--- | :--- |
| **Precipitation → Basin Inflow** | `WeatherSystem` (`rainIntensity`) | `AquaticSystem` (`applyRainInflow`) | Lưu lượng nạp mưa: `rainIntensity * 12.0` (px/s) | Mưa giông `STORMY_TEMPEST` làm mực nước dâng từ $-20\text{px} \to +25\text{px}$. |
| **Temperature → Evaporation** | `WeatherSystem` (`temperature`) | `AquaticSystem` (`evaporateWater`) | Tỷ lệ bốc hơi: `(temp - 30) * 3.2` (px/s) | Nắng gắt `HEATWAVE` ($40.5^\circ\text{C}$) làm mực nước hồ hạ xuống $-20\text{px}$. |
| **Weather Profile → Soil Moisture** | `WeatherSystem` (`soilMoistureDelta`) | `OrganicTerrainData` & Telemetry | Hệ số thấm ẩm: $+0.05 \to +0.15$ (khi mưa), $-0.08$ (khi nắng) | Độ ẩm đất dao động từ $44\% \to 50\%$ khi mưa và hạ dần khi trời khô hạn. |
| **Atmospheric Wind → Vegetation Sway** | `WeatherSystem` (`getWind()`) | `vegetationContainer` | Tốc độ và góc xoay: `wind.speed * 0.008` (rad) | Cụm hoa, dải cỏ và lá rụng đung đưa theo hướng gió mà không méo sprite gốc. |
| **Interactive Dig/Fill → Mesh Rebuild** | Chuột người dùng (Pointer Event) | `OrganicTerrainRenderer` | Tọa độ ô lưới $32\text{px}$ và trạng thái `solid: boolean` | Đào/lấp các ô đất ngầm tức thì, thuật toán marching squares vẽ lại đường cong mềm mại. |
| **Camera Controller → Viewport** | Input điều khiển chuột & phím | `PixiJS World Stage` | Tọa độ tâm `(X, Y)` và tỉ lệ `zoom` | Di chuyển mượt mà tới các preset `LAKE`, `WATERFALL`, `TREE`, `CAVE`, `OVERVIEW`. |

---

## 3. QUY HOẠCH ĐỊNH TUYẾN TRONG `App.tsx`

Tất cả các chế độ kiểm thử độc lập đều được giữ nguyên vẹn và bổ sung chế độ tích hợp:
1. `/?mode=integration` — **WorldIntegrationScene** (Bản tích hợp Candidate mới nhất).
2. `/?mode=aquatic` — **AquaticShowcaseScene** (Cảnh nghiệm thu thủy sinh độc lập TASK-019).
3. `/?mode=weather` — **WeatherShowcaseScene** (Cảnh nghiệm thu thời tiết độc lập TASK-020).
4. `/?mode=qa-oak-unified-v5` — **OakUnifiedV5QAScene** (Cảnh nghiệm thu cây sồi V5 TASK-017).
5. `/?mode=environment-preview` — **EnvironmentPreviewScene** (Cảnh nghiệm thu địa hình hữu cơ TASK-014/015).
6. `/?mode=preview` — **AssetPreviewScene** (Phòng trưng bày asset cô lập).
7. `/` — **Main Game** (Giữ nguyên gameplay gốc với EcoSim, kiến đào, ong mật, hồ nước).
