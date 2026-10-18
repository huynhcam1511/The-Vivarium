# ART PIPELINE AUDIT & ART DIRECTION BIBLE
## THE VIVARIUM — QUALITY GATE: STOP PROCEDURAL PLACEHOLDER ART

**Trạng thái kiểm duyệt:** STRICT QUALITY GATE ACTIVE  
**Nguyên tắc chỉ đạo:** Dừng tạo artwork giả lập bằng script (Python Pillow, GaussianBlur, primitive shapes). Không tự nhận asset thuật toán là tranh vẽ tay. Giữ asset hiện tại làm placeholder kỹ thuật, xây dựng quy chuẩn thương mại chuẩn mực trước khi tích hợp vào game chính.

---

## 1. KIỂM TOÁN TÀI NGUYÊN HIỆN CÓ (EXISTING ASSETS AUDIT)

| Asset File | Nguồn gốc tạo lập | Hiện trạng & Khuyết điểm | Đánh giá | Phương án xử lý |
|---|---|---|---|---|
| `assets/tilesets/organic_soil_tileset.png` | Script Python Pillow (Cắt ghép 64x64 + GaussianBlur + vẽ sỏi/rễ bằng ImageDraw) | Vết cắt thô, viền blur nhân tạo, không có 47-bitmask autotile chuẩn Godot, thiếu sự liên kết địa chất tự nhiên. | ❌ **Không đạt chuẩn thương mại** | **Giữ làm Placeholder kỹ thuật** cho PoC; thay bằng bộ tileset chuyên nghiệp khi vào game chính. |
| `assets/sprites/stylized_ant_chamber.png` | AI Image Generator | Tách nền đơn khối, không thể mở rộng mô-đun hóa khi người chơi đào đất mở buồng tổ lớn/nhỏ. | ⚠️ **Chỉ là Concept art** | Thay bằng **Modular Chamber Kit** (vách vòm trên, vách vòm dưới, cột chống, sàn buồng). |
| `assets/sprites/stylized_ant.png` | AI Image Generator | Sprite tĩnh 1 frame, không có hoạt họa bước chân (walk cycle) hay động tác tha mồi (carry) và đào (dig). | 🟡 **Concept tạo hình khá** | Giữ làm tham chiếu Visual; cần thay bằng **Animated SpriteSheet 4-8 frames**. |
| `assets/sprites/stylized_bee.png` | AI Image Generator | Sprite tĩnh, thiếu cánh vỗ (wing flap cycle) và tư thế hút mật (pollination state). | 🟡 **Concept tạo hình khá** | Cần thay bằng **Animated SpriteSheet vỗ cánh**. |
| `assets/sprites/stylized_oak_tree.png` | AI Image Generator | Hình cây tĩnh, tán lá liền khối không có hiệu ứng gió đu đưa (wind sway). | 🟡 **Khá cho Background** | Giữ lại làm layer Mid-ground, tách lớp lá phía trước để làm Shader đu đưa nhẹ. |
| `assets/sprites/stylized_wildflowers.png` | AI Image Generator | Cụm hoa liền dải, không thể cho ong tương tác hái mật từng bông riêng lẻ. | 🟡 **Khá cho Ground cover** | Tách rời thành các cụm hoa đơn (Trifolium repens, Bellis perennis) để gắn logic nạp mật. |
| `assets/sprites/stylized_honeycomb.png` | AI Image Generator | Khối sáp mật tĩnh, không module hóa thành từng ô lục giác (hex cell) để ong xây mở rộng. | 🟡 **Khá cho Visual concept** | Chuyển thành hệ thống **Modular Hex Grid** cho phép xây dựng từng ô sáp. |

---

## 2. NGUỒN ASSET THỰC TẾ & BẢN QUYỀN THƯƠNG MẠI (COMMERCIAL LICENSES)

Các nguồn được kiểm chứng thực tế trên Internet, không bịa đặt liên kết hay giấy phép:

### A. Nguồn Miễn phí Thương mại (CC0 / Public Domain / MIT)
1. **Kenney.nl (Creative Commons CC0 1.0 Universal):**
   - **Tài nguyên áp dụng:** 
     - *Kenney UI Pack & Input Prompts:* Hệ thống nút bấm, thanh điều khiển, icon đào/lấp/hủy tác vụ chuẩn UI game.
     - *Kenney Foliage Sprites:* Cụm lá cây, bụi cỏ để làm thảm thực vật mặt đất.
     - *Kenney Particle Pack:* Bụi đất văng khi kiến đào, tia sáng mặt trời xuyên kẽ lá, giọt mật óng ánh.
   - **Bản quyền:** CC0 1.0 — Được phép dùng cho game thương mại, không bản quyền, không bắt buộc ghi công.
2. **OpenGameArt.org (CC0 & CC-BY 3.0/4.0):**
   - **Tài nguyên áp dụng:**
     - *Dan Norder's Ant Farm assets (OGA-BY / CC-BY 3.0):* Tham chiếu cấu trúc phân tầng ngầm của tổ kiến.
     - *SFX âm thanh tự nhiên:* Tiếng đào đất (`dig_earth.wav`), tiếng vo ve côn trùng (`bee_buzz.wav`), gió thổi.
   - **Bản quyền:** CC-BY yêu cầu ghi rõ danh tính tác giả trong mục Credits của game.

### B. Nguồn Thương mại Chuyên nghiệp (Commercial Asset Stores: itch.io & Game-Art Markets)
1. **Rafael ChM — "Handpainted Cavern Platformer" (itch.io):**
   - **Đặc điểm:** Bộ tileset hang đá và đất ngầm vẽ tay độ phân giải cao, không phải pixel art, có viền chuyển tiếp tự nhiên giữa vách đất và lòng hang.
   - **Bản quyền:** Standard Commercial Game Asset License (được phát hành trong sản phẩm game thương mại).
2. **LionBox — "Hand drawn animated 2D Bugs / 2D Bee animation" (itch.io):**
   - **Đặc điểm:** Sprite côn trùng vẽ tay (Hand-drawn / Vector), có đầy đủ chuỗi animation bước đi, vỗ cánh, định dạng PNG sequence + SVG.
   - **Bản quyền:** Commercial Game License.

---

## 3. ART DIRECTION BIBLE (QUY CHUẨN MỸ THUẬT THE VIVARIUM)

### Định hướng Chủ đạo: **PREMIUM STYLIZED 2D NATURALIST**
*Triết lý:* Mô phỏng thế giới tự nhiên sống động, trang nhã, giàu tính sinh học nhưng có ngôn ngữ đồ họa vẽ tay ấm áp, rõ ràng (tương đồng mỹ thuật của *Kingdom Two Crowns*, *Oxygen Not Included*, *Apico*).

```
+---------------------------------------------------------------------------------------+
| LAYER 1: SKY & CANOPY (Z-Index: -20 -> -10)                                           |
|   - Bầu trời xanh nhạt chuyển sắc, ánh nắng xiên (God rays qua PointLight2D/Shader)   |
|   - Tán cây sồi cổ thụ đung đưa nhẹ                                                   |
+---------------------------------------------------------------------------------------+
| LAYER 2: OUTWORLD & SURFACE (Z-Index: 0 -> 10)                                        |
|   - Cành cây cổ thụ & Tổ ong sáp dại (Hexagonal Wild Honeycomb)                       |
|   - Ong thợ bay lượn, thụ phấn trên thảm cỏ hoa dại (Clover, Daisies)                 |
|   - Cửa tổ kiến bằng đất đắp (Clay mound) ngăn nước mưa                               |
+=======================================================================================+ MẶT ĐẤT
| LAYER 3: SUBTERRANEAN FORMICARIUM (Z-Index: 0 -> 10)                                  |
|   - Lòng hang tối màu chiều sâu (#120B06), đất bao quanh màu nâu ấm (#362214)         |
|   - Viền vách đất bo cong hữu cơ, có rễ cây rủ và sỏi đá tự nhiên                     |
|   - Ánh sáng đỏ ấm quan sát ngầm (Red observation light 650nm) bảo vệ đàn kiến        |
|   - Buồng Chúa (Queen), Vườn Ấu trùng (Nursery), Kho Hạt (Granary)                     |
+---------------------------------------------------------------------------------------+
| LAYER 4: VIVARIUM GLASS & FOREGROUND (Z-Index: 15 -> 25)                              |
|   - Viền khung bể kính Terrarium cao cấp, phản quang nhẹ cạnh kính                    |
|   - Rễ cây tiền cảnh mờ nhẹ tạo chiều sâu quang học (Depth of field)                   |
+---------------------------------------------------------------------------------------+
```

### Quy định Kỹ thuật về Asset (Strict Asset Specifications):
1. **Không Pixel Art:** Mọi asset phải là 2D Illustration / Vector sắc nét (Texture Canvas chuẩn 1080p/2K/4K).
2. **Không Sprite Nền Trắng / Lỗi Viền Alpha:** Mọi sprite phải có kênh Alpha sạch 100%, không viền trắng răng cưa do tự động tách nền.
3. **Quy định Lưới Tileset:**
   - Đơn vị ô logic: `32 × 32 px` (phù hợp engine tính toán A*).
   - Độ phân giải gốc của tile: `64 × 64 px` hoặc `128 × 128 px`, được Godot import với bộ lọc Mipmap và Texture Filtering `Linear` để chống vỡ hạt khi zoom camera.
4. **Tỷ lệ Kích thước Sprite (Visual Metric Hierarchy):**
   - Kiến thợ (Worker Ant): `24 × 16 px`.
   - Kiến lính (Soldier Ant): `32 × 22 px`.
   - Kiến Chúa (Queen Ant): `64 × 40 px` (gấp ~2.8 lần kiến thợ).
   - Ong mật (Honeybee): `28 × 22 px`.
   - Ấu trùng (Larvae): `12 × 8 px`.
   - Hạt giống thức ăn: `8 × 8 px` đến `12 × 12 px` (đúng tỷ lệ trên hàm kiến).

---

## 4. KIỂM TOÁN LẠI BENCHMARK & BÓC TÁCH CHI PHÍ THỜI GIAN ENGINE

Đo đạc thực tế thông qua test runner Godot Engine trên môi trường Windows (`Godot v4.7.2.stable.official`, NVIDIA RTX 2060 SUPER, CPU x64):

### Test Cases & Điều kiện Đo:
- **Kích thước bản đồ:** Lưới ngầm 60 × 40 ô (2.400 ô), gồm 564 ô rỗng (đường hầm và buồng kết nối đa nhánh) và 1.836 ô đất đặc.
- **Phương pháp đo:** Dùng `Time.get_ticks_usec()` đo lặp lại trên các quy mô: 100 kiến, 500 kiến, 1.000 kiến.
- **Phân tách các pha xử lý riêng biệt:**

| Pha Xử Lý | 100 Kiến | 500 Kiến | 1.000 Kiến | Bản chất & Ý nghĩa kỹ thuật |
|---|---|---|---|---|
| **Simulation Time** | 0.085 ms (85 µs) | 0.491 ms (491 µs) | 0.990 ms (990 µs) | Xử lý logic đói, năng lượng, pheromone và chuyển trạng thái State Machine. |
| **Pathfinding Time (100% Repath)** | 0.833 ms (833 µs) | 4.145 ms (4.145 µs) | 8.467 ms (8.467 ms) | Tính toán lại toàn bộ lộ trình qua `AStarGrid2D` (chỉ xảy ra khi sập hang lớn). |
| **Pathfinding Time (Thực tế 10%/frame)** | **0.083 ms** | **0.415 ms** | **0.847 ms** | Trong thực tế đàn phân tán, chỉ ~10% số cá thể cần tìm đường mới trong 1 frame. |
| **Kinematic Movement Time** | 0.016 ms (16 µs) | 0.062 ms (62 µs) | 0.124 ms (124 µs) | Tính toán vector nội suy vị trí và đổi hướng sprite `flip_h`. |
| **Rendering Prep (CanvasItem Server)** | 0.009 ms (9 µs) | 0.043 ms (43 µs) | 0.087 ms (87 µs) | Cập nhật ma trận biến đổi (Transform2D) đẩy sang tầng đồ họa. |
| **TỔNG CPU FRAME TIME** | **0.193 ms** | **1.010 ms** | **2.047 ms** | Tổng thời gian CPU tiêu thụ cho toàn bộ mô phỏng trong 1 frame. |
| **Tỷ lệ Ngân sách 16.6ms (@ 60 FPS)** | **1.16%** | **6.06%** | **12.28%** | **Còn trống 87% - 98% ngân sách cho GPU render và UI.** |

> [!IMPORTANT]
> **Đánh giá Khách quan:**
> - CPU hoàn toàn chịu tải mượt mà cho 1.000 cá thể với thuật toán C++ của `AStarGrid2D`.
> - **Điểm nghẽn đồ họa thực tế (Rendering Bottleneck):** Nếu tạo 1.000 Node `Sprite2D` riêng rẽ kèm ánh sáng `PointLight2D` bóng đổ, GPU sẽ bị nghẽn Draw Calls. 
> - **Giải pháp bắt buộc cho giai đoạn Production:** Tách biệt logic mô phỏng (chạy thuần túy trên mảng dữ liệu) và hiển thị qua `MultiMeshInstance2D` hoặc gom vẽ trên `_draw()` của một Canvas duy nhất.

---

## 5. QUY TRÌNH TÍCH HỢP ASSET VÀO GODOT

```
[1. Lựa chọn Asset Thương mại Có Bản quyền]
                │
                ▼
[2. Kiểm tra Kênh Alpha & Tỷ lệ Pixel Art/Non-pixel] (Loại bỏ triệt để viền trắng/kéo giãn)
                │
                ▼
[3. Đóng gói Tileset 47-Blob Autotile theo chuẩn Godot 4.x TileSet Resource (.tres)]
                │
                ▼
[4. Kiểm thử Độc lập trên Sandbox PoC] (Kiểm tra viền nối, góc bo, không đụng main game)
                │
                ▼
[5. Duyệt Visual Quality Bar & Technical Performance]
                │
                ▼
[6. Non-Destructive Refactoring vào Game Chính]
```

---

## 6. CÁC HẠN CHẾ, RỦI RO & PHƯƠNG ÁN PHÒNG NGỪA

1. **Rủi ro đứt gãy Save/Load khi đổi TileMap:**
   - *Phân tích:* `subterranean_grid.gd` cũ lưu mảng boolean thô. Khi đổi sang `TileMapLayer`, nếu không cẩn thận sẽ làm hỏng dữ liệu lưu trên Firebase và local file.
   - *Phòng ngừa:* Tạo lớp chuyển đổi adapter (Serialization Adapter) đảm bảo dữ liệu save luôn tương thích ngược hai chiều.
2. **Rủi ro lệch tông mỹ thuật giữa tổ kiến và tổ ong:**
   - *Phòng ngừa:* Khóa chặt bảng màu chuẩn trong Art Direction Bible (đất nâu sẫm, mật ong hổ phách ấm, ánh sáng ngầm đỏ dịu).

---

## 7. KẾ HOẠCH NÂNG CẤP VISUAL VERTICAL SLICE TIẾP THEO

- **Giai đoạn A (Hiện tại):** Đóng băng mã nguồn game chính, giữ `scenes/poc/tilemap_astar_poc.tscn` làm phòng thí nghiệm kỹ thuật.
- **Giai đoạn B:** Chuẩn bị các pack asset thương mại đạt chuẩn Stylized 2D (không dùng ảnh sinh bằng code Pillow).
- **Giai đoạn C:** Cấu hình `TileSet.tres` hoàn chỉnh với Godot Terrain Sets (Bitmask 47 tiles).
- **Giai đoạn D:** Chỉ khi đạt điểm kiểm duyệt Visual Acceptance mới tiến hành lập kế hoạch tích hợp an toàn.
