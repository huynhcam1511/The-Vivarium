# THE VIVARIUM — MASTER PRODUCTION ROADMAP & SPECIFICATION

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Nền tảng mục tiêu:** PixiJS v8 × React × TypeScript (Web Game Engine)  
> **Cổng vận hành dev:** `http://localhost:2000`  
> **Thư mục dự án độc lập:** `the-vivarium-web/` (Không ghi đè, bảo toàn dự án Godot gốc)  
> **Phiên bản kế hoạch:** 1.0 — Chuẩn hóa công nghiệp Game 2D/2.5D  

---

## 01. ART DIRECTION — CHUẨN HÓA MỸ THUẬT

- [x] **Phong cách cốt lõi:** `[APPROVED - DONE]` *Premium Semi-Realistic Stylized Hand-Painted 2D/2.5D (Option A: Stylized Readability)*.
- [x] **Bảng màu (Color Palette):** `[APPROVED - DONE]` Base palette 6 nhóm môi trường (cho phép mở rộng highlight/shadow).
- [ ] **Tỷ lệ cơ thể & Buồng tổ (Metric Scaling):** `[REVISED - PROPOSED]` Phân tách 3 tầng (World $1920\times 1440$, Grid $32\text{ px}$, Render size màn hình ở 1x/2x/4x) trong VISUAL_BIBLE.md.
- [x] **Góc nhìn (Perspective):** `[APPROVED - DONE]` 2D Side-view Cross-section Cutaway (640px mặt đất + 800px lòng đất), camera tự do.
- [ ] **Các mức Zoom & LOD:** `[CONDITIONAL - PROPOSED]` Phạm vi 0.25x–4.0x được duyệt làm môi trường thử nghiệm; ma trận LOD 4 cấp độ trong VISUAL_BIBLE.md.
- [ ] **Quy chuẩn kỹ thuật Asset:** `[REVISED - PROPOSED]` Tách biệt canvas riêng cho từng loài ($96\text{ px}$, $128\text{ px}$, $256\text{ px}$, $512\text{ px}$, $760\text{ px}$), pivot chi tiết theo loài, 2px padding trong ASSET_SPECIFICATION.md.
- [x] **Visual Bible & Reference Board:** `[APPROVED - DONE]` 8 ảnh concept chuẩn trong `references/` và văn bản VISUAL_BIBLE.md v1.0.

---

## 02. ENVIRONMENT — MÔI TRƯỜNG TỰ NHIÊN

- [ ] **Bầu trời & Hậu cảnh xa:**
  - Sky gradient chuyển màu động theo thời gian trong ngày (Bình minh, Trưa, Hoàng hôn, Đêm trăng).
  - Dãy núi tuyết và rặng thông mờ xa (Distant mountain silhouette parallax layer).
- [ ] **Cây sồi cổ thụ đa tầng:**
  - Thân cây chính (Trunk) với các hốc rỗng tự nhiên.
  - Các cành bạnh ngang (Horizontal boughs) nâng đỡ các nhà chòi và tổ ong khổng lồ.
  - Tán lá xếp lớp (Canopy foliage clusters) với hiệu ứng bóng râm.
  - Hệ thống rễ cây khổng lồ uốn lượn đâm xuyên xuống địa tầng lòng đất.
- [ ] **Thảm thực vật bề mặt:**
  - Cỏ xanh mướt trải dài bờ hồ và đồng cỏ.
  - Bụi hoa mật: Cỏ 3 lá (White Clover), Cúc dại (Daisy), Hoa chuông tím (Bluebell).
- [ ] **Địa tầng & Vật liệu lòng đất:**
  - Lớp đất mặt (Topsoil), Lớp mùn hữu cơ (Humus), Tầng đất sét dẻo (Clay), Tầng đá tảng ngầm (Bedrock & Stones).
  - Rễ con và thớ rễ li ti bám dọc vách hầm.
- [ ] **Hệ thống nước:**
  - Hồ nước trong vắt nhìn thấu đáy hồ (Clear lake basin).
  - Rong rêu thủy sinh, sỏi cát đáy hồ.
  - Thác nước đổ từ vách núi và guồng nước gỗ tự nhiên bên bờ suối.
- [ ] **Chi tiết sinh thái phụ trợ:** Nấm rừng phát quang, thân gỗ mục, lá phong rụng.
- [ ] **Hiệu ứng Parallax & Ánh sáng động:**
  - 4 lớp cuộn độc lập (Hậu cảnh xa, Cây cối trung cảnh, Gameplay chính, Ánh sáng tiền cảnh).
  - Tia nắng xuyên tán cây (God rays) và ánh trăng xanh đêm mát dịu.

---

## 03. ANT COLONY — HỆ THỐNG TỔ KIẾN ĐỘC LẬP

- [ ] **Bộ sinh vật kiến:**
  - Kiến chúa (Queen): Bụng căng lớn, chuyển động chậm rãi, đẻ trứng theo chu kỳ.
  - Kiến thợ (Worker): Thân hình linh hoạt, đảm nhiệm đào đất, ấp trứng, dọn rác, thu hoạch.
  - Kiến lính (Major/Soldier): Đầu to bạnh, hàm khỏe, bảo vệ tổ và nghiền hạt giống cứng.
- [ ] **Vòng đời kiến (Brood Stages):**
  - Trứng kiến (Eggs): Cụm hạt trắng ngọc bóng bẩy.
  - Ấu trùng (Larvae): Sâu con béo múp ngo ngoe đòi ăn.
  - Nhộng (Pupae): Kén lụa chuẩn bị lột xác thành kiến trưởng thành.
- [ ] **Hệ thống buồng tổ chuyên biệt:**
  - Buồng kiến chúa (Royal Chamber) trung tâm ấm áp.
  - Vườn nấm cộng sinh (Mushroom Garden): Kiến bồi đắp lá mục để nuôi nấm sợi trắng làm thức ăn.
  - Kho hạt giống (Granary Vault) khô ráo chống mốc.
  - Kho lá cây & kho thức ăn tươi.
  - Hồ chứa nước ngầm & Khu xử lý rác thải cách ly.
- [ ] **Vật liệu vách hầm & Contour:**
  - Contour vách đất bo tròn hữu cơ (Dynamic Marching Cubes/Bézier Smoothing).
  - Đèn lồng treo tường hầm phát ánh sáng vàng ấm.
- [ ] **Tương tác Đào/Lấp (Excavation Mechanics):**
  - Phát lệnh đào/lấp bằng chuột $\rightarrow$ Đặt task vào hàng đợi $\rightarrow$ Kiến thợ di chuyển tới gặm đất $\rightarrow$ Vách hầm khoét rỗng mượt mà $\rightarrow$ Vác viên đất nhỏ ra bãi thải.

---

## 04. BEE COLONY — HỆ THỐNG TỔ ONG RỪNG SỒI

- [ ] **Bộ sinh vật ong:**
  - Ong chúa (Queen Bee): Thân dài quý phái ngự trong khoang sáp hoàng gia.
  - Ong thợ (Worker Bee): Lông ngực mịn, sọc vàng đen rõ ràng, mang giỏ phấn hoa sáng rực rỡ ở chân sau.
  - Ong đực (Drone): Thân ngắn mập, mắt kép to.
- [ ] **Vòng đời ong:** Trứng ong trong đáy ô sáp $\rightarrow$ Ấu trùng ngâm sữa ong $\rightarrow$ Nắp sáp bịt kín buồng nhộng.
- [ ] **Cấu trúc bánh tổ lục giác (Hexagonal Comb Architecture):**
  - Hệ tọa độ Axial Hex Grid $(q, r)$ gắn trên thân và cành cây.
  - Trạng thái từng ô sáp: Ô trống (Empty wax), Ô chứa mật lỏng (Nectar), Ô mật chín đặc sáng bóng (Capped Honey), Ô phấn hoa đa sắc (Bee pollen), Ô ươm ấu trùng (Brood cell).
- [ ] **Phân khu chức năng tổ:**
  - Buồng ong chúa trung tâm.
  - Kho mật chính (Honey Store).
  - Kho phấn hoa (Pollen Store) nhiều màu tím, vàng, cam.
  - Khu công nhân tiết sáp xây tổ (Wax Building Zone).
- [ ] **Kiến trúc tổ ong đa tầng:**
  - Tổ chính rỗng trong bọng thân cây đại thụ với cầu thang gỗ.
  - Các tổ ong dại treo lơ lửng dưới tán cành vươn ra hồ nước.

---

## 05. WILDLIFE — HỆ ĐỘNG VẬT PHONG PHÚ

- [ ] **Hệ thủy sinh:**
  - Đàn cá nhỏ bơi theo bầy (Flocking Boids).
  - Cá chép/cá hồi bơi lượn đổi hướng nhịp nhàng.
- [ ] **Chim muông ven hồ:**
  - Vịt trời bơi mặt hồ, thỉnh thoảng chúi đầu bắt mồi.
  - Đàn vịt con bơi nối đuôi vịt mẹ.
  - Chim bói cá đậu trên cọc rễ quan sát.
- [ ] **Lưỡng cư & Côn trùng:**
  - Ếch ngồi trên phiến đá rêu / lá sen nở hoa.
  - Bướm lượn quanh đồng cỏ hoa dại, chuồn chuồn bay lướt mặt hồ.
- [ ] **Động vật lớn viền rừng xa:** Hươu sao gặm cỏ bờ suối, sóc chuyền cành sồi.

---

## 06. ANIMATION — CHUYỂN ĐỘNG & SINH KHÍ

- [ ] **Chuyển động của Kiến:**
  - Bộ chân 6 khớp cử động so le chuẩn sinh học (Tripod gait).
  - Vác đất/hạt trên lưng, rung lắc 2 râu giao tiếp pheromone.
  - Động tác chải râu và cho ấu trùng ăn.
- [ ] **Chuyển động của Ong:**
  - Vỗ cánh tần số cao với shader vệt mờ trong suốt (Wing flap blur).
  - Lượn lờ tiếp đất (Landing), cắm vòi hút mật và gom phấn hoa vào chân.
- [ ] **Chuyển động môi trường:**
  - Sóng nước gợn lăn tăn, bọt nước thác đổ tung trắng xóa.
  - Cành lá và bông hoa dại đung đưa theo sức gió thời gian thực.
  - Chu kỳ chuyển ngày/đêm và thời tiết mưa bão mềm mại.

---

## 07. WORLD RENDERING — DỰNG HÌNH THẾ GIỚI HYBRID

- [ ] **Quy tắc tuyệt đối:** Không dán nguyên một tấm ảnh chết làm background tĩnh.
- [ ] **Kiến trúc tách lớp PixiJS v8:**
  - `Layer 0: Deep Parallax Sky & Distant Alps` (Bầu trời & Núi xa).
  - `Layer 1: Tree Trunk & Canopy Mesh` (Cây sồi & Tán lá).
  - `Layer 2: Lake Basin & Water Surface Shader` (Mặt nước trong & đáy hồ).
  - `Layer 3: Hexagonal Honeycomb Matrix` (Tổ ong với dữ liệu cell độc lập).
  - `Layer 4: Subterranean Soil & Root Mesh` (Đất nền liên tục).
  - `Layer 5: Dynamic Tunnel Cavity Cutouts` (Đường hầm đào động có bo vách).
  - `Layer 6: Entities & Particles` (Kiến, ong, cá, vịt, bọt nước, đom đóm).
  - `Layer 7: Dynamic Lighting & Ambient Occlusion` (Ánh sáng đèn lồng và bóng tối).
- [ ] **Camera 2D mượt mà:** Pan WASD, chuột kéo thả quán tính, zoom tâm con trỏ, tự động đổi LOD theo độ zoom.

---

## 08. HUD & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)

- [ ] **Chuẩn hóa toàn diện ngôn ngữ tiếng Việt tự nhiên.**
- [ ] **Thanh Telemetry phía trên:** Hiển thị Mùa, Ngày, Nhiệt độ, Độ ẩm, CO₂, Gió, Kho tài nguyên.
- [ ] **Thanh thao tác phía dưới:** Bộ nút vuông bo góc `Di chuyển`, `Đào`, `Lấp`, `Trồng`, `Xây`, `Nghiên cứu`, `Quản lý`.
- [ ] **Thanh thống kê cá thể:** Bộ pill hiển thị trực quan quân số kiến, ong, thực vật, nước, động vật.
- [ ] **Bản đồ radar (Minimap):** Cửa sổ thu nhỏ toàn cảnh thế giới với khung viewfinder phản ánh góc nhìn camera.
- [ ] **Chế độ chơi:** Chuyển đổi linh hoạt giữa `Sandbox (Thỏa sức sáng tạo)` và `Sinh tồn (Cân bằng sinh thái)`.

---

## 09. INTEGRATION & QUALITY ASSURANCE

- [ ] **Hiệu năng vững chắc:** Đảm bảo duy trì $\ge 60\text{ FPS}$ ở độ phân giải $1280 \times 720$ và $1920 \times 1080$.
- [ ] **Đồng nhất tỷ lệ:** Kiến, ong, hoa cỏ không bị chênh lệch kích thước phi lý.
- [ ] **Kiểm thử logic Đào/Lấp:** Không tạo ra góc chết làm kẹt pathfinding của kiến.
- [ ] **Kiểm thử hành vi:** Đàn ong không bị bay xuyên vật thể, đàn kiến tìm đường chính xác trong mê cung hầm.
- [ ] **Lưu & Tải thế giới (Save/Load):** Lưu trữ trạng thái thế giới (lưới đào, tổ ong, quân số sinh vật) vào `LocalStorage` hoặc JSON.

---

*Bản kế hoạch này là kim chỉ nam chính thức cho toàn bộ quá trình hoàn thiện THE VIVARIUM.*
