# TASK-020 QA CORRECTION REPORT — WEATHER & ATMOSPHERE (PACK-005)

> **Role:** Senior Simulation & Game Systems Engineer — THE VIVARIUM  
> **Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather` (also aliased via `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-020-weather`)  
> **Branch:** `task/020-weather`  
> **Base Commit:** `6c28a32`  
> **New Head Commit:** `304b5e683ee0fc3bc52599292a1fe6beea7c9ce0`  
> **Evaluation Mode:** CRITICAL QA EVIDENCE CORRECTION & RE-VERIFICATION  
> **Final Status:** **PASS (Fully Verified with Live In-Engine Telemetry & Zero JS Errors)**

---

## 1. Root Cause Analysis (Nguyên Nhân Lỗi QA Ban Đầu)

1. **Port Collision & Wrong Server Capture:**
   - Trong đợt capture trước, script trỏ vào `http://localhost:2000/?mode=weather`.
   - Tại port 2000, một process Vite cũ (PID 20888) khởi động từ `GAME/the-vivarium-web` đang chạy instance chính (chế độ Sandbox thông thường), hoàn toàn không có router `mode=weather`. Script Puppeteer ban đầu chỉ kiểm tra button theo chuỗi text mà không kiểm tra sự tồn tại của header hay canvas thời tiết, dẫn tới việc chụp lại màn hình Sandbox cơ bản 6 lần.
2. **React 19 / PixiJS v8 Double-Mount Lifecycle Bug:**
   - Khi chạy ở chế độ dev (`React.StrictMode`), React mount/unmount component 2 lần. Lệnh `pixiApp.destroy(true)` bị gọi trong khi listener resize của Pixi chưa gán xong gây ra unhandled exception `TypeError: this._cancelResize is not a function`, làm component `<WeatherShowcaseScene>` bị unmount/crash.
3. **PowerShell Pipeline Encoding (UTF-16 LE):**
   - Lệnh PowerShell `git diff > patch` tự động encode output thành UTF-16 LE with BOM, khiến tiện ích `git apply` tiêu chuẩn không thể parse nhị phân trực tiếp.

---

## 2. Corrective Actions Taken (Các Biện Pháp Đã Khắc Phục)

1. **Khởi động Vite trên Port Riêng Biệt với `--strictPort`:**
   - Đã khởi động Vite trực tiếp từ thư mục `the-vivarium-web` của worktree trên port **`22020`**:
     ```bash
     npx vite --port 22020 --strictPort
     ```
   - Xác nhận URL thực tế hoạt động 100%: `http://localhost:22020/?mode=weather`.
2. **Sửa Lỗi Lifecycle PixiJS v8 trong `WeatherShowcaseScene.tsx`:**
   - Chuyển `useEffect` sang pattern an toàn (`isMounted` flag + isolated ref cho `timeSpeed`), bọc `pixiApp.destroy()` trong khối `try/catch` chống lỗi resize handler.
   - Component hiện render ổn định, 0 lỗi JavaScript trong console.
3. **Thêm Thuộc Tính Kiểm Thử `data-testid` Chặt Chẽ:**
   - Gán `data-testid="header-title"` cho tiêu đề `THE VIVARIUM — WEATHER SUITE (PACK-005)`.
   - Gán `data-testid="weather-control-panel"` cho bảng điều khiển.
   - Gán `data-testid="btn-weather-${type}"` cho 7 nút bấm thời tiết.
   - Gán `data-testid="telemetry-temperature"`, `data-testid="telemetry-humidity"`, `data-testid="telemetry-wind"`, `data-testid="telemetry-soil"`, `data-testid="telemetry-fps"`.
4. **Viết Lại Script Puppeteer Kiểm Định Nghiêm Ngặt (`capture_task020_v2.mjs`):**
   - Kiểm tra bắt buộc: Header phải tồn tại, Weather Control Panel phải hiển thị, bắt toàn bộ `pageerror` (FAIL ngay nếu có bất kỳ lỗi JS nào).
   - Đợi 4.2 giây sau mỗi lần click để transition 3.0s hoàn tất và các giá trị telemetry ổn định trước khi chụp screenshot và trích xuất dữ liệu.
5. **Tạo Patch Chuẩn UTF-8/LF Nhị Phân:**
   - Xuất bằng lệnh Git nội tại: `git diff --binary 6c28a32 HEAD --output=TASK-020_SOURCE_PATCH_UTF8.patch`.
   - Đã kiểm tra nghiệm thu độc lập bằng cả `git apply --stat` và `git apply --check` trên bản sao sạch tại commit gốc `6c28a32` (kết quả 0 lỗi, 20 files changed, 1558 insertions).

---

## 3. Real In-Engine Telemetry Data (Dữ Liệu Đo Đạc Thời Gian Thực)

Trích xuất trực tiếp từ DOM in-engine tại `http://localhost:22020/?mode=weather`:

| Trạng Thái Thời Tiết | Trạng Thái Hiển Thị | Nhiệt Độ | Độ Ẩm | Sức Gió | Ẩm Đất Ngầm | Tốc Độ Khung Hình |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **CLEAR_SUNNY** | Ổn định (`CLEAR_SUNNY`) | **32.3°C** | **36%** | **1.5 m/s** | **44%** | **60 FPS** |
| **GENTLE_RAIN** | Ổn định (`GENTLE_RAIN`) | **25.6°C** | **68%** | **4.5 m/s** | **45%** | **60 FPS** |
| **STORMY_TEMPEST** | Ổn định (`STORMY_TEMPEST`) | **21.3°C** | **83%** | **9.8 m/s** | **47%** | **60 FPS** |
| **HEATWAVE** | Ổn định (`HEATWAVE`) | **37.2°C** | **27%** | **1.0 m/s** | **47%** | **60 FPS** |
| **AUTUMN_BREEZE** | Ổn định (`AUTUMN_BREEZE`) | **27.3°C** | **39%** | **5.5 m/s** | **47%** | **60 FPS** |
| **FOGGY_MIST** | Ổn định (`FOGGY_MIST`) | **21.1°C** | **74%** | **0.8 m/s** | **47%** | **60 FPS** |

*Ghi chú:* Toàn bộ dữ liệu telemetry được lưu thành file `TASK-020_TELEMETRY.json` bên trong gói bằng chứng.

---

## 4. Visual Evidence Verification (6 Screenshot Mới)

6 screenshot thực tế đã chụp lại với camera đồng nhất, hiển thị rõ ràng Weather Suite Header, Weather Control Panel, các hạt mưa xiên góc, tia sét, mây trôi, sương mù và lá rụng:

1. `task020_01_clear_sunny.png` (1.88 MB): Nắng ấm trong lành, bầu trời sáng trong, xa xa là rặng núi mờ sương.
2. `task020_02_gentle_rain.png` (1.89 MB): Mưa rào rải rác, hạt mưa nghiêng theo gió 4.5 m/s, xuất hiện gợn nước splash chạm đất.
3. `task020_03_stormy_tempest.png` (1.92 MB): Bão sấm sét, quầng tối xám xịt phủ kín, tia sét lóe sáng, mưa dày đặc nghiêng mạnh theo gió 9.8 m/s.
4. `task020_04_heatwave.png` (1.87 MB): Quầng nhiệt vàng cam rực rỡ, nhiệt độ đỉnh điểm 37.2°C, độ ẩm rút kiệt còn 27%.
5. `task020_05_autumn_breeze.png` (1.88 MB): Gió mùa thu 5.5 m/s, lá cây sồi đổi sắc xoay đảo và bay lơ lửng quanh tán cổ thụ.
6. `task020_06_foggy_mist.png` (1.88 MB): Sương mù dày đặc, dải ribbon sương là là mặt đất và vòm lá sồi, độ ẩm đạt 74%+.

---

## 5. Artifacts & Deliverables Summary

- **Báo cáo khắc phục QA:** [`TASK-020_QA_CORRECTION_REPORT.md`](file:///C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather/TASK-020_QA_CORRECTION_REPORT.md)
- **Gói Bằng chứng QA V2:** [`TASK-020_WEATHER_EVIDENCE_V2.zip`](file:///C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather/TASK-020_WEATHER_EVIDENCE_V2.zip) (11.3 MB) chứa 6 screenshot mới và `TASK-020_TELEMETRY.json`.
- **File Git Patch Chuẩn UTF-8/LF:** [`TASK-020_SOURCE_PATCH_UTF8.patch`](file:///C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-020-weather/TASK-020_SOURCE_PATCH_UTF8.patch) (Đã test pass 100% với `git apply --check`).
- **Danh sách file commit mới:**
  - `the-vivarium-web/src/weather/WeatherShowcaseScene.tsx`
  - `the-vivarium-web/src/weather/WeatherControlPanel.tsx`
  - `the-vivarium-web/scripts/capture_task020_v2.mjs`
  - `QA/TASK-020/TASK-020_TELEMETRY.json`
  - `QA/TASK-020/*.png` (6 files)
