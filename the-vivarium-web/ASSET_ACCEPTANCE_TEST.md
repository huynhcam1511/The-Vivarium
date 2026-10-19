# THE VIVARIUM — TIÊU CHUẨN KIỂM ĐỊNH ASSET (ASSET ACCEPTANCE TEST)

> **Mục tiêu:** Thiết lập bộ tiêu chí nghiệm thu kỹ thuật khách quan, có thể đo lường và kiểm chứng bằng code/mắt nhìn cho mọi file đồ họa trước khi tích hợp vào gameplay.  
> **Áp dụng:** Scene Kiểm Thử Độc Lập (`http://localhost:2000/?mode=preview`).

---

## 1. BẢNG 6 TIÊU CHÍ KIỂM ĐỊNH BẮT BUỘC (6 ACCEPTANCE CRITERIA)

| Mã Tiêu Chí | Tên Tiêu Chí | Phương Pháp Kiểm Tra | Tiêu Chuẩn ĐẠT (PASS) | Lỗi Bị LOẠI (REJECT) |
| :---: | :--- | :--- | :--- | :--- |
| **AC-01** | **Nền Trong Suốt (Alpha Integrity)** | Soi trên 4 nền tương phản: Caro xám, Đen `#000000`, Trắng `#FFFFFF`, Đất `#25160E`. | Kênh Alpha trong suốt hoàn hảo 100%. Viền đối tượng hòa nhập mượt mà không có viền halo. | Dính viền trắng (White fringe), viền đen lem nhem, hoặc còn sót các mẩu pixel nền chưa tẩy sạch. |
| **AC-02** | **Kích Thước Thật (Canvas & Content)** | Kiểm tra qua metadata hình ảnh và bounding box nội dung thực tế. | Canvas gốc đúng thông số quy định (Kiến thợ: $96\times 96\text{ px}$, Đất: $512\times 512\text{ px}$). Đối tượng vẽ nằm gọn trong vùng an toàn (safe margin), cách mép canvas tối thiểu 2px. | Kích thước canvas sai lệch; nội dung bị vẽ chạm mép hoặc tràn ra ngoài biên canvas. |
| **AC-03** | **Độ Nét Khi Zoom (Resolution at 1x/2x/4x)** | Thử nghiệm trên Scene Preview ở 3 mức: 1.0x (bình thường), 2.0x (cận cảnh), 4.0x (cực cận). | - Ở 1.0x: Silhouette nhận diện tức thì trong 0.2s.<br>- Ở 2.0x: Nét vẽ tay rõ ràng, không mờ mắt.<br>- Ở 4.0x: Giữ nguyên chi tiết cọ digital brushwork, không vỡ hạt pixel hoặc răng cưa thô. | Hình ảnh bị nhòe mờ nội suy bilinear, hoặc vỡ vụn pixel thành các khối vuông to ở 4x. |
| **AC-04** | **Trọng Tâm Pivot (Pivot Accuracy)** | Đặt crosshair đỏ tại tọa độ Pivot quy định (Kiến: `0.5, 0.85`). Cho xoay góc nghiêng $\pm 30^\circ$. | Chân kiến tiếp xúc đúng đường chuẩn mặt đất tại Y = 85%. Khi xoay hướng bám dốc, chân không bị hẫng lơ lửng hay lún sâu vào lòng đất. | Điểm chạm đất bị lệch lên trên hoặc xuống dưới; xoay đối tượng làm lệch tâm nghiêm trọng. |
| **AC-05** | **Độ Chuẩn Bảng Màu (Palette Adherence)** | So sánh màu mẫu pixel chính với Base Palette trong `VISUAL_BIBLE.md`. | Tông màu thân kiến nằm trong dải nâu sô-cô-la `#1F110C` $\rightarrow$ `#4A2818`, highlight râu `#FFA500`. Đất thuộc dải `#25160E` $\rightarrow$ `#1A1009`. | Màu sắc quá rực rỡ phong cách hoạt hình neon, hoặc quá tối đục mất chi tiết. |
| **AC-06** | **Tính Liền Mạch (Seamless Tiling — Cho Terrain)** | Xếp lặp $3 \times 3$ tấm texture đất $512\times 512\text{ px}$ cạnh nhau. | Các đường biên ghép nối biến mất hoàn toàn, tạo thành một bề mặt đất đồng nhất, tự nhiên, không để lại vết sọc hay đốm lặp mắt thường dễ thấy. | Lộ vệt kẻ sọc ngang/dọc tại mép ghép; góc ảnh có bóng đổ làm lộ cấu trúc lưới ô vuông. |

---

## 2. QUY TRÌNH RA QUYẾT ĐỊNH NGHIỆM THU

1. **PASS 6/6 Tiêu Chí:** File được di chuyển từ `public/assets/source/` vào `public/assets/approved/`. Đánh dấu `approved: yes` trong `ASSET_MANIFEST.csv`.
2. **FAIL $\ge 1$ Tiêu Chí:** File được di chuyển vào `public/assets/rejected/`. Tạo bản ghi chú lỗi cụ thể (ví dụ: `FAILED AC-01: White halo around legs`) để Game Director điều chỉnh prompt tạo lại file mới.
