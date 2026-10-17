# THE VIVARIUM 🌿🐜🐝
### Cozy Living Ecosystem Sandbox — Ants & Bees Simulation
**Art Direction: Premium Stylized 2D × Hand-Painted Nature × Autonomous Colony Simulation**

[![Engine](https://img.shields.io/badge/Engine-Godot%204.3%2B-478CBF?logo=godot-engine&logoColor=white)](https://godotengine.org)
[![Art Style](https://img.shields.io/badge/Art%20Style-Stylized%202D%20Hand--Painted-8E44AD)](https://github.com/huynhcam1511/The-Vivarium)
[![Save System](https://img.shields.io/badge/Cloud%20Sync-Firebase%20RTDB%20(Singapore)-FFA000?logo=firebase&logoColor=white)](https://firebase.google.com)
[![Swarm Benchmark](https://img.shields.io/badge/Benchmark-5%2C000%20Entities%20%40%20400%2B%20FPS-2ECC71)](https://github.com/huynhcam1511/The-Vivarium)

---

## 📖 Giới thiệu Dự Án (Overview)

**The Vivarium** là game mô phỏng hệ sinh thái sandbox kết hợp giữa hai quần thể sinh vật xã hội phức tạp nhất trong tự nhiên: **Tổ Kiến (*Formicarium*)** và **Tổ Ong (*Honeycomb Apiary*)** trong cùng một thế giới mặt cạn và lòng đất thống nhất.

Dự án áp dụng phong cách mỹ thuật **Premium Stylized 2D Hand-Painted** (lấy cảm hứng từ *Oxygen Not Included*, *Kingdom*, *Don't Starve*), loại bỏ hoàn toàn các hình học primitive thô sơ và hình ảnh chắp vá, mang đến một hệ sinh thái sống động, ấm cúng và đầy tính khoa học.

---

## 🎨 Điểm Nhấn Mỹ Thuật (Visual Highlights)

- **Đất Tầng Ngầm Liền Mạch (`stylized_handpainted_soil.png`)**: Kết cấu mặt cắt địa chất giàu mùn hữu cơ, sỏi cuội tròn và rễ cây li ti.
- **Thân Sồi Cổ Thụ & Cành Ngang (`stylized_oak_tree.png`)**: Thân cây uốn lượn phủ rêu nhung xanh mướt và địa y tự nhiên.
- **Thảm Hoa Cỏ Tự Nhiên (`stylized_wildflowers.png`)**: Cỏ ba lá trắng (*Trifolium repens*), cúc dại trắng, hoa chuông và cỏ non rực rỡ.
- **Cụm Sáp Ong Rừng Lục Giác (`stylized_honeycomb.png`)**: Các ô sáp chứa mật vàng hổ phách sóng sánh và nắp ấu trùng màu tan bánh quy.
- **Buồng Kiến Khoét Đất Tự Nhiên (`stylized_ant_chamber.png`)**: Khoang ngầm khoét sâu vào khối đất với ánh sáng quan sát đỏ ấm cúng (*Red Observation Light*).
- **Kiến Thợ & Ong Mật Vẽ Tay**: Kiến *Camponotus* bóng bẩy phân đoạn rõ ràng và ong mật *Apis mellifera* lông mượt mang giỏ phấn.

---

## ⚙️ Các Hệ Thống Sinh Thái Cốt Lõi (Core Systems)

1. **Autonomous Colony Simulation (Kiến & Ong)**:
   - Kiến thợ phân vai: *Thợ đào hầm (Excavator)*, *Thu lượm (Forager)*, *Chăm ấu trùng (Nurse)*, *Kiến lính (Major Soldier)*.
   - Ong thợ bay tuần tra hút mật hoa cúc/cỏ ba lá và mang về tích trữ trong bánh tổ.
   - Cơ chế nhịp thở sinh học của Kiến Chúa (*Physogastric breathing*).

2. **Lưới Địa Chất Lòng Đất (Subterranean Grid 60×26)**:
   - Hệ thống đào hầm (`[⛏️ Đào]`) và lấp hầm chống ngập (`[🧱 Lấp]`) vận hành hoàn toàn theo thời gian thực.
   - Đất được đào sẽ thu hồi thành tài nguyên **Bùn Đất Sét (Clay Mud)**.

3. **Điều Phối Pheromone Hoàng Gia (Pheromone Priority)**:
   - Cho phép người chơi tinh chỉnh trọng số điều hướng đàn kiến: Tập trung đào hầm, kiếm ăn, ấp trứng hay phòng thủ.

4. **Hệ Thống Mật Hoa 4 Nguồn (4 Monofloral Honeys)**:
   - Mật Keo Ong, Mật Bạc Hà, Mật Hoa Cúc, Mật Cỏ Ba Lá mang lại các chỉ số dinh dưỡng và đề kháng khác nhau cho đàn ong.

5. **Dual-Save Architecture (Local JSON + Firebase Realtime Database)**:
   - Tự động đồng bộ song song giữa bộ nhớ cục bộ `user://the_vivarium_save.json` và cụm Cloud Database Singapore (`asia-southeast1`).

---

## 📊 Swarm Stress Benchmark (Hiệu Năng 1.000 – 5.000 Cá Thể)

Được kiểm thử tự động với script độc lập `scripts/core/run_swarm_benchmark.gd`:

| Quy Mô Quần Thể | Phân Bổ (Kiến / Ong) | Frametime CPU | Tốc Độ Xử Lý (Theoretical FPS) | Dư Thừa So Với Chuẩn 60 FPS |
| :---: | :---: | :---: | :---: | :---: |
| **1.000 cá thể** | 650 Kiến / 350 Ong | **0.533 ms** | **1.877,4 FPS** | **31,2×** |
| **2.500 cá thể** | 1.625 Kiến / 875 Ong | **1.322 ms** | **756,3 FPS** | **12,6×** |
| **5.000 cá thể** | 3.250 Kiến / 1.750 Ong | **2.423 ms** | **412,8 FPS** | **6,9×** |

---

## 🎮 Hướng Dẫn Điều Khiển & Trải Nghiệm (Controls)

- **Di chuyển Camera**: Kéo giữ chuột giữa (**MMB**) hoặc phím **WASD** / Phím mũi tên.
- **Phóng to / Thu nhỏ**: Cuộn con lăn chuột (**Wheel Up / Down**).
- **Công cụ Đào đất**: Chọn `[⛏️ Đào]` trên thanh công cụ và click vào ô đất trong lòng đất.
- **Công cụ Lấp đất**: Chọn `[🧱 Lấp]` trên thanh công cụ và click vào ô hầm rỗng để chống ngập.
- **Phân bổ Pheromone**: Click `[👑 Phân bổ pheromone]` để điều chỉnh phân công lao động.
- **Chụp ảnh màn hình 2D trong game**: Nhấn phím **F12** bất kỳ lúc nào để chụp ảnh chất lượng cao vào thư mục Artifacts.

---

## 🚀 Khởi Chạy Bản Production (Production Quickstart)

1. **Khởi chạy tức thì bằng 1 click**:
   - Double-click file `C:\Users\ADMIN-PC\Desktop\The_Vivarium.bat` trên màn hình Desktop.
2. **Khởi chạy từ bản Standalone Executable**:
   - Mở thư mục `dist/` và chạy trực tiếp file:
     ```
     dist\The_Vivarium.exe
     ```
     *(Bản build độc lập tự động tải gói dữ liệu biên dịch `The_Vivarium.pck`, không cần mở Godot Editor).*

---

*Phát triển trên nền tảng Godot Engine 4.3+ Compatibility Renderer.*
