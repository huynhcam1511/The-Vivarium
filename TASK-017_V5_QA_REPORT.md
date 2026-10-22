# BÁO CÁO KIỂM ĐỊNH KỸ THUẬT & MỸ THUẬT (QA REPORT)
# DIRECTOR TASK-017 — UNIFIED OAK V5 FINAL QA
**Chế độ:** QA ONLY — NO PRODUCTION INTEGRATION  
**Tệp đầu vào tiếp nhận:** `THE_VIVARIUM_TASK_017_UNIFIED_OAK_V5_QA_CANDIDATE.zip`  
**Gói bằng chứng xuất xưởng:** `TASK-017_V5_VISUAL_EVIDENCE.zip` ($24.97\text{ MB}$, gồm 12 ảnh screenshot thực tế)

---

## 1. TỔNG QUAN KIỂM ĐỊNH FILE PNG (`env_tree_ancient_unified_v5.png`)

| Chỉ số kỹ thuật | Đo lường thực tế | Quy chuẩn Director | Kết luận |
| :--- | :---: | :---: | :---: |
| **Kích thước Canvas** | $1200 \times 1680\text{ px}$ | $1200 \times 1680\text{ px}$ | **PASS** |
| **Định dạng & Kênh màu** | RGBA (`Format32bppArgb`), 4 channels | RGBA (True Transparency) | **PASS** |
| **Bounding Box ($A > 0$)** | $X:[18, 1188]$ ($W=1171$), $Y:[9, 1679]$ ($H=1671$) | Trong phạm vi canvas | **PASS** |
| **Bounding Box ($A > 10$)** | $X:[20, 1186]$ ($W=1167$), $Y:[11, 1670]$ ($H=1660$) | Khớp $100\%$ với QA_REPORT.json | **PASS** |
| **Tỷ lệ Aspect Ratio** | $0.7008 : 1$ (Thực tế) / $0.7143 : 1$ (Canvas) | Tỷ lệ thẳng đứng tự nhiên | **PASS** |
| **Phần trăm Alpha rỗng** | $37.99\%$ Transparent | Tối ưu diện tích hữu ích | **PASS** |
| **Chạm mép ngoài (Edge Touch)** | Top: $0$, Left: $0$, Right: $0$, Bottom: $13\text{ px}$ ($A=1..3$) | Không cắt cụt thân/rễ chính | **PASS (Minor Note)** |
| **Baked-in Checkerboard** | $1\text{ pixel}$ nghi vấn (ngẫu nhiên) | Không có nền caro bị nướng vào | **PASS** |
| **Viền trắng (Halo) / Viền đen** | $783\text{ px}$ viền sáng nhẹ, $30732\text{ px}$ viền tiếp xúc sẫm màu | Chuyển tiếp tự nhiên với đất ẩm | **PASS** |

> **Ghi chú về Alpha:** Toàn bộ phần lõi của V5 đạt giá trị Alpha $A=250..254$ (không chạm tuyệt đối $255$). Tuy nhiên mức độ này hiển thị hoàn toàn mờ đục ($99.6\%$ opaque) trong bộ dựng PixiJS và không gây bất kỳ hiện tượng bóng ma hay bán trong suốt nào khi đặt trên các nền có độ tương phản cao.

---

## 2. KẾT QUẢ DỰNG V5 TRÊN QA SCENE ĐỘC LẬP (SCALE 0.5)

- **Căn chỉnh đường mặt đất (Groundline Alignment):**
  - Vị trí eo thắt thân nằm tại $Y \approx 700\text{ px}$ ($41.7\%$).
  - Bạnh gốc (root flare) bắt đầu nở rộng từ $Y \approx 800\text{ px}$ ($47.6\%$) và đạt độ rộng cực đại $1146\text{ px}$ tại $Y \approx 1000\text{ px}$.
  - Thiết lập anchor $Y = 0.55$ ($Y = 924\text{ px}$ trên canvas) giúp bạnh gốc nổi tự nhiên ngay trên mặt đất, trong khi toàn bộ chùm rễ cấp 1, rễ cấp 2 và rễ tơ đâm xuyên xuống lòng đất ẩm.
- **Tính liền mạch kết cấu:**
  - Do được dựng từ một silhouette nguyên khối (single monolithic silhouette), **hiện tượng khe hở (gap), đường cắt ngang (seam cut) hoặc lệch tọa độ giữa thân và rễ bị triệt tiêu $100\%$**.
  - Độ cong của thớ vỏ thân chuyển dần thành các gân bạnh gốc và rễ cọc một cách giải phẫu thực vật hoàn hảo.
- **Độ sắc nét khi phóng đại (Zoom 1×, 2×, 4×):**
  - **Zoom 1×:** Cực kỳ ấn tượng, mang lại cảm giác cổ kính, vững chãi và quy mô bề thế của cây đại thụ trung tâm.
  - **Zoom 2×:** Thấy rõ các mảng rêu phong xanh ngọc, nấm ký sinh và lớp vỏ cây xù xì.
  - **Zoom 4×:** Texture vẫn giữ được độ chi tiết hand-painted tốt, có độ mềm nhẹ (softness) do ảnh gốc $1060\times 1484$ upscale lên $1200\times 1680$, nhưng hoàn toàn không xuất hiện vỡ hạt pixelated hay răng cưa thô.

---

## 3. SO SÁNH TRỰC DIỆN BỘ BA: V2 vs V4 vs V5

| Tiêu chí so sánh | V2 Benchmark (Hiện hữu) | V4 Candidate (Đã sửa ghép) | UNIFIED V5 (Ứng viên nguyên khối) | Đánh giá & Nhận định |
| :--- | :---: | :---: | :---: | :--- |
| **1. Độ tự nhiên hình dáng cổ thụ** | Trung bình (thân to nhưng cụt rễ ngầm) | Khá (rễ sâu nhưng thân hơi gượng) | **Xuất sắc** — Dáng cây sừng sững, rễ bạnh vững chãi | **V5 VƯỢT TRỘI** |
| **2. Sự liền mạch thân–rễ** | **FAIL** (Cắt ngang mép, hở khe bạnh) | **CONDITIONAL** (Ghép đè $22\text{ px}$, cần căn thủ công) | **PASS TUYỆT ĐỐI** (Liền khối $100\%$, 0 đường nối) | **V5 VƯỢT TRỘI** |
| **3. Chi tiết vỏ, rêu, nấm, rễ tơ** | Rải rác, sắc độ lệch giữa 2 file | Cải thiện nhưng rễ vẫn hơi thô | Rêu phong phủ đều từ thân đến rễ, nấm bám sinh động | **V5 ĐỒNG NHẤT NHẤT** |
| **4. Độ sắc nét tại Zoom 4×** | Khá sắc | Khá sắc | Mềm nhẹ tự nhiên, không vỡ hạt | Cả 3 đều đạt yêu cầu |
| **5. Hòa hợp môi trường** | Chấp nhận được | Khá | Rất ăn khớp với đất mùn `dark_loam_v2` | **V5 HÀI HÒA NHẤT** |
| **6. Khả năng dùng lâu dài với Dig/Fill** | Cần đồng bộ 2 sprite | Cần đồng bộ 2 sprite | **1 Sprite duy nhất**, quản lý transform cực kỳ tinh giản | **V5 DỄ BẢO TRÌ NHẤT** |
| **7. Nguy cơ che khuất hang/sinh vật** | Không che (vì rễ ngắn) | An toàn (rễ chừa buồng chính $25\text{ px}$) | **Hoàn toàn an toàn** (Rễ ôm sát vách đất, buồng kiến thoáng) | **Cả 3 đều an toàn** |

---

## 4. BẢNG TỔNG HỢP PASS / CONDITIONAL / FAIL TỪNG HẠNG MỤC

| Hạng mục kiểm định | Kết quả | Lý do & Phân tích chi tiết |
| :--- | :---: | :--- |
| **File & Alpha Integrity** | **PASS** | Đúng kích thước $1200\times 1680$, alpha sạch, viền ngoài an toàn, không baked checkerboard. |
| **Cấu trúc hình học & Tỷ lệ** | **PASS** | Aspect ratio $0.70$ cân đối, không kéo giãn dị dạng, bạnh gốc và rễ phân nhánh sinh học. |
| **Độ sắc nét Zoom 1×, 2×, 4×** | **PASS** | Nét vẽ mềm mượt, giữ chi tiết mỹ thuật sinh học khi zoom sâu vào cổ rễ và vỏ cây. |
| **Hiển thị trên 3 môi trường nền** | **PASS** | Đạt độ tương phản tốt trên Nền Trắng, Nền Đất Tối và Mặt cắt Địa tầng lòng hang. |
| **Khớp nối Thân–Rễ** | **PASS** | Giải quyết dứt điểm vấn đề nhức nhối của V2/V4; không còn bất kỳ đường nối hay khe hở nào. |
| **Không che khuất hang kiến & Dig/Fill** | **PASS** | Rễ tỏa sang hai bên sườn, trần buồng trung tâm và đường hầm kiến thợ hoàn toàn thông suốt. |
| **Độ sẵn sàng sản xuất (Production)** | **CONDITIONAL** | Asset mỹ thuật đạt chất lượng xuất sắc, nhưng cần Director phê duyệt phương án thay thế cấu trúc sprite 2 lớp cũ trước khi merge chính thức. |

---

## 5. ĐỀ XUẤT PHIÊN BẢN CHO GAME DIRECTOR

> ### KHUYẾN NGHỊ KỸ THUẬT: **PHÊ DUYỆT UNIFIED OAK V5 (CHỌN V5 THAY THẾ V2/V4)**
> 
> 1. **Lý do lựa chọn V5:**
>    - **Loại bỏ vĩnh viễn rủi ro lệch đường nối:** Phương pháp chia đôi Thân (Z:40) và Rễ (Z:35) của V2/V4 luôn tiềm ẩn nguy cơ xuất hiện khe hở khi camera zoom hoặc khi địa hình rung lắc. V5 giải quyết triệt để vấn đề này ở tầng gốc rễ bằng kiến trúc liền khối (Monolithic Asset).
>    - **Đơn giản hóa mã nguồn:** Khi tích hợp V5, mã nguồn của `EnvironmentPreviewScene` và `WorldRenderer` sẽ giảm bớt việc phải quản lý tọa độ overlap phức tạp (`trunkGroundY - 22`), chỉ cần 1 Sprite duy nhất neo tại bạnh gốc (`anchor.set(0.5, 0.55)`).
> 2. **Kế hoạch tích hợp khi có lệnh:**
>    - Giữ lại V2 và V4 trong thư mục lưu trữ dự phòng (`assets/source/archive/`).
>    - Đưa V5 vào `public/assets/source/env_tree_ancient_unified_v5.png`.
>    - Chuyển cành cây đung đưa (`env_tree_bough_main_moss`) và tán lá (`env_foliage_canopy_clump`) gắn trực tiếp lên điểm chẽ cành của V5 (Z: 45 và Z: 70).

---

### Bằng chứng trực quan đính kèm:
📦 [TASK-017_V5_VISUAL_EVIDENCE.zip](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/TASK-017_V5_VISUAL_EVIDENCE.zip) ($24.97\text{ MB}$, 12 screenshots).  
📄 [TASK-017_V5_ASSET_INSPECTION.json](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/TASK-017_V5_ASSET_INSPECTION.json) (Dữ liệu pixel chuẩn hóa).  
📄 [TASK-017_V5_CHANGED_FILES.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/TASK-017_V5_CHANGED_FILES.md) (Kiểm soát an toàn file thay đổi).

*DỪNG THAO TÁC. Bàn giao toàn bộ kết quả lên Game Director để nghiệm thu.*
