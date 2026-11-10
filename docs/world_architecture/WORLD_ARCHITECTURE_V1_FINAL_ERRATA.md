# WORLD ARCHITECTURE V1 — FINAL ERRATA
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Working Directory:** `GAME/`  
**Milestone:** Nhánh 04 — World & Biome Architecture V1 (Checklist 02)  
**Classification:** Official Errata & Final Engineering Addendum  
**Status:** DESIGN BASELINE LOCKED / FINAL ERRATA APPLIED / STRICT IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  

---

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG

Tài liệu này là bản phụ lục đính chính chính thức (**Official Errata**) của Game Director, có hiệu lực ghi đè và chuẩn hóa 3 điểm kỹ thuật cụ thể trong bộ 6 tài liệu kiến trúc thuộc gói `WORLD_ARCHITECTURE_V1_DESIGN_HANDOFF_R1.zip` mà **không cần viết lại toàn bộ** các tài liệu đã được phê chuẩn.

Mọi triển khai kỹ thuật trong tương lai bắt buộc phải tuân thủ các quy tắc trong bản Errata này.

---

## 2. NỘI DUNG BA ĐIỀU CHỈNH KỸ THUẬT BẮT BUỘC

### 2.1 ĐIỀU CHỈNH 01: OAK ANCHORING & HỖ TRỢ OAK HYBRID V6
- **Điều khoản bị ghi đè:** Hủy bỏ toàn bộ các tọa độ giả định và bounding box tĩnh đã ghi trong tài liệu trước đó (ví dụ: `x = 320..1280, y = -320..960` tại Chunk `(0,0)`).
- **Quy tắc thiết kế mới (Dynamic World-Space Anchor):**
  1. **Không Hardcode Bounding Box:** Không gắn chặt kích thước hình học vào asset Oak V5 khi asset này đang được thay thế.
  2. **World-Space Anchor Point:** Cây sồi đại thụ được định vị bằng **một điểm Neo không gian thế giới duy nhất (`WorldAnchorPoint: { anchorX, anchorY }`)** biểu diễn vị trí gốc rễ tiếp đất chuẩn xác trên runtime thực tế.
  3. **Hỗ trợ Oak Hybrid V6:** Thiết kế Adapter Layer sẵn sàng tiếp nhận asset **Oak Hybrid V6** (với đặc tính hai nhánh lớn vươn ngang và hệ rễ liền khối nguyên khối) ngay khi Art Director bàn giao. Kích thước bounding box, vùng rễ chiếm chỗ (Root Footprint) và mặt nạ đào rỗng (Root Mask) sẽ được nạp động từ Metadata File đi kèm asset V6 (`oak_v6_metadata.json`), đảm bảo không làm đứt gãy tính liên tục của địa hình xung quanh.

### 2.2 ĐIỀU CHỈNH 02: CHUẨN HÓA CÁC THAM SỐ MÔ PHỎNG (CONFIGURABLE GAMEPLAY PARAMETERS)
- **Điều khoản bị ghi đè:** Hủy bỏ quan niệm coi các hằng số mô phỏng (như nhiệt độ ngầm $16^\circ\text{C}$ ở 40 cells, rễ tăng $+300\%$ độ kết dính, hoặc độ sâu băng vĩnh cửu $>15\text{ cells}$) là các định luật sinh thái khoa học bất biến.
- **Quy tắc thiết kế mới (Data-Driven Gameplay Tuning):**
  1. Toàn bộ các giá trị này được định nghĩa là **tham số cân bằng gameplay có thể cấu hình linh hoạt (Configurable Gameplay Balance Parameters)** trong các tệp cấu hình JSON (`SimulationTuningConfig.json`).
  2. **Bảng tham số mẫu (Baseline Defaults - Dễ dàng tinh chỉnh):**
     ```typescript
     export interface SimulationTuningConfig {
       // Nhiệt độ ngầm: Cho phép Director cân chỉnh độ sâu triệt tiêu nhiệt
       subterraneanEquilibriumTempCelsius: number; // Mặc định gợi ý: 16.0 (Tùy chỉnh: 10.0 - 22.0)
       thermalDampingHalfDepthCells: number;       // Mặc định gợi ý: 20 (Tùy chỉnh: 10 - 50)

       // Cơ học rễ: Tỉ lệ gia cố trần đất tùy thuộc độ tuổi và giống cây
       rootCohesionMultiplier: number;             // Mặc định gợi ý: 3.0 (Tùy chỉnh: 1.5 - 5.0)

       // Địa chất băng giá: Ngưỡng chuyển tiếp địa tầng linh hoạt
       seasonalFrostMaxDepthCells: number;         // Mặc định gợi ý: 15 (Tùy chỉnh: 5 - 30)
       permafrostHardnessMultiplier: number;       // Mặc định gợi ý: 4.0 (Tùy chỉnh: 2.0 - 10.0)
     }
     ```
  3. Không tuyên bố các thông số này là "quy luật sinh thái phổ quát", mà là các biến số gameplay phục vụ cảm giác chơi (game feel) và độ thử thách của người chơi.

### 2.3 ĐIỀU CHỈNH 03: BẢO VỆ TIẾN TRÌNH NGƯỜI CHƠI (NON-DESTRUCTIVE PERSISTENCE RECOVERY)
- **Điều khoản bị ghi đè:** Hủy bỏ hoàn toàn phương án "tự động xóa bỏ Delta lỗi và âm thầm trả về Base World", vì hành vi này sẽ phá hủy toàn bộ công sức đào hầm, lấp tổ của người chơi.
- **Quy tắc thiết kế mới (Multi-Tier Safe Recovery Pipeline):**
  1. **Snapshot Rollback (Khôi phục từ bản lưu hợp lệ gần nhất):** Hệ thống duy trì ít nhất 2 phiên bản Delta (`CurrentDelta` và `PreviousSnapshotDelta`). Nếu bản hiện tại bị lỗi kiểm tra toàn vẹn (CRC / Schema Mismatch), hệ thống tự động phục hồi về Snapshot hợp lệ gần nhất.
  2. **Quarantine Corrupted Delta (Cô lập dữ liệu hỏng):** Bản Delta bị lỗi không bị xóa bỏ, mà được đổi tên thành `QUARANTINE_chunk_{cx}_{cy}_{timestamp}.corrupt` và lưu vào vùng lưu trữ cách ly để phục vụ cứu hộ dữ liệu (Data Forensics) và vá lỗi.
  3. **Explicit User Notification (Cảnh báo minh bạch):** Nếu việc phục hồi thất bại và buộc phải tái tạo lại ô địa hình từ Base Layer, hệ thống **bắt buộc phải hiển thị hộp thoại cảnh báo rõ ràng cho người chơi** (kèm mã lỗi và tọa độ Chunk bị ảnh hưởng), tuyệt đối không âm thầm xóa dữ liệu ngầm.
  4. **Strict Acceptance Criteria:** Đưa tiêu chí "Zero Unintended Player Progress Loss" vào bài kiểm tra tự động P0 trong `WORLD_MIGRATION_AND_QA_PLAN.md`.

---

## 3. MA TRẬN ÁNH XẠ ĐÍNH CHÍNH (ERRATA MAPPING MATRIX)

| Tài Liệu Bị Ảnh Hưởng | Nội Dung Cũ (Cần Ghi Đè) | Nội Dung Mới Theo Errata (Áp Dụng Chính Thức) |
| :--- | :--- | :--- |
| **`MULTI_BIOME_WORLD_DESIGN_V1.md`** & **`WORLD_MIGRATION_AND_QA_PLAN.md`** | Hardcode vị trí Oak V5 tại Chunk `(0,0)`, bounding box `320..1280`. | Chuyển sang `WorldAnchorPoint` động; sẵn sàng tiếp nhận metadata và footprint của **Oak Hybrid V6**. |
| **`DEPTH_COUPLING_SYSTEM_BLUEPRINT.md`** & **`BIOME_DEFINITION_MATRIX_V1.md`** | Coi $16^\circ\text{C}$ và rễ $+300\%$ là quy luật sinh thái định lượng chuẩn. | Quy chuẩn thành **Configurable Gameplay Parameters** nằm trong cấu hình JSON tuning riêng biệt. |
| **`CHUNK_STREAMING_ARCHITECTURE.md`** & **`WORLD_MIGRATION_AND_QA_PLAN.md`** | Xóa Delta lỗi và phục hồi về Base Layer khi CRC thất bại. | Triển khai **Snapshot Recovery $\rightarrow$ Data Quarantine $\rightarrow$ User Warning**; cấm xóa dữ liệu người chơi. |

---

## 4. XÁC NHẬN CHỐT THIẾT KẾ (DESIGN BASELINE LOCKED)
Bản Errata này chính thức hoàn tất toàn bộ các yêu cầu hiệu chỉnh của Game Director đối với Nhánh 04:
- **WORLD ARCHITECTURE V1 — DESIGN BASELINE: LOCKED.**
- **CHECKLIST 02 — WORLD ARCHITECTURE: DESIGN COMPLETE / RUNTIME IMPLEMENTATION HOLD.**
- Nhánh 04 dừng mọi hoạt động tác động mã nguồn, sẵn sàng bước sang thiết kế mở rộng V2 trên giấy khi có chỉ thị tiếp theo.
