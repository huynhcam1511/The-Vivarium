# THE VIVARIUM — ACTION MASTER REGISTER (V2 BASELINE)
*Tổng cộng: 336 vị trí hành động / trạng thái kỹ thuật (288 Sinh vật + 48 Phản ứng Môi trường)*
*Ngân sách Frame & Animation Method chuẩn hóa*

---

## PHẦN A: 10 VAI TRÒ CHÍNH (192 HÀNH ĐỘNG)

### 1. KIẾN (96 HÀNH ĐỘNG)

#### 01. Kiến chúa (`OBJ-FAU-ANT-001`) — 12 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-ANT-Q-001` | Nghỉ chờ | 6 frames | Loop | Idle trong buồng chúa | 2D Skeletal / Spine |
| `ACT-ANT-Q-002` | Đi | 8 frames | Loop | Di chuyển chậm trong buồng | 2D Skeletal |
| `ACT-ANT-Q-003` | Quay đầu | 4 frames | One-shot | Đổi hướng 180 độ | 2D Skeletal / Flip |
| `ACT-ANT-Q-004` | Dò bằng râu | 6 frames | Loop | Khảo sát bề mặt ổ đẻ | 2D Skeletal |
| `ACT-ANT-Q-005` | Nhận thức ăn mớm | 8 frames | One-shot | Trophallaxis từ kiến thợ | 2D Skeletal |
| `ACT-ANT-Q-006` | Mớm thức ăn | 8 frames | One-shot | Trophallaxis cho ấu trùng | 2D Skeletal |
| `ACT-ANT-Q-007` | Tự vệ sinh | 10 frames | One-shot | Râu và chân trước cọ rửa | 2D Skeletal |
| `ACT-ANT-Q-008` | Kiểm tra trứng | 6 frames | One-shot | Chạm râu vào cụm trứng | 2D Skeletal |
| `ACT-ANT-Q-009` | Chuẩn bị đẻ | 6 frames | One-shot | Bụng co thắt hạ thấp | 2D Skeletal |
| `ACT-ANT-Q-010` | Đẻ trứng | 10 frames | One-shot | Đẩy bọc trứng ra ngoài | 2D Skeletal + Spawn |
| `ACT-ANT-Q-011` | Hồi phục sau đẻ | 8 frames | Loop | Thở dốc, giảm nhịp | 2D Skeletal |
| `ACT-ANT-Q-012` | Phản ứng báo động | 6 frames | Loop | Nâng râu giật mình khi nguy | 2D Skeletal |

#### 02. Kiến lính (`OBJ-FAU-ANT-002`) — 18 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-ANT-SOL-001` | Canh gác | 6 frames | Loop | Đứng gác ngã rẽ/cửa tổ | 2D Skeletal |
| `ACT-ANT-SOL-002` | Đi | 8 frames | Loop | Tuần tra bình thường | 2D Skeletal |
| `ACT-ANT-SOL-003` | Chạy | 6 frames | Loop | Chạy nhanh khi có báo động | 2D Skeletal |
| `ACT-ANT-SOL-004` | Quay đầu | 4 frames | One-shot | Xoay người đổi hướng | 2D Skeletal / Flip |
| `ACT-ANT-SOL-005` | Leo vách | 8 frames | Loop | Đi trên vách đất thẳng đứng | 2D Skeletal + Angle |
| `ACT-ANT-SOL-006` | Bò trần hang | 8 frames | Loop | Treo ngược trần hốc đất | 2D Skeletal + Angle |
| `ACT-ANT-SOL-007` | Đi xuống | 8 frames | Loop | Đi dốc nghiêng âm | 2D Skeletal + Angle |
| `ACT-ANT-SOL-008` | Tuần tra | 10 frames | Loop | Đi chậm kết hợp quét râu | 2D Skeletal |
| `ACT-ANT-SOL-009` | Dò bằng râu | 6 frames | Loop | Phát hiện pheromone lạ | 2D Skeletal |
| `ACT-ANT-SOL-010` | Phát hiện địch | 4 frames | One-shot | Dựng người ngẩng đầu | 2D Skeletal |
| `ACT-ANT-SOL-011` | Giương tư thế đe dọa | 8 frames | Loop | Mở toang hàm kẹp bạnh | 2D Skeletal |
| `ACT-ANT-SOL-012` | Chặn lối | 6 frames | Loop | Dùng đầu chèn kín hốc hang | 2D Skeletal |
| `ACT-ANT-SOL-013` | Cắn | 6 frames | One-shot | Đóng sập hàm kẹp (kẹp đứt)| 2D Skeletal + Contact |
| `ACT-ANT-SOL-014` | Vật lộn | 10 frames | Loop | Quặp chặt kẻ thù kéo giật | 2D Skeletal |
| `ACT-ANT-SOL-015` | Bảo vệ ấu trùng | 8 frames | Loop | Đứng che chắn trên bọc trứng | 2D Skeletal |
| `ACT-ANT-SOL-016` | Hộ tống kiến thợ | 8 frames | Loop | Đi song hành sau kiến tha tải| 2D Skeletal |
| `ACT-ANT-SOL-017` | Rút lui | 6 frames | Loop | Đi giật lùi giữ hướng nhìn | 2D Skeletal |
| `ACT-ANT-SOL-018` | Vệ sinh | 8 frames | One-shot | Vuốt hàm kẹp và chân | 2D Skeletal |

#### 03. Kiến thợ đào (`OBJ-FAU-ANT-003`) — 24 Hành động (Ưu tiên MVP Dig/Fill)
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-ANT-DIG-001` | Nghỉ | 6 frames | Loop | Chờ nhận Job đào trong queue | 2D Skeletal |
| `ACT-ANT-DIG-002` | Đi | 8 frames | Loop | Di chuyển không tải | 2D Skeletal |
| `ACT-ANT-DIG-003` | Chạy | 6 frames | Loop | Di chuyển nhanh đến ô đào | 2D Skeletal |
| `ACT-ANT-DIG-004` | Quay đầu | 4 frames | One-shot | Đổi hướng di chuyển | 2D Skeletal / Flip |
| `ACT-ANT-DIG-005` | Leo vách | 8 frames | Loop | Leo vách đất hẹp | 2D Skeletal + Angle |
| `ACT-ANT-DIG-006` | Bò trần hang | 8 frames | Loop | Bò ngược trên nóc hang | 2D Skeletal + Angle |
| `ACT-ANT-DIG-007` | Đi xuống | 8 frames | Loop | Xuống dốc hầm dốc | 2D Skeletal + Angle |
| `ACT-ANT-DIG-008` | Kiểm tra ô được chỉ định | 6 frames | One-shot | Đo độ cứng bề mặt ô đất | 2D Skeletal |
| `ACT-ANT-DIG-009` | Tiếp cận vị trí | 6 frames | One-shot | Vào tư thế chuẩn bị bới đất | 2D Skeletal |
| `ACT-ANT-DIG-010` | Bắt đầu đào | 6 frames | One-shot | Hàm cắm vào bề mặt địa hình | 2D Skeletal |
| `ACT-ANT-DIG-011` | Đào liên tục | 10 frames | Loop | Cào bới liên tục + phát hạt bụi| 2D Skeletal + VFX |
| `ACT-ANT-DIG-012` | Kết thúc đào | 6 frames | One-shot | Nhả khối đất khỏi vách hang | 2D Skeletal |
| `ACT-ANT-DIG-013` | Phá đất cứng | 10 frames | Loop | Gõ mài hàm vào đất sét/đá | 2D Skeletal |
| `ACT-ANT-DIG-014` | Gom đất vụn | 8 frames | Loop | Hai chân trước cào gom đất | 2D Skeletal |
| `ACT-ANT-DIG-015` | Nhấc đất | 6 frames | One-shot | Kẹp viên đất đưa lên miệng | 2D Skeletal + Bone Attach |
| `ACT-ANT-DIG-016` | Tha đất | 8 frames | Loop | Đi khi ngậm viên bùn đất sét | 2D Skeletal + Attach |
| `ACT-ANT-DIG-017` | Leo khi mang đất | 8 frames | Loop | Leo dốc thẳng đứng có tải | 2D Skeletal + Attach |
| `ACT-ANT-DIG-018` | Đổ đất tại bãi | 6 frames | One-shot | Mở hàm nhả đất xuống kho | 2D Skeletal + Detach |
| `ACT-ANT-DIG-019` | Nhận bùn sét | 6 frames | One-shot | Lấy đất sét từ trạm trộn | 2D Skeletal |
| `ACT-ANT-DIG-020` | Lấy bùn sét | 8 frames | One-shot | Bứt một mẩu đất đắp | 2D Skeletal |
| `ACT-ANT-DIG-021` | Tha bùn sét | 8 frames | Loop | Vận chuyển bùn trám vách | 2D Skeletal + Attach |
| `ACT-ANT-DIG-022` | Đắp đất | 10 frames | One-shot | Trát bùn vào ô trống chỉ định | 2D Skeletal |
| `ACT-ANT-DIG-023` | Nén chặt đất | 8 frames | Loop | Dùng trán ép phẳng mặt đất | 2D Skeletal |
| `ACT-ANT-DIG-024` | Nghỉ phục hồi | 6 frames | Loop | Khôi phục thể lực sau đào | 2D Skeletal |

#### 04. Kiến y tá (`OBJ-FAU-ANT-004`) — 21 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-ANT-NUR-001` | Nghỉ | 6 frames | Loop | Đứng trông phòng ươm | 2D Skeletal |
| `ACT-ANT-NUR-002` | Đi | 8 frames | Loop | Di chuyển trong nhà trẻ | 2D Skeletal |
| `ACT-ANT-NUR-003` | Quay đầu | 4 frames | One-shot | Xoay thân | 2D Skeletal / Flip |
| `ACT-ANT-NUR-004` | Kiểm tra bằng râu | 6 frames | Loop | Thăm khám sức khỏe ấu trùng | 2D Skeletal |
| `ACT-ANT-NUR-005` | Tự vệ sinh | 8 frames | One-shot | Liếm chân sạch sẽ vô trùng | 2D Skeletal |
| `ACT-ANT-NUR-006` | Kiểm tra trứng | 6 frames | One-shot | Quét râu quanh khối trứng | 2D Skeletal |
| `ACT-ANT-NUR-007` | Nhặt trứng | 6 frames | One-shot | Nhẹ nhàng ngậm bọc trứng | 2D Skeletal + Attach |
| `ACT-ANT-NUR-008` | Mang trứng | 8 frames | Loop | Di chuyển khi ngậm trứng | 2D Skeletal + Attach |
| `ACT-ANT-NUR-009` | Đặt trứng | 6 frames | One-shot | Đặt trứng vào ổ khô ráo | 2D Skeletal + Detach |
| `ACT-ANT-NUR-010` | Gom trứng thành cụm | 8 frames | Loop | Sắp xếp trứng dính kết | 2D Skeletal |
| `ACT-ANT-NUR-011` | Kiểm tra ấu trùng | 6 frames | One-shot | Đánh giá độ đói của ấu trùng | 2D Skeletal |
| `ACT-ANT-NUR-012` | Cho ấu trùng ăn | 10 frames | Loop | Nhả dịch dinh dưỡng vào miệng| 2D Skeletal |
| `ACT-ANT-NUR-013` | Vệ sinh ấu trùng | 10 frames | Loop | Liếm sạch nấm mốc trên thân | 2D Skeletal |
| `ACT-ANT-NUR-014` | Nhấc ấu trùng | 6 frames | One-shot | Kẹp ấu trùng béo múp | 2D Skeletal + Attach |
| `ACT-ANT-NUR-015` | Mang ấu trùng | 8 frames | Loop | Chuyển buồng ấm hơn | 2D Skeletal + Attach |
| `ACT-ANT-NUR-016` | Đặt ấu trùng | 6 frames | One-shot | Thả ấu trùng êm ái | 2D Skeletal + Detach |
| `ACT-ANT-NUR-017` | Kiểm tra nhộng | 6 frames | One-shot | Lăn kiểm tra kén tơ | 2D Skeletal |
| `ACT-ANT-NUR-018` | Di chuyển nhộng | 8 frames | Loop | Tha kén tơ sang buồng nở | 2D Skeletal + Attach |
| `ACT-ANT-NUR-019` | Dọn buồng nuôi | 8 frames | Loop | Thu gom vỏ trứng vụn | 2D Skeletal |
| `ACT-ANT-NUR-020` | Sơ tán con non | 8 frames | Loop | Chạy gấp khi hang bị ngập | 2D Skeletal + Attach |
| `ACT-ANT-NUR-021` | Phản ứng báo động | 6 frames | Loop | Hoảng hốt che chắn ổ trứng | 2D Skeletal |

#### 05. Kiến trinh sát (`OBJ-FAU-ANT-005`) — 21 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-ANT-SCT-001` | Nghỉ | 6 frames | Loop | Dừng chân nghe ngóng | 2D Skeletal |
| `ACT-ANT-SCT-002` | Đi | 8 frames | Loop | Thăm dò nhịp chậm | 2D Skeletal |
| `ACT-ANT-SCT-003` | Chạy | 6 frames | Loop | Chạy tốc độ cao trên mặt đất | 2D Skeletal |
| `ACT-ANT-SCT-004` | Quay đầu | 4 frames | One-shot | Đổi góc linh hoạt | 2D Skeletal / Flip |
| `ACT-ANT-SCT-005` | Leo vách | 8 frames | Loop | Leo vách đá/thân cây sồi | 2D Skeletal + Angle |
| `ACT-ANT-SCT-006` | Bò trần hang | 8 frames | Loop | Leo dốc trần hang | 2D Skeletal + Angle |
| `ACT-ANT-SCT-007` | Đi xuống | 8 frames | Loop | Lao dốc thẳng đứng | 2D Skeletal + Angle |
| `ACT-ANT-SCT-008` | Quét râu | 8 frames | Loop | Quay râu vòng tròn bắt mùi | 2D Skeletal |
| `ACT-ANT-SCT-009` | Thăm dò cửa hang | 6 frames | One-shot | Thò đầu ra khỏi miệng hang | 2D Skeletal |
| `ACT-ANT-SCT-010` | Khám phá vùng tối | 8 frames | Loop | Mở rộng Fog of War | 2D Skeletal |
| `ACT-ANT-SCT-011` | Phát hiện thức ăn | 6 frames | One-shot | Chồm lên hạt cây/xác sâu | 2D Skeletal |
| `ACT-ANT-SCT-012` | Phát hiện nguồn nước| 6 frames | One-shot | Tiếp cận bờ ẩm ướt | 2D Skeletal |
| `ACT-ANT-SCT-013` | Phát hiện nguy hiểm | 6 frames | One-shot | Bật lùi khi gặp thú săn | 2D Skeletal |
| `ACT-ANT-SCT-014` | Kiểm tra tài nguyên| 8 frames | Loop | Cắn thử kiểm tra độ chín | 2D Skeletal |
| `ACT-ANT-SCT-015` | Lần theo đường mùi | 8 frames | Loop | Bám vết pheromone cũ | 2D Skeletal |
| `ACT-ANT-SCT-016` | Đánh dấu pheromone | 8 frames | Loop | Chấm đuôi bụng tiết vệt mùi | 2D Skeletal + VFX |
| `ACT-ANT-SCT-017` | Gọi kiến thợ | 6 frames | One-shot | Gõ đầu vào đất truyền rung | 2D Skeletal |
| `ACT-ANT-SCT-018` | Tránh chướng ngại | 6 frames | One-shot | Né đá cuội / rễ cây | 2D Skeletal |
| `ACT-ANT-SCT-019` | Né thú săn mồi | 6 frames | Loop | Luồn lách chạy trốn bọ cánh | 2D Skeletal |
| `ACT-ANT-SCT-020` | Trở về tổ | 8 frames | Loop | Tốc biến quay lại lối cũ | 2D Skeletal |
| `ACT-ANT-SCT-021` | Vệ sinh | 8 frames | One-shot | Chải lông và râu | 2D Skeletal |

---

### 2. ĐÀN ONG (96 HÀNH ĐỘNG)

#### 06. Ong chúa (`OBJ-FAU-BEE-001`) — 12 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-BEE-Q-001` | Nghỉ | 6 frames | Loop | Nằm tĩnh trên bánh tổ | 2D Skeletal |
| `ACT-BEE-Q-002` | Đi trên bánh tổ | 8 frames | Loop | Bò uy nghi qua các lỗ sáp | 2D Skeletal |
| `ACT-BEE-Q-003` | Quay đầu | 4 frames | One-shot | Xoay thân dài | 2D Skeletal / Flip |
| `ACT-BEE-Q-004` | Kiểm tra ô tổ | 6 frames | One-shot | Chui đầu vào lỗ sáp kiểm tra | 2D Skeletal |
| `ACT-BEE-Q-005` | Chuẩn bị đẻ | 6 frames | One-shot | Thọc sâu đuôi bụng vào ô | 2D Skeletal |
| `ACT-BEE-Q-006` | Đẻ trứng | 8 frames | One-shot | Đặt một quả trứng vào đáy ô | 2D Skeletal + Spawn |
| `ACT-BEE-Q-007` | Chuyển ô tiếp theo | 6 frames | One-shot | Rút bụng bước sang ô bên | 2D Skeletal |
| `ACT-BEE-Q-008` | Nhận thức ăn | 8 frames | One-shot | Hút sữa ong chúa từ thợ | 2D Skeletal |
| `ACT-BEE-Q-009` | Vệ sinh | 8 frames | One-shot | Vuốt cánh và râu | 2D Skeletal |
| `ACT-BEE-Q-010` | Phản ứng hộ vệ | 6 frames | Loop | Tỏa pheromone chúa giữ trật tự| 2D Skeletal + VFX |
| `ACT-BEE-Q-011` | Nghỉ phục hồi | 8 frames | Loop | Dừng chân lấy sức | 2D Skeletal |
| `ACT-BEE-Q-012` | Phản ứng báo động | 6 frames | Loop | Đập cánh rung chuông báo động | 2D Skeletal |

#### 07. Ong y tá (`OBJ-FAU-BEE-002`) — 21 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-BEE-NUR-001` | Nghỉ | 6 frames | Loop | Đậu giữ nhiệt trên bánh sáp | 2D Skeletal |
| `ACT-BEE-NUR-002` | Đi trên bánh tổ | 8 frames | Loop | Bò kiểm tra hàng loạt ô | 2D Skeletal |
| `ACT-BEE-NUR-003` | Quay đầu | 4 frames | One-shot | Đổi hướng | 2D Skeletal / Flip |
| `ACT-BEE-NUR-004` | Kiểm tra bằng râu | 6 frames | Loop | Đánh hơi vi khuẩn/nấm | 2D Skeletal |
| `ACT-BEE-NUR-005` | Kiểm tra ô trống | 6 frames | One-shot | Tìm ô sẵn sàng đẻ | 2D Skeletal |
| `ACT-BEE-NUR-006` | Làm sạch ô | 8 frames | Loop | Đánh bóng đáy ô sạch bong | 2D Skeletal |
| `ACT-BEE-NUR-007` | Kiểm tra trứng | 6 frames | One-shot | Xem độ thẳng của trứng sáp | 2D Skeletal |
| `ACT-BEE-NUR-008` | Kiểm tra ấu trùng | 6 frames | One-shot | Nhìn ấu trùng cuộn tròn | 2D Skeletal |
| `ACT-BEE-NUR-009` | Cho ấu trùng nhỏ ăn| 8 frames | Loop | Nhả sữa ong chúa tinh khiết | 2D Skeletal |
| `ACT-BEE-NUR-010` | Cho ấu trùng lớn ăn| 8 frames | Loop | Nhả mật trộn phấn hoa | 2D Skeletal |
| `ACT-BEE-NUR-011` | Kiểm tra ô nhộng | 6 frames | One-shot | Đo độ căng của nắp sáp | 2D Skeletal |
| `ACT-BEE-NUR-012` | Đậy nắp ô | 10 frames | One-shot | Trát lớp sáp mỏng niêm phong | 2D Skeletal |
| `ACT-BEE-NUR-013` | Mở nắp ô | 8 frames | One-shot | Cắn nắp giúp ong non chui ra | 2D Skeletal |
| `ACT-BEE-NUR-014` | Trao đổi thức ăn | 8 frames | Loop | Trophallaxis với ong kiếm ăn | 2D Skeletal |
| `ACT-BEE-NUR-015` | Chăm sóc ong chúa | 8 frames | Loop | Vuốt ve, liếm thân ong chúa | 2D Skeletal |
| `ACT-BEE-NUR-016` | Quạt cánh điều hòa | 10 frames | Loop | Quạt cánh làm mát hạ nhiệt tổ | 2D Skeletal + Blur |
| `ACT-BEE-NUR-017` | Dọn rác | 8 frames | One-shot | Kẹp mảnh vụn mang ra ngoài | 2D Skeletal + Attach |
| `ACT-BEE-NUR-018` | Vệ sinh | 8 frames | One-shot | Cọ mắt và râu | 2D Skeletal |
| `ACT-BEE-NUR-019` | Nghỉ | 6 frames | Loop | Ngủ ngắn tĩnh lặng | 2D Skeletal |
| `ACT-BEE-NUR-020` | Phản ứng báo động | 6 frames | Loop | Sẵn sàng bảo vệ đàn con | 2D Skeletal |
| `ACT-BEE-NUR-021` | Sang vùng an toàn | 8 frames | Loop | Rút về lõi sâu của tổ | 2D Skeletal |

#### 08. Ong thợ xây (`OBJ-FAU-BEE-003`) — 21 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-BEE-BLD-001` | Nghỉ | 6 frames | Loop | Tĩnh dưỡng tạo sáp | 2D Skeletal |
| `ACT-BEE-BLD-002` | Đi | 8 frames | Loop | Đi tìm điểm vỡ nứt | 2D Skeletal |
| `ACT-BEE-BLD-003` | Quay đầu | 4 frames | One-shot | Đổi hướng | 2D Skeletal / Flip |
| `ACT-BEE-BLD-004` | Leo bánh tổ | 8 frames | Loop | Trèo bám mép bánh tổ dốc | 2D Skeletal + Angle |
| `ACT-BEE-BLD-005` | Kiểm tra vị trí xây| 6 frames | One-shot | Đo kích thước chuẩn lục giác | 2D Skeletal |
| `ACT-BEE-BLD-006` | Đến vị trí | 6 frames | One-shot | Neo chân bám chắc | 2D Skeletal |
| `ACT-BEE-BLD-007` | Tiết vảy sáp | 8 frames | One-shot | Bụng bài tiết vảy sáp trắng | 2D Skeletal |
| `ACT-BEE-BLD-008` | Lấy vảy sáp | 6 frames | One-shot | Chân sau gạt sáp lên miệng | 2D Skeletal |
| `ACT-BEE-BLD-009` | Nhào sáp | 10 frames | Loop | Dùng hàm nhai sáp với nước bọt| 2D Skeletal |
| `ACT-BEE-BLD-010` | Chuyển sáp | 6 frames | One-shot | Nhả cục sáp dẻo ra mép ô | 2D Skeletal |
| `ACT-BEE-BLD-011` | Đặt sáp | 8 frames | One-shot | Trát sáp vào thành vách | 2D Skeletal |
| `ACT-BEE-BLD-012` | Tạo vách ô | 10 frames | Loop | Kéo dài vách ngăn mỏng | 2D Skeletal |
| `ACT-BEE-BLD-013` | Tạo miệng lục giác | 10 frames | Loop | Uốn vành góc 120 độ hoàn hảo | 2D Skeletal |
| `ACT-BEE-BLD-014` | Căn góc ô | 6 frames | One-shot | Dùng râu đo độ dày vách sáp | 2D Skeletal |
| `ACT-BEE-BLD-015` | Làm mịn bề mặt | 8 frames | Loop | Miết hàm cho mặt sáp bóng loáng| 2D Skeletal |
| `ACT-BEE-BLD-016` | Sửa vết nứt | 8 frames | One-shot | Trám keo ong vào khe hở | 2D Skeletal |
| `ACT-BEE-BLD-017` | Gia cố điểm nối | 10 frames | Loop | Đắp dày chân bám vào gỗ sồi | 2D Skeletal |
| `ACT-BEE-BLD-018` | Kiểm tra hoàn thiện| 6 frames | One-shot | Kiểm tra cấu trúc chịu lực | 2D Skeletal |
| `ACT-BEE-BLD-019` | Quạt cánh | 8 frames | Loop | Hong khô sáp mới trát | 2D Skeletal + Blur |
| `ACT-BEE-BLD-020` | Vệ sinh | 8 frames | One-shot | Gỡ vụn sáp bám râu | 2D Skeletal |
| `ACT-BEE-BLD-021` | Phản ứng báo động | 6 frames | Loop | Dừng thi công chuẩn bị phòng thủ| 2D Skeletal |

#### 09. Ong kiếm ăn (`OBJ-FAU-BEE-004`) — 24 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-BEE-FRG-001` | Nghỉ | 6 frames | Loop | Chờ xuất phát | 2D Skeletal |
| `ACT-BEE-FRG-002` | Đi | 8 frames | Loop | Đi bộ trên cành/lá | 2D Skeletal |
| `ACT-BEE-FRG-003` | Cất cánh | 6 frames | One-shot | Nhún chân bung cánh bay | 2D Skeletal + Blur |
| `ACT-BEE-FRG-004` | Bay tại chỗ (Hover) | 8 frames | Loop | Đứng yên giữa không trung | 2D Skeletal + Wing Loop |
| `ACT-BEE-FRG-005` | Bay thẳng | 8 frames | Loop | Bay hành trình tốc độ cao | 2D Skeletal + Wing Loop |
| `ACT-BEE-FRG-006` | Nghiêng chuyển hướng | 6 frames | Loop | Lượn cánh bẻ góc cua | 2D Skeletal + Angle |
| `ACT-BEE-FRG-007` | Đáp lên hoa | 6 frames | One-shot | Hãm phanh đáp cánh hoa | 2D Skeletal |
| `ACT-BEE-FRG-008` | Thăm dò hoa | 6 frames | Loop | Chui vào đài hoa tìm mật | 2D Skeletal |
| `ACT-BEE-FRG-009` | Hút mật | 10 frames | Loop | Thò vòi hút mật vào diều | 2D Skeletal |
| `ACT-BEE-FRG-010` | Thu phấn | 10 frames | Loop | Lăn mình trên nhị hoa | 2D Skeletal |
| `ACT-BEE-FRG-011` | Gom phấn vào giỏ | 8 frames | Loop | Chân chải phấn vào giỏ chân sau| 2D Skeletal + Attach |
| `ACT-BEE-FRG-012` | Cất cánh mang tải | 8 frames | One-shot | Nặng nhọc bay lên với tải nặng | 2D Skeletal |
| `ACT-BEE-FRG-013` | Bay mang tải | 8 frames | Loop | Bay chậm đầm mình về tổ | 2D Skeletal + Heavy |
| `ACT-BEE-FRG-014` | Đáp xuống nước | 6 frames | One-shot | Đậu mép nước/bèo | 2D Skeletal |
| `ACT-BEE-FRG-015` | Lấy nước | 8 frames | Loop | Hút giọt nước làm mát tổ | 2D Skeletal |
| `ACT-BEE-FRG-016` | Lấy nhựa cây | 10 frames | Loop | Cạo nhựa cây sồi làm keo ong | 2D Skeletal |
| `ACT-BEE-FRG-017` | Tránh chướng ngại | 6 frames | One-shot | Lượn tránh cành cây/mạng nhện | 2D Skeletal |
| `ACT-BEE-FRG-018` | Tránh mưa | 8 frames | Loop | Bay chúi đầu tìm gầm lá trú | 2D Skeletal |
| `ACT-BEE-FRG-019` | Chống gió mạnh | 8 frames | Loop | Liệng cánh nghiêng cản gió | 2D Skeletal |
| `ACT-BEE-FRG-020` | Tìm chỗ trú | 6 frames | One-shot | Ép mình dưới vỏ cây | 2D Skeletal |
| `ACT-BEE-FRG-021` | Bay về tổ | 8 frames | Loop | Định vị góc mặt trời về tổ | 2D Skeletal |
| `ACT-BEE-FRG-022` | Đáp xuống cửa tổ | 6 frames | One-shot | Hạ cánh thềm cửa | 2D Skeletal |
| `ACT-BEE-FRG-023` | Bàn giao tài nguyên| 8 frames | One-shot | Nhả mật/gạt phấn cho ong trong | 2D Skeletal |
| `ACT-BEE-FRG-024` | Múa lắc đuôi (Waggle)| 12 frames | Loop | Múa số 8 chỉ hướng thức ăn | 2D Skeletal |

#### 10. Ong bảo vệ (`OBJ-FAU-BEE-005`) — 18 Hành động
| Action ID | Tên hành động | Ngân sách Frame | Type | Trigger / Logic | Animation Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-BEE-GRD-001` | Đứng gác | 6 frames | Loop | Đứng thẳng canh thềm cửa tổ | 2D Skeletal |
| `ACT-BEE-GRD-002` | Đi | 8 frames | Loop | Đi tuần trước lối vào | 2D Skeletal |
| `ACT-BEE-GRD-003` | Quay đầu | 4 frames | One-shot | Đổi hướng | 2D Skeletal / Flip |
| `ACT-BEE-GRD-004` | Cất cánh | 6 frames | One-shot | Bay vụt lên đón đầu | 2D Skeletal |
| `ACT-BEE-GRD-005` | Tuần tra bay | 8 frames | Loop | Bay lượn vòng trước cửa tổ | 2D Skeletal |
| `ACT-BEE-GRD-006` | Hạ cánh | 6 frames | One-shot | Đáp xuống chặn đường | 2D Skeletal |
| `ACT-BEE-GRD-007` | Kiểm tra ong trở về| 6 frames | One-shot | Chạm râu nhận diện đồng đội | 2D Skeletal |
| `ACT-BEE-GRD-008` | Nhận diện bằng râu | 6 frames | Loop | Ngửi pheromone tổ | 2D Skeletal |
| `ACT-BEE-GRD-009` | Kiểm tra cửa tổ | 8 frames | Loop | Bò quanh mép cửa kiểm tra | 2D Skeletal |
| `ACT-BEE-GRD-010` | Tư thế cảnh giác | 6 frames | Loop | Ngẩng cao đầu, giương cánh | 2D Skeletal |
| `ACT-BEE-GRD-011` | Vo ve cảnh báo | 8 frames | Loop | Đập cánh tần số cao dọa nạt | 2D Skeletal + Blur |
| `ACT-BEE-GRD-012` | Chặn kẻ xâm nhập | 6 frames | Loop | Đem thân húc cản đường | 2D Skeletal |
| `ACT-BEE-GRD-013` | Đẩy kẻ xâm nhập | 8 frames | One-shot | Dùng đầu và chân xô đuổi | 2D Skeletal |
| `ACT-BEE-GRD-014` | Vật lộn | 10 frames | Loop | Ôm chặt kẻ thù giữa không | 2D Skeletal |
| `ACT-BEE-GRD-015` | Đốt (Sting) | 6 frames | One-shot | Cắm ngòi nọc chí mạng | 2D Skeletal + Suicide |
| `ACT-BEE-GRD-016` | Truy đuổi | 8 frames | Loop | Bay rượt đuổi kẻ thù bỏ chạy | 2D Skeletal |
| `ACT-BEE-GRD-017` | Rút lui | 6 frames | Loop | Bay lùi về vị trí thủ | 2D Skeletal |
| `ACT-BEE-GRD-018` | Phát tín hiệu báo động| 8 frames | Loop | Tiết pheromone Isoamyl acetate | 2D Skeletal + VFX |

---

## PHẦN B: 12 NHÓM SINH VẬT PHỤ TRỢ (96 HÀNH ĐỘNG)

Mỗi loài được chuẩn hóa đúng 8 hành động sinh thái nền tảng:

| Sinh vật / Mã loài | 8 Hành động chuẩn (Mỗi action 4 - 8 frames) | Animation Method |
| :--- | :--- | :--- |
| **01. Kiến đối thủ** (`OBJ-AUX-001`) | 1. Tuần tra · 2. Kiếm ăn · 3. Dò mùi · 4. Phát hiện địch · 5. Đe dọa · 6. Tấn công cắn · 7. Rút lui · 8. Tha thức ăn | 2D Skeletal |
| **02. Mối** (`OBJ-AUX-002`) | 1. Nghỉ · 2. Đi · 3. Gặm gỗ · 4. Tha sợi gỗ · 5. Đào đường hầm mùn · 6. Trao thức ăn · 7. Chạy trốn ánh sáng · 8. Chết khô | 2D Skeletal |
| **03. Giun đất** (`OBJ-AUX-003`) | 1. Co người · 2. Duỗi người · 3. Bò nhúc nhích · 4. Đào xuyên đất · 5. Ăn mùn hữu cơ · 6. Đổi hướng uốn mình · 7. Tránh khô · 8. Trồi mặt đất | Vertex Mesh Deform |
| **04. Bọ đuôi bật** (`OBJ-AUX-004`) | 1. Nghỉ · 2. Bò nhanh · 3. Bật nhảy lò xo cực đại · 4. Ăn nấm mốc · 5. Vệ sinh chân · 6. Né nguy hiểm · 7. Tụ đàn · 8. Tản ra | Spritesheet Flipbook |
| **05. Bọ cánh cứng** (`OBJ-AUX-005`) | 1. Nghỉ · 2. Đi nặng nhọc · 3. Chạy rượt · 4. Quay đầu · 5. Rình săn mồi · 6. Kẹp hàm xé mồi · 7. Ẩn nấp dưới vỏ cây · 8. Tháo chạy | 2D Skeletal |
| **06. Bọ rùa** (`OBJ-AUX-006`) | 1. Nghỉ · 2. Đi trên gân lá · 3. Bò ngược vách lá · 4. Mở cánh cứng elytron · 5. Cất cánh · 6. Bay lượn · 7. Hạ cánh xếp cánh · 8. Gặm rệp cây | 2D Skeletal + Flipbook |
| **07. Sâu bướm** (`OBJ-AUX-007`) | 1. Nghỉ · 2. Bò lượn sóng · 3. Leo cành lá sồi · 4. Gặm rìa lá · 5. Giật mình đổi hướng · 6. Cuộn tròn ẩn nấp · 7. Lột xác · 8. Nhả tơ treo kén | Mesh Deform + Bone |
| **08. Bướm** (`OBJ-AUX-008`) | 1. Đậu cánh khép · 2. Đập cánh khoe sắc · 3. Bung cánh cất cánh · 4. Bay dập dờn · 5. Hạ cánh êm · 6. Thò vòi hút mật · 7. Trú mưa dưới tán · 8. Nghỉ đêm | 2D Skeletal (Wing Flip) |
| **09. Nhện** (`OBJ-AUX-009`) | 1. Nghỉ giữa mạng · 2. Bò trên dây tơ · 3. Leo vách đất · 4. Kéo sợi tơ mới · 5. Rình mồi bất động · 6. Cảm nhận rung động tơ · 7. Phóng tới vồ mồi · 8. Quấn tơ bọc kín | 2D Skeletal (8 chân) |
| **10. Ốc sên** (`OBJ-AUX-010`) | 1. Nghỉ trong vỏ · 2. Thò râu và đầu · 3. Trườn bò nhầy · 4. Quay đầu uốn thân · 5. Dùng lưỡi nhám nạo lá · 6. Co rụt khẩn cấp vào vỏ · 7. Tiết nhớt ẩm · 8. Tránh khô cằn | Morph / Bone Deform |
| **11. Cá hồ** (`OBJ-AUX-011`) | 1. Đứng nước quạt vây · 2. Bơi thong dong · 3. Uốn mình đổi hướng · 4. Lao nhanh đớp mồi · 5. Rỉa rêu đáy hồ · 6. Nổi ngớp bóng khí · 7. Né bóng chim săn mồi · 8. Trú hốc đá | Spine 2D Fish IK |
| **12. Ếch** (`OBJ-AUX-012`) | 1. Ngồi nghỉ phập phồng cằm · 2. Thở đều · 3. Nhảy vọt lên bờ · 4. Bơi đạp chân sau · 5. Rình khóa mục tiêu · 6. Phóng lưỡi bắt mồi cực nhanh · 7. Lặn trốn đáy bùn · 8. Kêu ộp ộp | 2D Skeletal + Tongue IK|

---

## PHẦN C: 6 HỆ THỐNG MÔI TRƯỜNG (48 TRẠNG THÁI PHẢN ỨNG)

| Hệ thống / Mã | 8 Trạng thái / Phản ứng sinh thái | Kỹ thuật hiện thực trên Engine |
| :--- | :--- | :--- |
| **01. Cây sồi đại thụ** (`SYS-ENV-OAK`) | 1. Tán trái đung đưa gió · 2. Tán phải đung đưa gió · 3. Lá rung rinh nhẹ · 4. Rụng lá thu lác đác · 5. Vỏ ướt sẫm màu khi mưa · 6. Ánh nắng xuyên kẽ lá (God rays) · 7. Lộ rễ khi đất bị đào · 8. Rễ bị che phủ khi lấp | Vertex Displacement Shader + Dual-pass Mask |
| **02. Cỏ & Thực vật** (`SYS-ENV-VEG`) | 1. Cỏ nghiêng theo hướng gió · 2. Cánh hoa lay động · 3. Rụng cánh hoa · 4. Hạt mọc mầm · 5. Cây héo úa khô hạn · 6. Rũ xuống đọng nước mưa · 7. Bắn vệt bùn khi va quẹt · 8. Đổ bóng dài theo góc nắng | `meadow_sway.gdshader` + Dynamic Tint |
| **03. Địa hình & Địa tầng** (`SYS-ENV-TER`) | 1. Đào thủng ô đất · 2. Nứt vách chịu lực · 3. Đất vụn rơi rụng · 4. Bùn phủ lấp hố · 5. Lắng đọng phù sa · 6. Xói mòn sườn dốc · 7. Sạt lở hốc rỗng · 8. Nén chặt đất bằng phẳng | Dual-pass Root Mask + Voxel/Tile Grid |
| **04. Nước & Thủy văn** (`SYS-ENV-WAT`) | 1. Nước mặt hồ gợn sóng · 2. Dòng thác đổ tung bọt · 3. Sóng nước xô bờ đục · 4. Bọt khí sủi tăm · 5. Nước bắn tung khi có vật rớt · 6. Mực nước dâng khi mưa lớn · 7. Rút nước khi nắng hạn · 8. Nước ngấm rỉ qua tầng đất | Water 2D Shader + UV Panning + Cellular Automata |
| **05. Khí tượng & Bầu trời** (`SYS-ENV-ATM`) | 1. Mây trôi êm đềm · 2. Sương mù trôi lơ lửng · 3. Mưa phùn nhẹ hạt · 4. Mưa rào sấm sét giông gió · 5. Tia chớp lóe sáng chân trời · 6. Gió giật cuốn lá · 7. Chuyển đổi bình minh/hoàng hôn · 8. Màn đêm bao phủ đọng sương | Parallax Layer + Screen Particle + World Environment LUT |
| **06. Công trình & Phản hồi tổ** (`SYS-ENV-STR`) | 1. Tiến độ cào bới hình thành hốc · 2. Trát bùn đắp tường · 3. Kéo dài vách ô sáp lục giác · 4. Mức kho thức ăn đầy dần · 5. Luồng khí thông gió làm mát · 6. Sóng xung động cảnh báo tổ · 7. Kẻ vạch chỉ định công việc · 8. Bụi hoàn công khi xây xong ô | Dynamic Sprite Tile + Progress Decal + Particle Emitter |

---
**Tổng cộng: Đầy đủ 336 dòng hành động và trạng thái phân bổ chi tiết, có định mức frame và phương pháp kỹ thuật rõ ràng.**
