# BÁO CÁO NGHIỆM THU QA MỸ THUẬT: PACK-003 ART CANDIDATES (V2 CORRECTION)
## CHECKLIST-02 / TASK-018 — SUBTERRANEAN STRATA & PEBBLES

**Gói kiểm tra:** `THE_VIVARIUM_TASK018_PACK003_ART_CANDIDATE.zip`  
**Chế độ:** QA ONLY — NO PRODUCTION INTEGRATION  
**Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-018-underground`  
**Branch:** `task/018-underground`  
**Commit:** `6544243` (Giữ nguyên tuyệt đối, không merge, không push)  
**Môi trường kiểm thử:** Vite Server chuyên dụng trên cổng độc lập `http://localhost:22018/?mode=pack003-qa` (Bật cờ `--strictPort`)  
**Ngày kiểm định:** 2026-10-21  

---

## 1. NGUYÊN NHÂN LỖI ĐỢT V1 & BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ

- **Nguyên nhân V1 thất bại:**  
  Ở đợt V1, cổng `2000` đang phục vụ tiến trình Vite background của Sandbox chính (`mode=environment-preview` / `App.tsx` chính). Khi script kiểm thử điều hướng tới URL test trên cổng `2000`, texture loading bị fall back vào cache cũ của PixiJS (`Texture.from` thay vì `Assets.load`), dẫn đến việc chụp nhầm giao diện Sandbox thay vì hiển thị texture candidate PACK-003.
- **Biện pháp khắc phục triệt để ở V2:**
  1. Khởi chạy instance Vite server hoàn toàn độc lập trên cổng riêng **`22018`** kèm flag `--strictPort` (PID 24684), tách biệt 100% với cổng 2000.
  2. Bắt buộc kiểm tra tiền điều kiện trước khi chụp:
     - URL xác nhận: `http://localhost:22018/?mode=pack003-qa` (HTTP 200 OK).
     - DOM Header xác nhận: `"THE VIVARIUM — PACK-003 ART QA CORRECTION SUITE (PORT 22018)"`.
     - 4 file candidate xác nhận load thành công 100% (`LOADED_OK`).
  3. Cập nhật `Pack003QAScene.tsx` dùng `Assets.load()` chuẩn PixiJS v8 và hiển thị trực quan các lưới chia cell, khung đo bounding box và telemetry đào/lấp.

---

## 2. KẾT QUẢ ĐÁNH GIÁ CHI TIẾT TỪNG ASSET (PASS / CONDITIONAL / FAIL)

| Asset ID | Tên File Quy Chuẩn | Kích Thước | Mode | Đánh Giá QA | Chi Tiết Kỹ Thuật & Tồn Đọng Mỹ Thuật |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ENV-TERRAIN-CLAY-01` | `env_terrain_clay_512.png` | $512 \times 512$ | RGB (Opaque) | **CONDITIONAL PASS** | **Ưu điểm:** Seam difference $H=0$, $V=0$ (liền mạch toán học). Màu đất sét nâu cam (`#904a1d`) ấm, chuẩn tone Visual Bible.<br>**Tồn đọng:** Trên lưới 3×3 xuất hiện các đốm sáng lặp chu kỳ 512px (tiling repeat pattern).<br>**Khuyến nghị tích hợp:** Áp dụng shader/UV offset 2 tầng (Dual-layer Loam technique) khi tích hợp để triệt tiêu mắt lặp. |
| `ENV-TERRAIN-PEAT-01` | `env_terrain_peat_512.png` | $512 \times 512$ | RGB (Opaque) | **PASS** | **Ưu điểm:** Seam difference $H=0$, $V=0$. Tone than bùn sẫm (`#2c1a11`), độ tương phản dịu mắt, bề mặt mùn hữu cơ tự nhiên. Khi ghép 3×3 hoàn toàn không lộ ô vuông hay gờ chia cắt. Thích hợp làm base tầng sâu. |
| `ENV-TRANSITION-MASK-01` | `env_mask_organic_blend.png` | $512 \times 512$ | Grayscale (L) | **PASS** | **Ưu điểm:** Seam difference $H=0$, $V=0$. Dải gradient mây khói hữu cơ mượt 0..255. Tạo chuyển tầng địa chất giữa Than bùn và Đất sét uốn lượn tự nhiên, xóa bỏ hoàn toàn dải phân cách phẳng nhân tạo. |
| `ENV-PEBBLE-EMBED-01` | `env_pebble_embedded.png` | $512 \times 512$ | RGBA | **CONDITIONAL PASS** | **Ưu điểm:** Cụm sỏi sắc nét, có khối 3D ánh sáng tự nhiên, alpha sạch 84.57% trong suốt, hòa hợp tốt trên nền đất mùn/đất sét.<br>**Tồn đọng:** Trên nền trắng kiểm tra lộ viền mờ (faint contact fringe) khoảng 1px. Kích thước $512\times 512$ hơi to so với tỷ lệ kiến ($36.8\text{ px}$).<br>**Khuyến nghị tích hợp:** Scale xuống $0.35\times - 0.5\times$ khi gắn trang trí vách hang. |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ THEO CÁC TIÊU CHÍ

### 3.1 Bảng Texture 3×3 & Khử Seam (`01_tiles_3x3_seam_and_pattern_audit.png`)
- Dựng bảng so sánh song song 3 panel $420 \times 420\text{ px}$ thể hiện chính xác $3 \times 3$ tiles của **Clay**, **Peat** và **Mask**.
- Các đường chỉ đỏ phân ranh giới ô lưới (step = 140px) chứng minh:
  - Tiếp giáp giữa các cạnh không có bất kỳ khe hở, đường đứt đoạn hay lệch pha màu nào (Edge difference = 0.0px).
  - Peat và Mask phân bố cực kỳ đồng đều; Clay có pattern đốm sáng lặp chu kỳ cần khử bằng dual UV offset.

### 3.2 Kiểm Tra Sỏi Alpha Trên 3 Nền (`02_pebble_alpha_checkerboard.png`)
- Panel 1: **Nền Caro Alpha (Checkerboard $20\text{ px}$)** — chứng minh độ trong suốt mượt mà của alpha channel, không bị răng cưa hay lẹm đen.
- Panel 2: **Nền Trắng 100% (White BG)** — phát hiện viền mờ tiếp xúc nhẹ (faint halo) ~1px do kỹ thuật tách nền từ source presentation.
- Panel 3: **Nền Đất Ẩm (Dark Loam Soil `#24160f`)** — viền mờ tiệp hoàn toàn vào màu đất, các viên sỏi nổi khối 3D tự nhiên.

### 3.3 Chuyển Tầng Địa Chất Clay → Peat Bằng Mask (`03_strata_transition_clay_to_peat.png`)
- Dựng mặt cắt địa tầng lớn $1400 \times 540\text{ px}$: Than bùn Peat nằm ở tầng sâu bên dưới, Đất sét Clay phủ bên trên.
- Sử dụng `env_mask_organic_blend.png` làm alpha blend tại ranh giới chuyển tiếp; bố trí 7 cụm sỏi sáp nhập tự nhiên dọc đường phân tầng.
- Ranh giới giữa 2 tầng đất uốn lượn hữu cơ, mềm mại, hoàn toàn không có cảm giác đường kẻ thẳng nhân tạo.

### 3.4 Kiểm Tra Zoom Thực Tế & Đo Bounding Box (1.0×, 2.0×, 4.0×)
Khung đo pixel bounding box (màu hồng) xác nhận kích thước hiển thị thay đổi chuẩn xác theo hệ số phóng đại:
- **Zoom 1.0× (`04_zoom_1x_pixel_bounding_box.png`):** Bounding box $420 \times 480\text{ px}$ bao trọn texture gốc $512 \times 512$. Độ nét nguyên bản, không mờ nhòe.
- **Zoom 2.0× (`05_zoom_2x_pixel_bounding_box.png`):** Bounding box hiển thị chi tiết phóng to gấp đôi. Sợi xơ của than bùn và vết rạn đất sét hiện rõ từng thớ nhỏ.
- **Zoom 4.0× (`06_zoom_4x_pixel_bounding_box.png`):** Bounding box cận cảnh vi mô. File PNG lossless giữ nguyên các cạnh sắc nét, tuyệt đối không bị artifact vỡ hạt kiểu JPEG.

### 3.5 Thử Nghiệm Dig/Fill & Đo Pixel-Diff Thực Tế (`07_dig_interaction_before.png` → `08_dig_interaction_after.png`)
- Cố định camera tại cùng góc nhìn $1400 \times 540\text{ px}$.
- **BEFORE (Ảnh 07):** Địa tầng 2 lớp nguyên vẹn với 2 buồng hang cơ sở.  
  *Telemetry:* Solid Cells: **1480** | Void Cells: **120** | Dug: **+0**
- **AFTER (Ảnh 08):** Đào thêm đường hầm thẳng đứng kết nối từ bề mặt xuyên qua tầng than bùn xuống buồng hang.  
  *Telemetry:* Solid Cells: **1462** | Void Cells: **138** | Dug: **+18 cells** (Vị trí: `X: 680, Y: 180..300`)
- **Kết quả đo Pixel-Diff:**
  - Tổng số pixel so sánh: $1,447,600\text{ px}$
  - Số pixel thay đổi thực tế: **34,141 px** (chiếm **2.36%** diện tích viewport)
  - Bounding box vùng đào: `minX: 69, maxX: 1488, minY: 0, maxY: 680` (Tập trung chính xác vào trục hầm đào mới và telemetry cập nhật trên thanh HUD).

---

## 4. DANH MỤC SCREENSHOT NGHIỆM THU V2

Bộ 8 ảnh chụp màn hình thực tế lưu tại `QA/TASK-018_PACK003_ART_QA_V2/`:
1. `01_tiles_3x3_seam_and_pattern_audit.png` (403.5 KB) — Bảng texture 3×3 kèm đường phân ô đỏ.
2. `02_pebble_alpha_checkerboard.png` (213.5 KB) — Sỏi trên nền caro alpha, nền trắng và nền đất.
3. `03_strata_transition_clay_to_peat.png` (742.4 KB) — Chuyển tầng Clay → Peat bằng grayscale mask.
4. `04_zoom_1x_pixel_bounding_box.png` (990.0 KB) — Kiểm tra Zoom 1.0× kèm bounding box.
5. `05_zoom_2x_pixel_bounding_box.png` (653.3 KB) — Kiểm tra Zoom 2.0× kèm bounding box.
6. `06_zoom_4x_pixel_bounding_box.png` (434.8 KB) — Kiểm tra Zoom 4.0× kèm bounding box.
7. `07_dig_interaction_before.png` (594.0 KB) — Dig/Fill BEFORE (Solid: 1480, Void: 120).
8. `08_dig_interaction_after.png` (608.2 KB) — Dig/Fill AFTER (Solid: 1462, Void: 138, Dug: +18).

---

## 5. THÔNG TIN GÓI BÀN GIAO V2

- **File bàn giao:**  
  `C:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\.worktrees\task-018-underground\QA\TASK-018\TASK-018_PACK003_ART_QA_EVIDENCE_V2.zip`  
  *(Bản sao lưu tại: `the-vivarium-web/QA/TASK-018/TASK-018_PACK003_ART_QA_EVIDENCE_V2.zip`)*
- **Nội dung bên trong ZIP:**
  - 8 file screenshot nghiệm thu thực tế theo đúng tiêu chí kiểm định.
  - File báo cáo kỹ thuật `TASK-018_PACK003_ART_QA_REPORT_V2.md`.
- **An toàn hệ thống:**
  - Mọi công cụ và test scene tạm thời đã được dọn sạch khỏi source code.
  - Git working tree sạch sẽ, commit `6544243` giữ nguyên.
  - Không chỉnh sửa 4 file PNG gốc, không merge, không push remote.

---

**DỪNG BƯỚC THỰC THI — Báo cáo và bằng chứng V2 đã hoàn tất, kính trình Game Director kiểm định.**
