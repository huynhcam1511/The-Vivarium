# WORLD MIGRATION AND QA PLAN
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & OBJECTIVE

Tài liệu này xác lập lộ trình chuyển đổi an toàn (**Zero-Regression Migration Plan**) và ma trận kiểm thử chất lượng (**QA Verification Matrix**) cho hệ sinh thái thế giới mới. 

Mục tiêu tối thượng: Khi được Game Director cấp quyền triển khai code trong tương lai, quá trình tích hợp hệ thống Multi-Biome World Architecture phải **bảo tồn $100\%$ tính toàn vẹn** của các hệ thống đã hoàn thành trong các nhánh trước, bao gồm:
1. Cấu trúc cây sồi và mặt đất cổ thụ đã được hiệu chỉnh (**Oak Root V5 Hybrid Correction**).
2. Hệ thống đào và lấp đất (**Dig/Fill Controller & Clay Mud Stockpile**).
3. Hệ thống sinh vật và tìm đường (**Fauna AI, Ant Colony & Terrain Pathfinder** - định nghĩa dưới dạng Future Integration Contract).
4. Hệ thống thủy văn mặt nước (**Aquatic System**) và khí tượng (**Weather Controller**).

---

## 2. NGUYÊN TẮC BẢO TỒN NỀN TẢNG (BACKWARD COMPATIBILITY PRINCIPLES)

```
+-----------------------------------------------------------------------------------------+
|                                RUNTIME RUN-LOOP TƯƠNG LAI                               |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   +------------------------------------+      +-------------------------------------+   |
|   | Oak Root System (V5 Hybrid)        |      | Dig / Fill Controller (TASK-021)    |   |
|   | Tọa độ neo giữ: Chunk (0, 0)       |      | Thao tác trực tiếp trên lưới 32px   |   |
|   +-----------------+------------------+      +------------------+------------------+   |
|                     │                                            │                      |
|                     ▼                                            ▼                      |
|   +---------------------------------------------------------------------------------+   |
|   | WORLD INTEGRATION FACADE (Adapter Layer)                                        |   |
|   | Che giấu sự phức tạp của Chunk Streaming & Biome Registry đối với gameplay cũ.  |   |
|   +---------------------------------------------------------------------------------+   |
|                     │                                                                   |
|                     ▼                                                                   |
|   +---------------------------------------------------------------------------------+   |
|   | NEW MULTI-BIOME ENGINE (6 Chunks Prototype Grid: 2x3, Cells 32x32px)            |   |
|   +---------------------------------------------------------------------------------+   |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

1. **Facade Pattern (Lớp bọc tương thích):**
   - Các hệ thống hiện tại (`TerrainPathfinder`, `DesignationManager`, `AntColony`) giao tiếp qua `IWorldTerrainFacade.getCell(x, y)` hoặc `IWorldTerrainFacade.setCell(x, y)` theo chuẩn cell $32\text{px}$. Lớp Facade sẽ tự động tính toán ra ô đó thuộc Chunk nào, nạp Delta ra sao mà không bắt mã nguồn cũ phải viết lại logic.
2. **Anchor Point Preservation:**
   - Cây sồi đại thụ `Oak Root V5` và tổ kiến trung tâm luôn được cố định tại tọa độ Neo chuẩn: $Chunk(0, 0)$ với $x \in [10, 40], y \in [-10, 30]$ (tương ứng vùng pixel $x \in [320, 1.280], y \in [-320, 960]$). Toàn bộ các Biome mới (Breeze Meadow, Wetland) sẽ mở rộng sang các Chunk kế cận ($X \ge 1, Y \ge 1$) mà không làm xê dịch dù chỉ 1 pixel của cây sồi.

---

## 3. LỘ TRÌNH 4 BƯỚC CHUYỂN ĐỔI AN TOÀN (WHEN AUTHORIZED)

> **CẢNH BÁO QUAN TRỌNG:** 4 bước này là kế hoạch thiết kế định hướng. Antigravity đang ở trạng thái **IMPLEMENTATION HOLD** và tuyệt đối không thực hiện bất kỳ bước nào dưới đây cho đến khi có lệnh bằng văn bản từ Game Director.

- **Bước 1: Thiết lập Data Contracts & Fixture Tests (Isolated Mocking):**
  - Tạo các schema JSON định nghĩa 8 Biomes.
  - Viết Unit Tests kiểm tra tính xác định (Deterministic output) của thuật toán sinh số ngẫu nhiên Noise mà không đụng tới render.
- **Bước 2: Xây dựng Adapter Facade (Parallel Shadowing):**
  - Xây dựng lớp trung gian `WorldTerrainFacade`. Cho chạy song song hệ thống cũ và Facade mới trên môi trường kiểm thử headless để so sánh kết quả ma trận ô (Pixel Diff Matrix = 0).
- **Bước 3: Tích hợp Lưới Prototype 2×3 Chunks ($128 \times 192$ cells):**
  - Kích hoạt lưới 6 Chunks trong scene thử nghiệm biệt lập. Xác nhận vùng chuyển tiếp giữa Chunk (0,0) [Ancient Forest] và Chunk (1,0) [Breeze Meadow] mượt mà, không gãy vỡ hình thái.
- **Bước 4: Kiểm thử Tương Tác Sâu & Tải Lưu Trữ:**
  - Kiểm thử đàn kiến đào đường hầm từ Chunk (0,0) xuyên xuống Chunk (0,2) [Limestone Caverns]. Xác nhận lưu game và nạp lại giữ nguyên 100% đường hầm.

---

## 4. MA TRẬN KIỂM THỬ CHẤT LƯỢNG (QA VERIFICATION MATRIX)

| Test ID | Hạng mục kiểm thử | Tiêu chuẩn đạt (Acceptance Criteria) | Mức độ nghiêm trọng |
| :--- | :--- | :--- | :--- |
| **QA-WB-01** | **Deterministic World Generation** | Cùng 1 `WorldSeed` trên 2 lượt chạy khác nhau phải tạo ra mảng ô địa hình nền giống nhau $100\%$ ($0$ cell sai lệch), độc lập với thứ tự sinh Chunk. | **P0 (Blocker)** |
| **QA-WB-02** | **Oak Root V5 Visual Stability** | Sau khi tích hợp Biome Engine, hình ảnh cây sồi tại Chunk (0,0) không bị lệch vị trí, không đứt gốc, không mất viền alpha trên nền $32\text{px/cell}$. | **P0 (Blocker)** |
| **QA-WB-03** | **Cross-Chunk Seam Integrity** | Ranh giới giữa Chunk 0 và Chunk 1 không xuất hiện khe nứt vô hình, không bị rách sprite, kiến bò qua biên giới liên tục. | **P0 (Blocker)** |
| **QA-WB-04** | **Dig / Fill Delta Persistence** | Người chơi đào 50 ô bùn ở Chunk (1,1) -> Di chuyển camera ra xa để Chunk bị unstream -> Quay lại -> 50 ô đào vẫn còn nguyên. | **P0 (Blocker)** |
| **QA-WB-05** | **Hydrology Leakage into Karst** | Mưa trên Ancient Forest Chunk (0,0) tích nước và dẫn dòng chảy ngầm xuất hiện tại trần vòm Limestone Cavern Chunk (0,2). | **P1 (High)** |
| **QA-WB-06** | **Performance Target Budget (Thiết kế)** | Khi kích hoạt streaming 6 Chunks: Tỉ lệ khung hình mục tiêu $\ge 60\text{ FPS}$, bộ nhớ RAM tiêu thụ mục tiêu $\le 250\text{ MB}$, Tick CPU mục tiêu $\le 2.0\text{ ms}$. | **P1 (High)** |

---

## 5. KẾ HOẠCH HỒI PHỤC KHI CÓ SỰ CỐ (ROLLBACK STRATEGY)

Trong trường hợp việc tích hợp trong tương lai gặp lỗi hồi quy nghiêm trọng:
1. Thiết kế sử dụng cơ chế **Feature Flag Toggle**:
   ```typescript
   export const WORLD_FEATURE_FLAGS = {
     ENABLE_MULTI_BIOME_STREAMING: false, // Mặc định tắt, dùng fallback Single-Screen World
   };
   ```
2. Nếu cờ tắt, toàn bộ hệ thống tự động quay về render chế độ 1 màn hình của `EnvironmentPreviewScene` hiện hữu, đảm bảo tiến độ dự án không bao giờ bị gián đoạn.

---

## 6. ACCEPTANCE CRITERIA
- [x] Lộ trình chuyển đổi bảo toàn tuyệt đối mã nguồn và asset đã duyệt của Oak Root V5, Dig/Fill.
- [x] Ghi nhận rõ ràng: Fauna AI là Future Integration Contract; 60 FPS / 250MB là Performance Target.
- [x] Ma trận kiểm thử QA chi tiết từ P0 đến P1 bao quát tính xác định, biên giới chunk, lưu trữ và hiệu năng.
- [x] Hoàn toàn tuân thủ ranh giới không triển khai mã nguồn runtime.
