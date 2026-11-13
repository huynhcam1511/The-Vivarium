# THE VIVARIUM V0.1 — MA TRẬN SẴN SÀNG PHÁT HÀNH (RELEASE READINESS MATRIX)
**Cột mốc:** Checkpoint D — First Playable V0.1  
**Phạm vi chiến lược:** Vertical Slice First (1 Biome × 1 Species × 1 Complete Loop)  
**Tình trạng Git:** Nhánh `feature/v0.1-worker-ant-mvp` | HEAD Commit: Sẵn sàng commit Gate D  
**Quản trị:** `main` khóa tuyệt đối (Zero Merge, Zero Push).

---

## 1. Phân Loại Mức Độ Sẵn Sàng (Status Matrix)

| Hạng mục hệ thống | Đặc tả kỹ thuật | Kết quả kiểm thử | Kết luận Release | Ghi chú vận hành |
| :--- | :--- | :--- | :--- | :--- |
| **01. Biome Môi Trường** | Ancient Forest (Tán cây sồi 2 tầng, hồ nước & thác nước, tầng đất bùn/sét ngầm) | 175/175 E2E Baseline PASS | **PASS** | Hoàn thiện tích hợp, không có lỗi xé hình hay đứt rễ. |
| **02. Sinh Vật Duy Nhất** | *Formica rufa* (Kiến thợ đơn loài, phân chia vai trò, FSM 10 trạng thái) | 6/6 Worker Test PASS | **PASS** | Tuyệt đối tuân thủ guardrail 1 loài kiến, không phình nội dung. |
| **03. Cơ Chế Đào (Dig)** | Chỉ định qua chuột, tìm đường A*, đào 3.5s/ô, chuyển ô thành VOID | 8/8 Edge Case PASS, E2E Browser PASS | **PASS** | Có thanh tiến trình đục đất thực tế, điều khiển con trỏ thật. |
| **04. Chu Trình Bùn (Hauling)** | Gắp bùn lên miệng (`mudPayload = 1`), mang về kho, kho tăng $16 \to 17$ | Kiểm toán telemetry thời gian thực PASS | **PASS** | Bùn chỉ xuất hiện khi đào tầng CLAY, không sinh đất vô căn cứ. |
| **05. Cơ Chế Lấp (Fill)** | Rút bùn từ kho ($17 \to 16$), mang tới ô trống, đắp 3.5s, phục hồi SOLID | Kiểm toán telemetry thời gian thực PASS | **PASS** | Kho hết bùn sẽ khóa nhận việc, chống lỗi hack tài nguyên. |
| **06. Thể Lực & Kiếm Ăn** | Năng lượng tối đa 100, tiêu hao khi đào/chạy, đói ($\le 25$) tự đi ăn mật rệp, hồi +45 | 7/7 Checkpoint C PASS, 5/5 Checkpoint D PASS | **PASS** | Mật cạn thì ngừng hồi, ngăn chặn vòng lặp năng lượng vô hạn. |
| **07. Lưu & Tải (Save/Load)** | Schema `v0.1.0`, nén RLE địa hình, lưu trạng thái kiến và kho vào `localStorage` | E2E Cold Reload PASS | **PASS** | Tái tạo đường đi sau khi tải, tải lại nhiều lần không sinh trùng bùn. |
| **08. Hiệu Năng Khung Hình** | Đạt chuẩn 60 FPS trên màn hình 1600 × 1000 | Đo đạc telemetry thực tế 60 FPS | **PASS** | Không giật lag hay rò rỉ bộ nhớ. |
| **09. Giao Diện Người Chơi** | Nút bấm Đào/Lấp trực quan, HUD thông số Năng lượng/Bùn/Mật, hướng dẫn nhanh | Trực tiếp chơi trên trình duyệt | **PASS** | Hỗ trợ thao tác chuột hoàn chỉnh cho người chơi thật. |
| **10. Trải Nghiệm Thực Tế (Human Playtest)** | Tài liệu hướng dẫn chơi từng bước cho Project Owner | Sẵn sàng bàn giao | **CONDITIONAL** | Chờ Project Owner tự mình trải nghiệm và phản hồi. |

---

## 2. Các Giới Hạn Đã Biết (Known Issues & Boundary Notes)
1. **Kích thước Bundle JS:** Vite build đưa ra cảnh báo kích thước file chính khoảng 686 KB (vượt khuyến nghị mặc định 500 KB do gộp cả engine PixiJS và đồ họa vào một file). *Khuyến nghị: Tối ưu code-splitting ở Milestone Polish tiếp theo, không ảnh hưởng đến gameplay cục bộ.*
2. **Animation Loài Kiến:** Hiện tại kiến thợ sử dụng hệ thống DEV Procedural Sprite View (dáng đi di chuyển bằng chân và xoay hướng mượt mà) để phục vụ kiểm thử logic cơ chế trước, chưa áp dụng bộ sprite hoạt họa hoàn chỉnh của nghệ sĩ mỹ thuật.
3. **Phạm vi Thức Ăn:** Nguồn mật ngọt `HoneydewSource` là một kho cố định đại diện cho bầy rệp ngầm của V0.1, chưa tích hợp cơ chế chăn nuôi rệp (Aphid Farming) chuyên sâu.

---

## 3. Tổng Kết Đánh Giá
- **Trạng thái Checkpoint D:** **PASS KỸ THUẬT & RUNTIME QA TOÀN DIỆN**.
- **Tính khả thi của V0.1 First Playable:** Đã đạt đầy đủ 10 bước của chu trình chơi khép kín.
