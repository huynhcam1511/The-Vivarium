# THE VIVARIUM V0.1 — HƯỚNG DẪN TRẢI NGHIỆM THỰC TẾ (HUMAN PLAYTEST GUIDE)
**Dành cho:** Project Owner / Người chơi trực tiếp  
**Mục tiêu:** Tự mình trải nghiệm toàn bộ chu trình sinh tồn và kiến thiết tổ kiến trong Ancient Forest trên trình duyệt thực tế.

---

## 1. Cách Mở Game
1. Mở bất kỳ trình duyệt nào (Chrome, Edge, Brave,...).
2. Truy cập vào đường link nội bộ:
   👉 **`http://localhost:3300/?mode=integration`** (hoặc `http://127.0.0.1:3300/?mode=integration`)
3. Màn hình game sẽ mở ra toàn cảnh khu rừng cổ thụ **Ancient Forest**, hồ nước và hệ thống hang tổ ngầm bên dưới.

---

## 2. Thao Tác Điều Khiển Cơ Bản
- **Di chuyển góc nhìn (Pan Camera):** Nhấn giữ chuột trái hoặc chuột giữa và kéo trên màn hình để lia camera.
- **Phóng to / Thu nhỏ (Zoom):** Lăn con lăn chuột (hoặc dùng các nút góc nhìn ở thanh điều khiển phía dưới: *Toàn cảnh*, *Hồ nước*, *Cây cổ thụ*, *Hang tổ*).
- **Xem thông số thời gian thực (Top Header):**
  - **Năng lượng:** Thể lực kiến thợ (tối đa 100).
  - **Bùn Đất Sét:** Lượng bùn đang trữ trong kho ngầm (ban đầu là 16).
  - **Mật Rệp (Food):** Nguồn mật ngọt ngầm nuôi đàn (ban đầu là 30).
  - **FPS / Thời tiết / Độ ẩm:** Đo đạc ổn định 60 FPS.

---

## 3. Vòng Chơi Thử Nghiệm 5 Bước (Core Loop)

### Bước 1: Ra Lệnh Đào Đất (Dig)
- Dưới thanh công cụ phía đáy màn hình, bấm vào nút **⛏️ Chỉ định đào (Dig)**.
- Di chuyển chuột xuống khu vực đất ngầm bên dưới (bạn sẽ thấy khung vuông màu vàng hiển thị trước vị trí ô đất).
- Click chuột trái vào 1 ô đất đặc bất kỳ (gần kho hoặc hang tổ).
- **Hiện tượng quan sát:** 
  - Khung viền đứt đoạn màu vàng xuất hiện đánh dấu ô cần đào.
  - Một chú kiến thợ sẽ tự động bò tới ô đó, thanh tiến trình màu vàng hiện lên đục đất trong đúng **3.5 giây**.
  - Ô đất biến thành khoảng trống (Void).
  - Kiến cắp một viên bùn nâu trên miệng và bò ngược về kho bùn tổ kiến cất trữ.
  - Số lượng **Bùn Đất Sét** trên góc phải tăng từ **16 lên 17**!

### Bước 2: Quan Sát Tiêu Hao Thể Lực & Tự Đi Kiếm Ăn
- Khi kiến đào đất và di chuyển liên tục, chỉ số **Năng lượng** trên màn hình sẽ giảm dần.
- Khi năng lượng kiến xuống thấp ($\le 25$), kiến sẽ kích hoạt phản xạ đói và tự động tìm đường đến **Bồn Mật Rệp Cây Ngầm (Subterranean Honeydew Cache)** (nằm ở phòng sinh hoạt chung bên phải).
- Kiến dừng lại ăn trong 1.5 giây, chỉ số **Mật Rệp** giảm từ $30 \to 29$, và **Năng lượng** của chú kiến lập tức được sạc đầy (+45 năng lượng) để tiếp tục làm việc!

### Bước 3: Ra Lệnh Lấp Đất (Fill / Backfill)
- Bấm vào nút **🧱 Chỉ định lấp (Fill)** trên thanh công cụ.
- Click chuột vào ô trống bạn vừa đào lúc nãy.
- **Hiện tượng quan sát:**
  - Khung viền đứt đoạn màu xanh lá xuất hiện.
  - Kiến thợ bò đến kho lấy 1 viên bùn (kho giảm từ **17 về 16**), mang bùn đến ô trống và tiến hành đắp lại trong **3.5 giây**.
  - Ô đất trở lại trạng thái đất đặc nguyên bản.

### Bước 4: Lưu Game (Save)
- Bấm vào nút **💾 Lưu Game** ở góc phải thanh công cụ.
- Thông báo **"Lưu thành công!"** màu hổ phách sẽ nhấp nháy. Game đã ghi lại trạng thái thế giới vào `localStorage`.

### Bước 5: Tải Game & Tiếp Tục Chơi (Cold Reload & Continue)
- Bấm phím **F5** trên bàn phím (hoặc nút Reload của trình duyệt) để làm mới hoàn toàn trang web.
- Sau khi game tải lại, bấm nút **📂 Tải Game**.
- **Hiện tượng quan sát:** Toàn bộ thế giới được khôi phục nguyên vẹn: ô đất đã đào/lấp, lượng bùn trong kho, lượng mật đã tiêu thụ và vị trí của chú kiến thợ!

---

## 4. Bảng Đánh Giá Playtest
| Tiêu chí | Trải nghiệm thực tế | Kết luận của bạn |
| :--- | :--- | :--- |
| **Giao diện & Điều khiển** | Chuột mượt mà, dễ hiểu, có viền preview trực quan khi chọn ô | [ ] Hài lòng / [ ] Cần chỉnh |
| **Kiến đào & lấp** | Kiến nhận việc thông minh, có thanh tiến độ 3.5s, cắp bùn về kho | [ ] Đạt / [ ] Chưa đạt |
| **Bảo toàn bùn đất** | Đào tăng 1 bùn, lấp tốn 1 bùn, không sinh đất vô tội vạ | [ ] Đạt / [ ] Chưa đạt |
| **Hồi phục năng lượng** | Kiến đói tự tìm mật ăn, thể lực tăng trở lại | [ ] Đạt / [ ] Chưa đạt |
| **Lưu & Tải game** | Tải lại trang web dữ liệu vẫn còn nguyên vẹn | [ ] Đạt / [ ] Chưa đạt |
