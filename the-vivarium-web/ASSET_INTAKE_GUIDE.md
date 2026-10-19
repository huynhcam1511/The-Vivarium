# THE VIVARIUM — HƯỚNG DẪN TIẾP NHẬN ASSET (ASSET INTAKE GUIDE)

> **Dành cho:** Project Owner (USER) & Game Director (CHATGPT)  
> **Mục tiêu:** Hướng dẫn chính xác vị trí lưu trữ và quy cách file ảnh khi ChatGPT tạo ra để đưa vào hệ thống kiểm thử nghiệm thu kỹ thuật.  
> **Trạng thái:** ACTIVE — SẴN SÀNG TIẾP NHẬN ASSET PACK 001.

---

## 1. CẤU TRÚC THƯ MỤC TIẾP NHẬN ASSET

Toàn bộ asset được quản lý trong thư mục `public/assets/` của dự án Web Game:

```
c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\
├── source/          <-- NƠI ĐẶT ẢNH GỐC TỪ CHATGPT (Chưa xử lý / Chờ kiểm tra)
├── approved/        <-- Chứa các asset ĐÃ QUA KIỂM ĐỊNH & ĐƯỢC CHẤP THUẬN
├── animations/      <-- Chứa chuỗi frame animation và sprite sheet atlas
├── terrain/         <-- Chứa texture địa hình đất, đá, vách hầm hữu cơ
└── rejected/        <-- Chứa các asset KHÔNG ĐẠT (sai tỷ lệ, dính nền, vỡ nét)
```

---

## 2. DANH MỤC FILE YÊU CẦU CHO ASSET PACK 001

Dưới đây là 2 file ảnh mẫu bắt buộc cho đợt kiểm thử đầu tiên (Asset Pack 001). Project Owner hãy tải ảnh do ChatGPT tạo và lưu chính xác vào đường dẫn tương ứng:

### 2.1. Asset 01: Kiến Thợ Mẫu (Worker Ant)
- **Tên file quy chuẩn:** `char_ant_worker_idle.png`
- **Đường dẫn lưu file:**  
  `c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\source\char_ant_worker_idle.png`
- **Yêu cầu kỹ thuật:**
  - Định dạng: `PNG-24 (RGBA)` nền trong suốt 100% (Transparent Alpha).
  - Độ phân giải canvas gốc: Đúng **$96 \times 96\text{ px}$**.
  - Nội dung vẽ: 1 con kiến thợ nhìn góc nhìn ngang (Side-view profile), quay mặt sang phải (East).
  - Silhouette rõ ràng 3 phần: Đầu có kìm và râu gãy khúc, ngực thon, bụng gaster căng bóng có vân đốt hổ phách/nâu đen, 6 chân khớp rõ ràng.
  - Điểm tiếp xúc chân chạm đất nằm ở khoảng 85% chiều cao canvas (`Pivot: 0.5, 0.85`).
  - Nền tuyệt đối trong suốt, không có viền đen/trắng, không chứa text hoặc nhãn UI.

### 2.2. Asset 02: Texture Đất Mùn Liền Mạch (Tileable Loam Soil)
- **Tên file quy chuẩn:** `terrain_soil_dark_loam.png`
- **Đường dẫn lưu file:**  
  `c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\terrain\terrain_soil_dark_loam.png`
- **Yêu cầu kỹ thuật:**
  - Định dạng: `PNG` hoặc `PNG-24`.
  - Độ phân giải canvas gốc: Đúng **$512 \times 512\text{ px}$**.
  - Tính chất: **Seamless Tileable** (Liền mạch 100% ở cả 4 cạnh: trên-dưới, trái-phải).
  - Màu sắc: Tông đất mùn nâu sô-cô-la tơi xốp (`#25160E`), thớ than bùn (`#1A1009`), lẫn các mẩu khoáng và rễ cây li ti.
  - Tuyệt đối không có ô vuông dạng lưới gạch, không có viền bóng đổ 4 góc khiến khi lặp bị lộ vết ghép.

---

## 3. QUY TRÌNH XỬ LÝ KHI FILE ĐƯỢC NẠP VÀO

1. **Bước 1 (Intake):** Owner lưu file ảnh vào thư mục `public/assets/source/` hoặc `public/assets/terrain/`.
2. **Bước 2 (Preview & Inspection):** Mở trình duyệt truy cập vào Scene Kiểm Thử Độc Lập tại:  
   👉 **`http://localhost:2000/?mode=preview`**
3. **Bước 3 (Validation Gate):**
   - Scene sẽ tự động nạp file ảnh thật từ ổ đĩa.
   - Nếu file chưa có, màn hình sẽ hiển thị bảng cảnh báo **`MISSING ASSET: [Tên File]`** (Engine tuyệt đối không tự vẽ giả lập).
   - Kiểm tra chất lượng hiển thị trực tiếp trên 4 nền tương phản (Caro xám, Đen tuyền, Trắng sáng, Đất ngầm) và ở 3 mốc zoom $1.0\times$, $2.0\times$, $4.0\times$.
4. **Bước 4 (Triage):**
   - Nếu ĐẠT: Chuyển file sang `public/assets/approved/` và cập nhật `ASSET_MANIFEST.csv` thành `APPROVED`.
   - Nếu KHÔNG ĐẠT: Chuyển file sang `public/assets/rejected/` kèm báo cáo lỗi chi tiết cho ChatGPT để tạo lại.
