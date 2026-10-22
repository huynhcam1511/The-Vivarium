# TASK-019 QA CORRECTION & MERGE READINESS REPORT
## CHECKLIST-02 | PACK-004 AQUATIC

> **Director Decision:** CONDITIONAL PASS — ENGINEERING PROTOTYPE. ART QA NOT APPROVED.  
> **Role:** Senior Game Engineer — THE VIVARIUM  
> **Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-019-aquatic`  
> **Branch:** `task/019-aquatic`  
> **Base Commit:** `6c28a32`  
> **Current Task Commit:** `6b36635` (Giữ nguyên, không merge vào main)

---

## 1. Kiểm Tra Git Patch & `git apply --check`

- **Tạo lại Patch chuẩn UTF-8 / LF:**
  - File: `TASK-019_SOURCE_PATCH_UTF8.patch` (định dạng binary patch hỗ trợ cả hình ảnh png và mã nguồn UTF-8 LF).
- **Kiểm thử `git apply --check` trong môi trường Git sạch:**
  - Đã thực hiện clone tạm thời từ repository gốc vào thư mục sạch (`$env:TEMP/task019_patch_test`), checkout đúng base commit `6c28a32`.
  - Thực thi lệnh: `git apply --check TASK-019_SOURCE_PATCH_UTF8.patch`.
  - **Kết quả:** `APPLY_CHECK_RESULT: True` (Exit Code 0).
  - Khẳng định: Patch áp dụng hoàn toàn sạch sẽ, không lỗi conflict, không rách hunk khi áp dụng lên base commit `6c28a32`.
  - Thư mục test tạm đã được dọn dẹp sạch. Không có bất kỳ thay đổi nào tác động lên nhánh `main`.

---

## 2. Kiểm Tra Thực Tế Camera Presets (LAKE, WATERFALL, OVERVIEW)

Game Director yêu cầu ghi nhận thông số biến đổi của Camera, Viewport và World Transform tại từng góc nhìn để loại trừ việc chụp trùng góc:

### Bảng Thông Số Kỹ Thuật Biến Đổi Camera

| Preset | Target $(X, Y)$ | Zoom Factor | World Bounds nhìn thấy trên màn hình $1600 \times 1000$ | World Container Transform $(Scale, PosX, PosY)$ | Mục Tiêu Khảo Sát Kỹ Thuật |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **LAKE (Lòng Hồ)** | $(1680, 600)$ | $1.25\times$ | $X \in [1040, 2320]$<br>$Y \in [200, 1000]$ | `scale: 1.25`<br>`pos: (-1300, -250)` | Khảo sát đáy hồ trầm tích, đàn cá Minnow/Carp bơi lội, vịt trời Mallard và các cụm rong ngập nước. |
| **WATERFALL (Thác Nước)** | $(1390, 480)$ | $1.50\times$ | $X \in [856, 1923]$<br>$Y \in [146, 813]$ | `scale: 1.50`<br>`pos: (-1285, -220)` | Khảo sát hẻm đá vách đứng, dòng thác uốn lượn, thảm rêu nhung bám đá và bể bọt nước va đập. |
| **OVERVIEW (Toàn Cảnh)** | $(1580, 520)$ | $0.90\times$ | $X \in [691, 2468]$<br>$Y \in [-35, 1076]$ | `scale: 0.90`<br>`pos: (-622, 32)` | Khảo sát tổng thể liên kết giữa đại cổ thụ, đường chân trời đất hữu cơ, vách thác và toàn bộ lưu vực lòng hồ. |

### Gói Ảnh Kiểm Chứng Góc Nhìn Camera
- File đóng gói: `TASK-019_CAMERA_EVIDENCE.zip` (1,187,653 bytes)
- Ba file ảnh chụp thực tế có sự thay đổi rõ rệt về bố cục, tỉ lệ và tiêu cự:
  1. `01_preset_lake_1680_600_z1.25.png` (SHA256: `1A625978...`)
  2. `02_preset_waterfall_1390_480_z1.50.png` (SHA256: `F06D1674...`)
  3. `03_preset_overview_1580_520_z0.90.png` (SHA256: `AE506E27...`)

---

## 3. Báo Cáo Phương Án Khắc Phục Bố Cục Trống Tối & Scale Cảnh Quá Nhỏ

### A. Phân tích nguyên nhân
1. **Viewport & Bounding mismatch:** Canvas màn hình chạy ở $1600 \times 1000$ (tỉ lệ 16:10), trong khi layout thế giới `WorldRenderer` chuẩn được dựng trên khung logic gốc $1920 \times 1440$ (với mặt đất ở $Y=640$, hồ nước ở $X \in [1350, 1980]$).
2. **Khoảng đen bao quanh:** Do hiện tại chưa có layer Backdrop Parallax xa (PACK-005 mây trời và rặng núi alpine), nền canvas mặc định màu sẫm `#0A1017` bị lộ ra ở các khoảng trống phía đông và phía trên.
3. **Mô hình hóa hình học tạm thời:** Các đối tượng thủy sinh hiện tại đang render bằng vector thuần túy (Graphics context) để kiểm chứng mô phỏng, chưa có texture mesh map phủ kín diện tích lòng hồ.

### B. Phương án kỹ thuật chuẩn (TUYỆT ĐỐI KHÔNG DÙNG THÊM HÌNH VECTOR GIẢ LẬP)
Khi 2D Art Team bàn giao 5 file PNG chính thức:
1. **Thiết lập World Viewport Clamp:** Trong `CameraController`, giới hạn camera bounds chặt chẽ theo bounding box của lòng hồ và đại ngàn ($X \in [1100, 2000]$, $Y \in [200, 800]$ khi ở chế độ xem thủy sinh).
2. **Đồng bộ hóa độ cao mặt đất:** Đưa đường chân trời của lòng hồ khớp tuyệt đối với `OrganicTerrainData.getSurfaceY(worldX)` thay vì đặt một hằng số $Y=570$ cố định.
3. **Áp dụng Tiling Sprite cho bùn đáy hồ:** Sử dụng texture `env_lake_bottom_mud.png` trải đều trên mesh uốn lượn để lấp đầy toàn bộ phần đáy tối.
4. **Tích hợp Backdrop Sky/Mountain từ PACK-005:** Khi ghép với tầng khí quyển thời tiết của TASK-020, bầu trời và núi tuyết xa sẽ phủ kín toàn bộ 100% diện tích phía trên đường chân trời, loại bỏ hoàn toàn khoảng đen.

---

## 4. Ghi Nhận Danh Mục 5 File PNG Còn Thiếu (PACK-004 Delivery Gate)

Tuân thủ nguyên tắc không tự sinh art giả lập, hệ thống ghi nhận chính thức 5 asset sau đang chờ Art Team sản xuất:

| STT | Asset ID | Tên File Quy Chuẩn | Kích Thước Canvas Gốc | Kích Thước Render Logic | Pivot Quy Định |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | `ENV-FLOWER-BLUEBELL-01` | `env_flower_bluebell.png` | $128 \times 128$ | $30 \times 42\text{ px}$ | `(0.50, 1.00)` |
| 2 | `ENV-MOSS-PATCH-01` | `env_moss_patch.png` | $128 \times 128$ | $64 \times 32\text{ px}$ | `(0.50, 0.50)` |
| 3 | `ENV-FERN-CLUSTER-01` | `env_fern_cluster.png` | $128 \times 128$ | $56 \times 48\text{ px}$ | `(0.50, 1.00)` |
| 4 | `ENV-LAKE-BOTTOM-MUD` | `env_lake_bottom_mud.png` | $768 \times 128$ | $384 \times 64\text{ px}$ | `(0.00, 0.00)` |
| 5 | `ENV-WATER-FALL-STREAM` | `env_waterfall_stream.png` | $128 \times 440$ | $64 \times 220\text{ px}$ | `(0.50, 0.00)` |

---

## 5. Tình Trạng Hợp Đồng Interface & An Toàn Song Song

- **Trạng thái Interface:** Được xác nhận chính thức là **ĐANG Ở TRẠNG THÁI THIẾT KẾ HỢP ĐỒNG (DESIGN CONTRACTS)**.
  - Các hàm `applyRainInflow`, `evaporateWater`, `getSedimentMoisture` đã pass 100% unit test độc lập.
  - **CHƯA ĐƯỢC NGHIỆM THU KẾT NỐI RUNTIME** nhằm giữ tính toàn vẹn độc lập giữa TASK-019 và TASK-020.
- **Git & Worktree:**
  - Branch `task/019-aquatic` giữ nguyên ở commit `6b36635`.
  - Không merge vào `main`.
  - Không can thiệp sang worktree của TASK-018 hay TASK-020.

---

## 6. Danh Mục Tài Liệu Bàn Giao

1. `TASK-019_QA_CORRECTION_REPORT.md` (Tài liệu này)
2. `TASK-019_CAMERA_EVIDENCE.zip` (`1,187,653 bytes` — 3 screenshot camera presets thực tế)
3. `TASK-019_SOURCE_PATCH_UTF8.patch` (`10,512,652 bytes` — patch git native binary UTF-8 / LF, đã test `git apply --check` thành công)
4. `TASK-019_MERGE_RISK_REPORT.md` (Báo cáo xung đột tiềm năng và giải pháp tích hợp)

*DỪNG sau khi bàn giao. Chờ Game Director nghiệm thu.*