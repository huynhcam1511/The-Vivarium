# TASK-021: MERGE & INTEGRATION MATRIX
## GATE A: SAFE GIT & SYSTEM INTEGRATION
**Project:** The Vivarium  
**Worktree:** `.worktrees/task-021-world-integration`  
**Base Commit:** `6c28a32`  
**Date:** 2026-10-21  

---

## 1. MA TRẬN TỔNG HỢP XUNG ĐỘT (MERGE CONFLICT MATRIX)

| Tệp tin / Module | Nguồn thay đổi | Khả năng xung đột | Đánh giá & Chiến lược giải quyết |
| :--- | :--- | :---: | :--- |
| `the-vivarium-web/tsconfig.app.json` | TASK-019, TASK-020 | **TRÙNG LẶP (0 Xung Đột)** | Cả TASK-019 và TASK-020 đều thực hiện cùng một thay đổi giống hệt nhau: thêm `"node"` vào `types` và thêm `"exclude": ["src/**/*.test.ts"]`. Khi merge cả 2 task, file không hề bị conflict logic. |
| `the-vivarium-web/src/App.tsx` | TASK-019, TASK-020, Main | **XUNG ĐỘT ĐỊNH TUYẾN DỄ XỬ LÝ** | - TASK-019 thêm `mode=aquatic` dẫn tới `<AquaticShowcaseScene />`<br>- TASK-020 thêm `mode=weather` dẫn tới `<WeatherShowcaseScene />`<br>- Main hiện có `mode=environment-preview` và `mode=preview`.<br>**Giải pháp:** Tích hợp cả hai nhánh định tuyến độc lập tuần tự vào `App.tsx` mà không làm thay đổi các chế độ cũ. |
| `the-vivarium-web/src/aquatic/*` | TASK-019 | **KHÔNG XUNG ĐỘT** | Thư mục mới hoàn toàn, độc lập không chạm vào code hiện hữu của main. |
| `the-vivarium-web/src/weather/*` | TASK-020 | **KHÔNG XUNG ĐỘT** | Thư mục mới hoàn toàn, độc lập không chạm vào code hiện hữu của main. |
| `the-vivarium-web/src/engine/WorldRenderer.ts` | Tích hợp sâu (Gate B) | **XUNG ĐỘT KIẾN TRÚC TIỀM TÀNG** | Hiện tại ở main, `WorldRenderer` sử dụng 2 tấm Master Illustration tĩnh (`/art/pure_surface_canopy.jpg` và `/art/pure_underground_formicarium.jpg`) với `skyLayer`, `soilLayer` bị ẩn (`alpha = 0.0`). Nếu gắn đè `AquaticRenderer` và `WeatherRenderer` mà không quy hoạch layer, sẽ bị che khuất hoặc đè lên master illustration. Cần kiến trúc phân tầng rõ ràng (đã đề xuất tại Gate A). |
| `scripts/world/test_phase3_acceptance.gd` | TASK-018 | **KHÔNG XUNG ĐỘT** | Sửa lỗi camera lifecycle trong Godot test harness, không ảnh hưởng web codebase. |
| `the-vivarium-web/src/components/OakUnifiedV5QAScene.tsx` | TASK-017 | **KHÔNG XUNG ĐỘT** | QA scene độc lập, phục vụ đánh giá tính tương thích của Oak V5. |

---

## 2. MA TRẬN KẾT NỐI INTERFACE HỆ THỐNG (SYSTEM INTERFACE MATRIX)

| Giao diện kết nối | Trạng thái hiện tại | Hợp đồng Interface | Kết quả kiểm tra mô phỏng |
| :--- | :---: | :--- | :--- |
| **Weather → Underground (Độ ẩm đất ngầm)** | **SẴN SÀNG** | `WeatherSystem.getSoilMoisture(): number` (phạm vi $0.05..1.0$) phản ứng theo `soilMoistureDelta`. | Mưa bão (`STORMY_TEMPEST`, `GENTLE_RAIN`) nâng độ ẩm đất từ $0.45 \to 0.95$. Nắng gắt (`HEATWAVE`) rút độ ẩm xuống $0.18$. Khớp hoàn toàn với yêu cầu `IEnvironmentalAtmosphere`. |
| **Weather → Aquatic (Mực nước & Bốc hơi)** | **SẴN SÀNG** | `AquaticSystem.applyRainInflow(rate, dt)` & `AquaticSystem.evaporateWater(rate, dt)` kết nối trực tiếp với `WeatherSystem.getAquaticRainInflow()`. | Mưa làm mực nước dâng tối đa $+25\text{ px}$. Nắng nóng làm nước bốc hơi hạ xuống tối đa $-20\text{ px}$. Độ trong (`waterClarity`) giảm nhẹ khi nước xao động. |
| **Weather → Vegetation (Gió tác động tán lá & hoa)** | **SẴN SÀNG** | `WeatherSystem.getWind()` trả về `{ speed, angle }`. | Tốc độ gió điều khiển độ nghiêng hạt mưa và vận tốc trôi/xoay của 60 lá rụng. Không can thiệp làm biến dạng hình học sprite gốc của cây sồi V2/V5. |
| **Camera Navigation & Presets** | **SẴN SÀNG** | `CameraController.jumpTo(x, y, zoom)` hỗ trợ đầy đủ các preset: `CANOPY`, `HIVE`, `SURFACE`, `LAKE`, `WATERFALL`, `QUEEN`, `OVERVIEW`. | Không xuất hiện lỗi double canvas do đã kiểm định cơ chế unmount/cleanup PixiJS. |
| **Regression (Dig/Fill & Sinh vật)** | **BẢO TOÀN** | `SubterraneanGrid` (A*, BFS, Dig queue) và boids/AI của kiến, ong, cá hoạt động độc lập trên layer riêng. | Không làm mất HUD, Inventory, không phá logic đào lấp đất. |
