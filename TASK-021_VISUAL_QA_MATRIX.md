# TASK-021: VISUAL QA MATRIX & LAYER SPECIFICATION
## GATE B: WORLD VISUAL INTEGRATION & PERFORMANCE QA
**Project:** The Vivarium  
**Worktree:** `.worktrees/task-021-world-integration`  
**Candidate Baseline Commit:** `1bdb6c0`  
**Date:** 2026-10-21  

---

## 1. MA TRẬN PHÂN TẦNG VÀ HIỂN THỊ ĐỒ HỌA THỰC TẾ (VISUAL QA MATRIX)

| Thành phần thế giới | Giải pháp triển khai Gate B | Kiểm định Visual & Hành vi thực tế | Trạng thái Gate B |
| :--- | :--- | :--- | :---: |
| **A. Ancient Oak V5** | **Dual-Pass Sandwich Rendering with Dynamic Masking**: Pass 1 (Root Sprite) đặt phía sau đất đặc; Pass 2 (Trunk Sprite) đặt phía trước mặt đất. | - Ở trạng thái bình thường: Bạnh gốc cây sồi ($Y \approx 700\text{px}$) cắm vững chắc vào dải cỏ bề mặt. Rễ ngầm nằm hoàn toàn dưới tầng đất đặc và bị che phủ tự nhiên.<br>- Khi kích hoạt công cụ Dig đào qua rễ: Lớp đất đặc bị gọt bớt, lộ ra các nhánh rễ ngầm V5 uốn lượn vắt ngang trần hang động. | **PASS** (Xem ảnh `02` & `03`) |
| **B. Underground (PACK-003)** | Tích hợp texture `terrain_soil_dark_loam_v2.png` qua 2 tầng TilingSprite lệch pha (Offset 37px, tỷ lệ 0.48x và 0.5x, alpha 0.28). | - Khử hoàn toàn hiện tượng sọc caro hoặc lặp ô lưới 32px của texture đất.<br>- Vách hang chuyển tầng mượt mà với 3 tầng viền bóng tiếp xúc đất ẩm tự nhiên: Contact Occlusion Shadow (`#160c07`, 5.5px), Damp Loam Rim (`#2e1a10`, 2.8px), và Peat Highlight (`#4a2d1d`, 1.4px).<br>- Giữ trọn vẹn thuật toán Marching Squares sub-grid 8px fluid curvature. | **PASS** (Xem ảnh `04`) |
| **C. Aquatic (PACK-004)** | Bồn hồ nước dạng lòng chảo tự nhiên nối từ vách đá dốc $X: 520 \to 1100$. | - Loại bỏ hoàn toàn khối hộp hoặc đường cắt vuông. Bờ hồ thoai thoải tiếp nối liền lạc với mặt đất uốn lượn.<br>- Dòng thác nước có 4 dòng chảy turbulent mềm đổ vào vòm đá ẩm bọt trắng.<br>- 9 cá minnow/chép và 1 vịt trời Mallard bơi lội, nhấp nhô theo sóng mặt hồ thời gian thực (`sampleWaterSurfaceY`). | **PASS** (Xem ảnh `05`) |
| **D. Weather (PACK-005)** | Mở rộng canvas thời tiết lên $3200 \times 1600\text{px}$, căn chỉnh thống nhất world coordinates với tâm stage. | - Bầu trời phủ kín toàn bộ viewport cả khi zoom xa 0.8x.<br>- Hạt mưa, lá rụng, sương mù phủ khắp toàn bộ không gian bao gồm cả cây sồi, hồ nước và mặt đất.<br>- Chuyển đổi mượt mà giữa các profile: Nắng ráo, Giông bão, Sương mù, Gió mùa thu. | **PASS** (Xem ảnh `06a, 06b, 06c`) |
| **E. Smart Selection & Camera** | Tích hợp **Interactive Preview Indicator** cho công cụ Dig / Fill. | - Khi di chuột trong chế độ Dig/Fill: Khung viền chỉ báo ô lưới bo tròn 32px (`#ffb703` cho Dig, `#06d6a0` cho Fill) hiển thị vị trí chuẩn bị tác động.<br>- Ở chế độ quan sát (Select): Khung viền tự động ẩn hoàn toàn, không để lộ ô lưới logic.<br>- Giữ trọn vẹn các camera presets: Toàn cảnh, Cây cổ thụ, Lòng hồ, Thác nước, Hang ngầm và hỗ trợ zoom từ 0.8x đến 4.0x. | **PASS** (Xem ảnh `07a, 07b, 07c`) |

---

## 2. DANH SÁCH ẢNH CHỨNG MINH THỰC TẾ (IN-ENGINE CAPTURES)

Toàn bộ 12 file ảnh nghiệm thu được lưu tại thư mục `QA/TASK-021_B/` và đóng gói trong `TASK-021_GATE_B_VISUAL_EVIDENCE.zip`:

1. `01_world_overview.png` ($1.76\text{ MB}$): Toàn cảnh thế giới không dùng concept nguyên tấm, thể hiện không gian 2.5D hand-painted đa tầng.
2. `02_oak_v5_covered_roots.png` ($1.90\text{ MB}$): Cận cảnh cây sồi V5 với thân bám trên cỏ, rễ ngầm được che kín hoàn toàn bởi khối đất đặc.
3. `03_oak_v5_roots_exposed_after_dig.png` ($1.90\text{ MB}$): Cận cảnh khu vực rễ sồi sau khi đào hang, các nhánh rễ ngầm lộ ra tự nhiên vắt ngang lòng hang đã đào.
4. `04_stratified_cave_clay_peat.png` ($2.36\text{ MB}$): Cận cảnh địa tầng Clay/Peat vách hang mịn màng, không vết bóng caro.
5. `05_aquatic_lake_waterfall_integration.png` ($1.26\text{ MB}$): Cận cảnh hồ nước và thác nước hòa vào đá tự nhiên, không khối hộp.
6. `06a_weather_clear_sunny.png` ($1.26\text{ MB}$): Trạng thái thời tiết Nắng ráo trong trẻo.
7. `06b_weather_stormy_rain.png` ($1.27\text{ MB}$): Trạng thái Giông bão với hạt mưa nghiêng theo gió phủ kín hồ, cây và đất.
8. `06c_weather_foggy_mist.png` ($1.25\text{ MB}$): Trạng thái Sương mù huyền ảo phủ tầng tán và mặt đất.
9. `07a_camera_zoom_1x.png` ($1.89\text{ MB}$): Góc nhìn tiêu chuẩn 1x cây sồi và mặt đất.
10. `07b_camera_zoom_2x.png` ($1.90\text{ MB}$): Góc nhìn cận cảnh 2x chi tiết bạnh gốc và thảm cỏ hoa dại.
11. `07c_camera_zoom_4x.png` ($1.90\text{ MB}$): Góc nhìn cực đại 4x kiểm định độ sắc nét bề mặt vỏ cây và mép đất.
12. `08_performance_steady_state.png` ($1.76\text{ MB}$): Trạng thái thế giới sau khi đào đắp liên tục, giữ vững 60 FPS ổn định.
