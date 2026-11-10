# MULTI-BIOME WORLD DESIGN V1
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & VISION

### 1.1 Mục Tiêu Thiết Kế
Tài liệu này xác lập nền tảng kiến trúc thế giới đa hệ sinh thái (**Multi-Layer Ecological World Architecture**) cho *THE VIVARIUM*. Thiết kế khắc phục hoàn toàn hạn chế của mô hình đơn sinh cảnh tĩnh, hướng tới một thế giới mở rộng theo chiều ngang và liên kết sâu theo chiều dọc.

### 1.2 Triết Lý Module Kiểu Lego (Data-Driven Architecture)
- **Tách biệt dữ liệu và mã nguồn:** Mọi Biome được mô tả bằng dữ liệu (Data Contracts / JSON schema / TypeScript interfaces), không mã hóa cứng (hardcode) trong vòng lặp game hay render engine.
- **Khả năng mở rộng độc lập:** Thêm mới một Biome trong tương lai chỉ cần định nghĩa thêm Data Profile mà không làm xáo trộn World Engine cốt lõi.
- **Định hướng mỹ thuật thế giới (Visual Art Direction):** Thế giới *THE VIVARIUM* tuân thủ nghiêm ngặt phong cách **Stylized Hand-Painted 2D** (vẽ tay nghệ thuật, đường nét hữu cơ, chất liệu sơn dầu mượt mà, phân lớp ánh sáng tán xạ). Tuyệt đối **không** chuyển đổi sang Pixel Art cổ điển và không áp dụng các bộ lọc chấm hạt (dithering) làm phá vỡ nét vẽ tay hữu cơ.
- **Không gian tọa độ 2D thống nhất:** Hệ tọa độ thực thi duy nhất là 2D Cartesian `(X, Y)`:
  - Trục `X`: Chiều ngang thế giới (Surface distance).
  - Trục `Y`: Chiều sâu địa chất (`Y = 0` là mực chuẩn bề mặt, `Y > 0` là độ sâu lòng đất).

---

## 2. QUY CHUẨN KÍCH THƯỚC HỆ THỐNG LƯỚI (LOCKED GRID BASELINE V1)

Tuân thủ quyết định của Game Director, thông số lưới V1 được **khóa bất biến** để bảo vệ toàn vẹn logic đào/lấp, tìm đường và căn chỉnh đồ họa:

| Hạng mục | Giá trị khóa V1 (Baseline) | Ghi chú & Tương thích |
| :--- | :--- | :--- |
| **Cell Size** | **$32 \times 32$ pixels** | Đồng bộ tuyệt đối với `Dig/Fill Controller`, `Oak Root Masking`, và kích thước bước di chuyển của kiến thợ ($32\text{px}$). |
| **Chunk Size** | **$64 \times 64$ cells** | Khối đơn vị nạp/xả động. |
| **World Pixels / Chunk** | **$2.048 \times 2.048$ pixels** | $64\text{ cells} \times 32\text{ px/cell} = 2.048\text{ px}$. |
| **Prototype Scope** | **$2 \times 3$ Chunks (6 Chunks)** | Lưới kiểm chứng: Chiều ngang $128\text{ cells}$ ($4.096\text{ px}$), Chiều sâu $192\text{ cells}$ ($6.144\text{ px}$). |
| *Phương án nghiên cứu tương lai* | *$16 \times 16$ px/cell* | *Chỉ là tùy chọn nghiên cứu cho Micro-Simulation (LOD siêu chi tiết) ở các phiên bản sau, KHÔNG áp dụng cho V1.* |

---

## 3. PHÂN ĐỊNH BA KHÔNG GIAN ĐỊA LÝ & SINH THÁI

Nhằm ngăn ngừa sự nhầm lẫn giữa cảnh quan mặt đất, hệ thống hang ngầm và tầng địa chất vật lý, kiến trúc phân định rõ 3 khái niệm:

```
+-------------------------------------------------------------------------+
| SURFACE BIOMES (6 Khu vực bề mặt)                                       |
| Ancient Forest | Breeze Meadow | Wetland | Dunes | Canyon | Cold Forest |
+-------------------------------------------------------------------------+
| GEOLOGICAL STRATIFICATION (Tầng địa chất biến thiên liên tục theo Y)     |
| [Tầng 1: Đất mùn / Topsoil]                                            |
| [Tầng 2: Đất nén & Bùn sét / Subsoil]                                   |
| [Tầng 3: Đá phong hóa & Khe nứt / Fractured Strata]                     |
| [Tầng 4: Đá gốc & Nền móng / Bedrock]                                   |
+-------------------------------------------------------------------------+
| SUBTERRANEAN BIOMES (2 Khu vực lòng đất)                                |
| Limestone Caverns (Karst Hydrology) | Crystal Depths (Fantasy / Optional)|
+-------------------------------------------------------------------------+
```

1. **Surface Biomes (Sinh cảnh bề mặt):** Chịu chi phối trực tiếp của thời tiết, nắng, gió và lượng mưa trên không.
2. **Geological Layers (Tầng địa chất):** Quy luật phân tầng vật lý của đất đá theo độ sâu $Y$, áp dụng thống nhất nhưng có độ dày và độ xốp biến thiên theo từng Biome bề mặt.
3. **Subterranean Biomes (Sinh thái ngầm đặc thù):** Các khoang rỗng, mạng lưới hang karst hoặc vùng địa nhiệt/tinh thể sâu có vi khí hậu và chu trình sinh thái khép kín.

---

## 4. DANH MỤC 8 BIOMES CHÍNH THỨC (PHÂN LOẠI & LỘ TRÌNH)

### 4.1 Nhóm 6 Surface Biomes
1. **01 — Ancient Forest (Rừng cổ thụ):**
   - *Đặc điểm:* Rừng đại thụ râm mát, độ ẩm cao. Tập trung vào hệ rễ khổng lồ, mạng lưới nấm hoại sinh phân hủy gỗ mục và chu trình mùn hữu cơ. Nấm phát quang là loài đặc hữu hiếm ở hốc tối chân rễ.
2. **02 — Breeze Meadow (Đồng cỏ gió):**
   - *Đặc điểm:* Đồng cỏ thoai thoải, độ ẩm vừa, gió mặt đất liên tục. Đất mềm dễ đào, phát tán hạt giống hoa dại, thích hợp làm sinh thái khởi đầu (Spawn zone).
3. **03 — Wetland & Marsh (Đầm lầy & Vùng ngập nước):**
   - *Đặc điểm:* Bùn sét lầy lội, nước ngầm bão hòa, nguy cơ ngập úng cao. Là nguồn cung bùn sét (Clay/Mud) phục vụ đắp tổ và trữ ẩm.
4. **04 — Coastal Dunes (Cồn cát ven biển):**
   - *Đặc điểm:* Cát xốp hạt mịn, bốc hơi mạnh, gió thổi tạo đụn. Địa chất dễ sạt lở khi đào hầm không có trụ chống. Chứa thấu kính nước ngọt (Freshwater Lens) nằm trên tầng nước mặn; nguy cơ xâm nhập mặn khi khai thác cạn kiệt.
5. **05 — Arid Canyon (Hẻm núi khô cằn):**
   - *Đặc điểm:* Biên độ nhiệt ngày/đêm lớn, vách đá phiến và khe nứt. Kiến khai thác bằng cơ học tự nhiên: cạy vụn đất xốp trong khe nứt đá, không sử dụng công cụ đục khoáng kiểu con người.
6. **06 — Cold Forest (Rừng tuyết lạnh):**
   - *Đặc điểm:* Lạnh giá, tuyết phủ theo mùa. Phân biệt rõ hai tầng băng: Lớp đất đóng băng theo mùa (*Seasonal Frost Layer*) và tầng băng vĩnh cửu sâu (*Permafrost*). Hiện tượng rã đông làm nền đất yếu và gây sụt lún cơ học.

### 4.2 Nhóm 2 Subterranean Biomes
7. **07 — Limestone Caverns (Hang karst đá vôi):**
   - *Đặc điểm:* Hệ thống hang động ngầm liên thông, suối ngầm dòng chảy nhanh qua các ống dẫn karst xói mòn tự nhiên, nhũ đá, độ ẩm 100%. Nước và cặn bẩn di chuyển nhanh dọc các kênh karst.
8. **08 — Crystal Depths (Vực tinh thể sâu — Fantasy / Optional):**
   - *Phân loại:* **Nội dung Giả tưởng / Tùy chọn (Optional Expansion)**.
   - *Đặc điểm:* Vùng tinh thể khoáng sản sâu, phát quang tự nhiên nhờ phản ứng khoáng vật hoặc địa nhiệt. Tuyệt đối **không** áp đặt bức xạ hạt nhân hay năng lượng giả tưởng làm quy luật sinh thái mặc định của Vivarium.

---

## 5. LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN (STAGED ROADMAP)

| Giai đoạn | Mục tiêu Biome | Quy mô & Phạm vi kiểm chứng |
| :--- | :--- | :--- |
| **V1 — Core (TASK-021 Verification)** | **Ancient Forest**, **Breeze Meadow**, **Wetland & Marsh**, **Limestone Caverns** | Kiểm chứng trên lưới **$2 \times 3$ Chunks** ($128 \times 192$ cells, $4.096 \times 6.144\text{ px}$). Xác thực chuyển tiếp rừng–cỏ, bùn sét, nước thấm và hệ hang ngầm karst. |
| **V2 — Expansion** | **Coastal Dunes**, **Arid Canyon** | Kiểm chứng cơ chế sạt lở cát, thấu kính nước ngọt và cơ học đào khe nứt đá vôi. |
| **V3 — Expansion & Optional** | **Cold Forest**, **Crystal Depths** | Kiểm chứng chu kỳ nhiệt độ đóng/tan băng vĩnh cửu và vùng tinh thể sâu. |

---

## 6. DEPENDENCIES, RISKS & ACCEPTANCE CRITERIA

### 6.1 Dependencies & Hiện Trạng Hệ Thống
- **TASK-021 World Integration Scene:** Giữ nguyên vẹn mã nguồn hiện hữu của Oak Root V5, Dig/Fill Controller, Clay Mud Stockpile, Aquatic Manager.
- **Fauna AI & Pathfinding:** Lưu ý đây là **Future Integration Contract** (Hợp đồng giao diện tích hợp tương lai); hệ thống Biome mới cam kết tương thích thông qua Facade mà chưa tuyên bố đã bảo toàn toàn diện toàn bộ AI khi chưa chạy benchmark thực tế.
- **Hiệu Năng (Performance Target):** Ngưỡng $\ge 60\text{ FPS}$ và $\le 250\text{ MB RAM}$ là **Mục Tiêu Thiết Kế (Target)** cần đạt trong triển khai, chưa phải là kết quả benchmark kiểm chứng chính thức.

### 6.2 Acceptance Criteria
- [x] Khóa thông số lưới Baseline: Cell $32 \times 32\text{ px}$, Chunk $64 \times 64\text{ cells}$, Prototype $128 \times 192\text{ cells}$ ($2 \times 3$ Chunks).
- [x] Chuẩn hóa phong cách mỹ thuật Stylized Hand-Painted 2D, loại bỏ dán nhãn Pixel Art.
- [x] Phân định rạch ròi 6 Surface Biomes, 2 Subterranean Biomes và các Geological Layers.
- [x] Crystal Depths được đánh dấu Fantasy/Optional, loại bỏ hoàn toàn cơ chế bức xạ.
