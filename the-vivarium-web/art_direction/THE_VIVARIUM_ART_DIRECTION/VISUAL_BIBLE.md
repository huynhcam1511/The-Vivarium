# THE VIVARIUM — VISUAL BIBLE (TECHNICAL SPECIFICATION v1.0)

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Phiên bản:** v1.0 (Revision theo chỉ đạo DIRECTOR TASK-002)  
> **Trạng thái:** DRAFT HOÀN THIỆN — CHỜ PHÊ DUYỆT CÁC MỤC CONDITIONAL / REVISED  
> **Phân quyền:** Project Owner: USER | Game Director: CHATGPT | Technical Developer: ANTIGRAVITY  

---

## 1. PHONG CÁCH MỸ THUẬT CỐT LÕI (CORE ART DIRECTION) — [APPROVED]

- **Phong cách đã duyệt:** *Premium Semi-Realistic Stylized Hand-Painted 2D/2.5D*.
- **Triết lý hiển thị (Option A — Stylized Readability):**
  - Kết hợp mỹ thuật vẽ tay sinh động (painterly digital brushwork) với mô phỏng sinh thái chân thực.
  - Không đi theo phong cách hoạt hình trẻ con/chibi (không vẽ mắt cười ngô nghê, không vẽ nét que tối giản).
  - Không lạm dụng ảnh chụp macro quang học gây nhiễu vỡ điểm ảnh khi thu phóng.
  - **Kiến (Formicidae):** Silhouette rõ ràng, phân định 3 phần (đầu có hàm khỏe và râu gãy khúc cử động, ngực thon cứng, bụng gaster căng bóng có vân đốt), 6 chân có khớp tách biệt. Ở mức zoom 1.0x, người chơi dễ dàng nhận biết tư thế bò, hướng di chuyển và vật phẩm đang tha.
  - **Ong (Apis mellifera):** Ngực áo lông nhung màu vàng mật ấm áp, bụng sọc đen - vàng hổ phách tương phản cao, cánh màng kép trong suốt có ánh lân tinh tím nhẹ, chân sau mang khối phấn hoa vàng tươi sáng khi thu hoạch.
- **Quy tắc vàng:** Ảnh concept trong `references/` là *Reference Targets* (chuẩn mực thẩm mỹ mục tiêu), **TUYỆT ĐỐI KHÔNG** dùng nguyên tấm ảnh làm background tĩnh và không crop buồng tổ cố định để giả lập tương tác. Mọi thành phần hiển thị phải là asset tách lớp độc lập hoặc mesh/shader động.

---

## 2. BẢNG MÀU CHUẨN CƠ BẢN (BASE PALETTE MATRIX) — [APPROVED]

Đã được Game Director phê duyệt làm Base Palette, cho phép Technical Artist tự do mở rộng các sắc độ Highlight (sáng) và Shadow (tối) trong quá trình sản xuất asset:

### 2.1. Tán Rừng & Cây Cổ Thụ (Ancient Oak & Canopy)
- `Deep Bark (Bóng thân cây):` `#2A1810` (Highlight: `#6B4423`, Base: `#4A2E1B`)
- `Velvet Moss (Rêu nhung cành cây):` `#588157` (Highlight: `#74A57F`, Shadow: `#385E3B`)
- `Forest Canopy (Tán lá sồi):` `#2D6A4F` (Sunlit Leaves: `#52B788`, Deep Canopy: `#1B4332`)
- `Autumn Leaf (Lá mùa thu):` `#D97706` / `#B45309`

### 2.2. Địa Tầng & Lòng Đất (Subterranean Strata & Chambers)
- `Topsoil (Đất mùn bề mặt):` `#3D2719`
- `Dark Chocolate Loam (Đất mùn tơi xốp chính):` `#25160E` (Shadow: `#150C07`)
- `Peat Layer (Than bùn kết chặt):` `#1A1009`
- `Clay Strata (Đất sét vàng nâu):` `#4E3120` / `#6E472F`
- `Subterranean Rock / Pebble (Đá ngầm):` `#5C5549` (Dark: `#3E3A33`)
- `Lantern Glow (Ánh đèn lồng hầm ngầm):` Ambient `#FFB703`, Core `#FFAA00`, Shadow rim `#7F2314`

### 2.3. Hệ Thống Nước & Lòng Hồ (Aquatic Lake & Waterfalls)
- `Lake Abyss (Đáy hồ sâu):` `#0F2A3F`
- `Deep Water (Tầng nước trung):` `#1B4965`
- `Clear Surface (Mặt nước trong vắt):` `#2A6F97` (Sun Shimmer Line: `#89C2D9`)
- `Waterfall Foam (Bọt nước thác):` `#E0F2FE` / `#BAE6FD`
- `Aquatic Flora (Rong rêu đáy nước):` `#1E5E4E` / `#2EC4B6`

### 2.4. Vương Quốc Ong & Bánh Tổ (Beehive & Comb Matrix)
- `Raw Beeswax Rim (Vách sáp thô):` `#936639` (Highlight: `#B08968`)
- `Pure Nectar (Mật hoa lỏng):` `#F4A261`
- `Golden Ripe Honey (Mật chín óng ả):` `#FFB703` (Deep Amber: `#FB8500`)
- `Pollen Gold (Hạt phấn hoa):` `#FFEA00` (Cam: `#FB5607`, Hồng tím: `#F72585`)

### 2.5. Sinh Vật & Giáp Chitin (Fauna & Chitin Colors)
- `Ant Chitin:` Thân `#1F110C`, Vân đốt `#4A2818`, Khớp chân `#8B4513`, Đầu râu `#FFA500`
- `Ant Queen Chitin:` Đỏ nâu sẫm `#3B0902`, Bụng căng mọng `#7A1D0E`, Highlight `#A8321D`
- `Bee Velvet & Chitin:` Lông ngực `#D4A373`, Bụng vàng `#FB8500`, Sọc đen `#023047`, Cánh `#E0AAFF` (opacity 0.65)
- `Fish Scales:` Lưng xám xanh `#4A5568`, Bụng cam vây vàng `#F3722C` / `#F9C74F`

### 2.6. Khí Quyển & Ánh Sáng (Atmosphere & Lighting)
- `Day Sky:` `#8ECAE6` $\rightarrow$ `#219EBC`
- `Sunset Sky:` `#FB8500` $\rightarrow$ `#D62828`
- `Night Ambient Overlay:` `#03071E` (alpha 0.65–0.80)
- `Bioluminescence (Nấm phát quang & Đom đóm):` `#72EFDD` / `#9D4EDD`

---

## 3. BA TẦNG KÍCH THƯỚC: LOGICAL WORLD, SOURCE ARTWORK & RENDERED SCREEN (REVISED)

Nhằm giải quyết triệt để sự nhập nhằng giữa logic mô phỏng, độ phân giải vẽ gốc và kích thước hiển thị trên màn hình người chơi, dự án phân tách rõ 3 tầng kích thước:

1. **Logical World Size (Toạ độ mô phỏng thế giới):**
   - Đơn vị tính: World Units / Logical Pixels.
   - Kích thước thế giới toàn cảnh: $1920 \times 1440\text{ units}$ (Mặt đất: $640\text{ units}$, Lòng đất: $800\text{ units}$).
   - Ô lưới mô phỏng ngầm (Simulation Grid Cell): $32 \times 32\text{ units}$ (Đóng vai trò quản lý logic chiếm dụng Dig/Fill, đường đi A* BFS, không ép địa hình phải là các khối vuông).
2. **Source Artwork Resolution (Độ phân giải file vẽ gốc):**
   - Đơn vị tính: Pixel thực trong file PNG master ($W \times H\text{ px}$).
   - Được thiết kế với tỷ lệ $2\times$ hoặc $4\times$ so với kích thước logic thế giới để khi người chơi zoom cận cảnh $2.0\times$ hoặc $4.0\times$, hình ảnh vẫn giữ nguyên độ chi tiết vi mô, không bị vỡ hạt (pixelation) hay mờ nhòe (bilinear blur).
3. **Rendered Screen Size (Kích thước hiển thị thực tế trên màn hình):**
   - Phụ thuộc trực tiếp vào mức Camera Zoom: $\text{Screen Size} = \text{Logical World Size} \times \text{Camera Zoom}$.

---

## 4. BẢNG MA TRẬN KÍCH THƯỚC & ĐỘ PHÂN GIẢI (ASSET SIZE & RESOLUTION MATRIX — APPROVED v2.0)

| Danh Mục Asset | Logical World Size (Units) | Rendered Screen (1.0x Zoom) | Rendered Screen (2.0x Zoom) | Rendered Screen (4.0x Zoom) | Source Artwork Canvas (Master PNG) | Ghi Chú Kỹ Thuật & Đồ Họa |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kiến thợ (Worker Ant)** | **$26 \times 18$ (Thân)**<br>*(Sải chân $36 \times 20$)* | **$26 \times 18\text{ px}$**<br>*(Tổng $36 \times 20\text{ px}$)* | **$52 \times 36\text{ px}$**<br>*(Tổng $72 \times 40\text{ px}$)* | **$104 \times 72\text{ px}$**<br>*(Tổng $144 \times 80\text{ px}$)* | **$96 \times 96\text{ px}$**<br>*(hoặc $128 \times 128$ Master)* | **APPROVED (TASK-007)**: Giữ nguyên aspect ratio $1.84:1$, không kéo giãn. Bắt buộc có **Rim light hổ phách nhẹ** trên mai lưng để tách khỏi nền đất. |
| **Kiến lính (Soldier Ant)** | $36 \times 24$ (sải chân 44) | $36 \times 24\text{ px}$ | $72 \times 48\text{ px}$ | $144 \times 96\text{ px}$ | **$128 \times 128\text{ px}$** | Đầu to, kìm khỏe, tương phản rõ rệt với kiến thợ. |
| **Kiến chúa (Queen Ant)** | $58 \times 36$ | $58 \times 36\text{ px}$ | $116 \times 72\text{ px}$ | $232 \times 144\text{ px}$ | **$256 \times 256\text{ px}$** | Bụng chúa to bóng, sọc đốt hổ phách rực rỡ. |
| **Trứng kiến (Ant Egg)** | $8 \times 5$ | $8 \times 5\text{ px}$ | $16 \times 10\text{ px}$ | $32 \times 20\text{ px}$ | **$32 \times 32\text{ px}$** | Trắng đục ngọc trai, phát sáng nhẹ trong buồng ươm. |
| **Ấu trùng kiến (Larva)** | $18 \times 12$ | $18 \times 12\text{ px}$ | $36 \times 24\text{ px}$ | $72 \times 48\text{ px}$ | **$64 \times 64\text{ px}$** | Trong suốt mờ đục, phân đốt rõ ràng. |
| **Ong thợ (Worker Bee)** | $28 \times 20$ (sải cánh 36) | $28 \times 20\text{ px}$ | $56 \times 40\text{ px}$ | $112 \times 80\text{ px}$ | **$128 \times 128\text{ px}$** | Ngực lông vàng nhung, cánh bán trong suốt. |
| **Ong chúa (Queen Bee)** | $50 \times 30$ | $50 \times 30\text{ px}$ | $100 \times 60\text{ px}$ | $200 \times 120\text{ px}$ | **$256 \times 256\text{ px}$** | Bụng thon dài vương giả, sọc vàng đen sang trọng. |
| **Bánh tổ lục giác (Comb)** | $R = 20$ ($W:40, H:34.6$) | $40 \times 35\text{ px}$ | $80 \times 70\text{ px}$ | $160 \times 140\text{ px}$ | **$128 \times 128\text{ px}$** | Đáy sáp vàng óng, phản quang giọt mật ong. |
| **Hoa cỏ dại (Wildflowers)** | Cao $28 – 44$ | Cao $28 – 44\text{ px}$ | Cao $56 – 88\text{ px}$ | Cao $112 – 176\text{ px}$ | **$128 \times 128\text{ px}$** | Hoa cỏ ba lá trắng, hoa chuông xanh, cúc dại. |
| **Thân sồi cổ thụ (Trunk)** | $380 \times 640$ | $380 \times 640\text{ px}$ | $760 \times 1280\text{ px}$ | $1520 \times 2560\text{ px}$ | **$760 \times 1280\text{ px}$** | Rêu phong bám vỏ cây, hốc bọng tự nhiên. |
| **Cành bạnh ngang sồi** | $600 \times 180$ | $600 \times 180\text{ px}$ | $1200 \times 360\text{ px}$ | $2400 \times 720\text{ px}$ | **$1200 \times 360\text{ px}$** | Điểm treo tổ ong và đường kiến di chuyển. |
| **Vòm tán lá (Canopy Clump)**| $240 \times 240$ | $240 \times 240\text{ px}$ | $480 \times 480\text{ px}$ | $960 \times 960\text{ px}$ | **$512 \times 512\text{ px}$** | Parallax tạo chiều sâu ánh nắng xuyên qua lá. |
| **Texture đất mùn (Loam)** | Tile $128 \times 128$ | Tile $128 \times 128\text{ px}$ | Tile $256 \times 256\text{ px}$ | Tile $512 \times 512\text{ px}$ | **$512 \times 512\text{ px}$** | **ART REVISION REQUIRED**: Cần giảm tương phản của sỏi to/rễ khô để khử hiện tượng đốm lặp nhân tạo (grid repetition). |
| **Cá nhỏ ven hồ (Minnow)** | $22 \times 12$ | $22 \times 12\text{ px}$ | $44 \times 24\text{ px}$ | $88 \times 48\text{ px}$ | **$64 \times 64\text{ px}$** | Thân ánh bạc trong suốt lướt trên mặt nước. |
| **Cá lớn đáy hồ (Carp)** | $64 \times 32$ | $64 \times 32\text{ px}$ | $128 \times 64\text{ px}$ | $256 \times 128\text{ px}$ | **$256 \times 128\text{ px}$** | Vảy vàng cam đậm chất thủy sinh đầm lầy. |
| **Vịt trời (Mallard Duck)** | $48 \times 36$ | $48 \times 36\text{ px}$ | $96 \times 72\text{ px}$ | $192 \times 144\text{ px}$ | **$128 \times 128\text{ px}$** | Đầu xanh lục bảo bơi lướt sóng nước. |
| **Icon UI thanh công cụ** | $32 \times 32$ | $44 \times 44\text{ px}$ (màn hình) | Cố định theo HUD | Cố định theo HUD | **$128 \times 128\text{ px}$** | Vector SVG / Hi-res PNG. |

---

## 5. BẢNG PHÂN CẤP CAMERA ZOOM & CHI TIẾT LOD (ZOOM / LOD MATRIX — REVISED)

Viewport tham chiếu: $1920 \times 1080$ (tối thiểu tương thích: $1280 \times 720$).

```
[0.25x - 0.5x Macro]  ──>  [1.0x Normal Play]  ──>  [2.0x Chamber]  ──>  [4.0x Micro Detail]
Toàn cảnh sinh quyển       Đào hầm, ong thụ phấn     Xem buồng chúa, ấu trùng  Soi râu, cánh, vân đất
```

| Cấp Độ Zoom | Phạm Vi Scale | Tầm Nhìn Viewport | Chiến Lược LOD & Tối Ưu Render | Trải Nghiệm Mục Tiêu Của Người Chơi |
| :--- | :--- | :--- | :--- | :--- |
| **LOD 0: Macro Overview** | `0.25x – 0.5x` | Toàn bộ sinh quyển $1920\times 1440$ gói gọn trong màn hình | - Ẩn vi chuyển động chân lẻ của kiến; gom nhóm kiến thành cụm luồng di chuyển.<br>- Đàn ong hiển thị dạng chấm sáng vàng óng bay lượn.<br>- Vách hầm ngầm hiển thị dạng đường contour tổng thể mượt mà.<br>- Giảm tần số tick animation môi trường xuống 15 FPS.<br>- Gom draw calls toàn bộ địa hình vào 1 render target. | Nắm bắt toàn cục sinh thái: phân bố tài nguyên, luồng di chuyển giữa tổ ong và đồng hoa, cấu trúc mạng lưới hầm ngầm. |
| **LOD 1: Normal Gameplay (Mặc định)** | `0.85x – 1.25x` | Vùng rộng $1280 \times 720$ | - Hiển thị đầy đủ animation chân 6 khớp (Tripod gait) của kiến thợ ($18\times 14\text{ px}$).<br>- Ong thợ vỗ cánh tần số cao ($22\times 16\text{ px}$).<br>- Bánh tổ lục giác thấy rõ mực chứa mật và phấn hoa.<br>- Vách đất ngầm bo cong hữu cơ mềm mại (không lộ ô vuông).<br>- Tốc độ render chuẩn mượt mà 60 FPS. | Không gian chơi chính: Thao tác phát lệnh Đào, Lấp, Trồng hoa, Xây cầu, chỉ định thu hoạch. |
| **LOD 2: Chamber Inspection** | `1.8x – 2.5x` | Khu vực hẹp $640 \times 360$ (Khoảng 2–3 buồng tổ) | - Chuyển sang nạp texture phân giải cao ($2\times$ asset).<br>- Thấy rõ từng hạt trứng kiến, cử động đầu ấu trùng đòi ăn, ánh đèn lồng hắt sáng trên thớ đất ẩm.<br>- Râu kiến rung lắc giao tiếp tín hiệu pheromone.<br>- Nước hồ thấy rõ đáy cát sỏi và bọt khí li ti. | Quan sát chuyên sâu đời sống sinh học: Kiến chúa đẻ trứng, ong thợ mớm mật cho ấu trùng, nấm sợi nở hoa. |
| **LOD 3: Micro Inspection** | `3.0x – 4.0x` | Cực cận $320 \times 180$ (1 buồng tổ hoặc 1 cành hoa) | - Hiển thị nguyên gốc Master Source Resolution ($4\times$).<br>- Chi tiết từng sợi lông nhung trên ngực ong, màng cánh trong suốt phản xạ ánh sáng tím, hạt phấn hoa bám chân sau.<br>- Kiến thợ gặm từng vụn đất nhỏ, vảy đất rơi có bóng đổ.<br>- Không áp dụng blur/sharpen giả tạo; nét vẽ cọ kỹ thuật số sắc nét. | Chiêm ngưỡng mỹ thuật đỉnh cao, kiểm định chất lượng nghệ thuật của từng asset. |

---

## 6. KIẾN TRÚC ĐỊA HÌNH HỮU CƠ (ORGANIC TERRAIN RENDERING ARCHITECTURE)

- **Nguyên tắc cốt lõi:** Lưới $32\text{ px}$ chỉ phục vụ logic mô phỏng (Simulation Grid), **KHÔNG BAO GIỜ** render ra các ô vuông gạch đất (Checkerboard/Tile popping).
- **Quy trình dựng hình địa hình 3 lớp:**
  1. *Lớp 1 — Continuous Soil Loam Layer:* Render texture đất liền mạch kích thước lớn $512\times 512\text{ px}$ (tileable) trải đều toàn bộ diện tích lòng đất ($1920 \times 800\text{ px}$).
  2. *Lớp 2 — Dynamic Occupancy Mask & Bézier Smoothing:* Grid dữ liệu lưu trạng thái rỗng/đặc. Khi render, hệ thống nội suy các điểm tiếp giáp bằng đường cong Bézier hoặc Marching Squares để tạo ra đường contour hang hầm uốn lượn tự nhiên, tự động làm mềm mép vách đất.
  3. *Lớp 3 — Earthen Rim & Ambient Lantern Glow:* Viền vách đất được bổ sung lớp texture mép đất nén chặt (compacted earthen rim), rễ cây li ti bám tường và ánh sáng đèn lồng màu hổ phách (`#FFB703`) hắt sáng nhẹ nhàng vào lòng hang.

---

## 7. DANH MỤC THAM CHIẾU NGHỆ THUẬT CHÍNH THỨC (VISUAL BIBLE REFERENCES)

Toàn bộ 8 bức ảnh concept trong thư mục `art_direction/THE_VIVARIUM_ART_DIRECTION/references/` được xác lập vai trò chuẩn tắc:
- `01_world_overview.png`: **Primary World Benchmark** — Chuẩn mực bố cục tổng thể, tỷ lệ không gian giữa đại ngàn và lòng đất.
- `02_ancient_tree_bee_kingdom.png`: **Bee Kingdom Benchmark** — Cấu trúc tổ ong đa tầng trong bọng cây, cầu treo gỗ và thác nước.
- `03_ant_colony.png`: **Subterranean Formicarium Benchmark** — Hình thái buồng tổ hữu cơ, vườn nấm, buồng ấu trùng và ánh sáng đèn lồng.
- `04_lake_wildlife.png`: **Aquatic Wildlife Benchmark** — Độ trong suốt của nước, đàn cá, vịt trời và thảm thực vật ven hồ.
- `05_storm_survival.png`: **Extreme Weather Benchmark** — Cơn bão nhiệt đới, hiệu ứng mưa gió và phản ứng của sinh thái.
- `06_four_seasons.png`: **Seasonal Variations Benchmark** — Bảng chuyển đổi màu sắc Xuân, Hạ, Thu, Đông.
- `07_night_world.png`: **Nocturnal Lighting Benchmark** — Ánh trăng đêm, đom đóm và nấm phát quang sinh học.
- `08_expanded_bee_tree.png`: **Arboreal Expansion Benchmark** — Các pha phát triển mở rộng bánh tổ tự nhiên ngoài cành.
