# THE VIVARIUM — ASSET SPECIFICATION (TECHNICAL STANDARD v1.0)

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Phiên bản:** v1.0 (Revision theo chỉ đạo DIRECTOR TASK-002)  
> **Trạng thái:** DRAFT HOÀN THIỆN — CHỜ PHÊ DUYỆT (PROPOSED STATUS)  
> **Áp dụng cho:** Toàn bộ quá trình sản xuất sprite, atlas, mesh và UI của dự án.  

---

## 1. TIÊU CHUẨN XUẤT FILE ĐỒ HỌA (DELIVERY STANDARDS)

- **Định dạng file:** 
  - Sprite tĩnh & Frame chuỗi: `PNG-24 (RGBA)` với kênh Alpha 8-bit trong suốt hoàn toàn.
  - Tuyệt đối không dùng JPEG cho sprite sinh vật, cây cối, buồng tổ hay bất kỳ thành phần tách lớp nào.
  - Nền phải là trong suốt 100% (Pure Transparent), không có viền màu trắng/đen dư thừa (Bleed/Fringe artifact) do nén hoặc cắt thô.
- **Không gian màu:** `sRGB`.
- **Biên an toàn (Safe Margin / Bleed Padding):**
  - Mọi sprite khi cắt xuất khẩu sang Sprite Sheet hoặc Texture Atlas phải có đúng `2px padding` trong suốt ở cả 4 cạnh để ngăn ngừa triệt để hiện tượng lem vân (Texture Bleeding) trong pipeline WebGL / PixiJS v8.

---

## 2. QUY CHUẨN ĐỘ PHÂN GIẢI CANVAS GỐC THEO TỪNG DANH MỤC ASSET (REVISED)

Dự án **KHÔNG** cào bằng mọi asset vào canvas $64 \times 64\text{ px}$. Mỗi nhóm đối tượng được quy định kích thước Canvas gốc (Master Source Resolution) độc lập dựa trên kích thước cơ thể và độ chi tiết vi mô cần hiển thị:

| Nhóm Đối Tượng | Danh Mục Cụ Thể | Kích Thước Canvas Gốc (Master Source) | Kích Thước Render Logic (1.0x Zoom) | Hệ Số Scale Tối Đa Khi Zoom 4.0x | Định Dạng Đóng Gói (Packaging) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Côn trùng nhỏ** | **Kiến thợ (Worker Ant)** | **$96 \times 96\text{ px}$**<br>*(hoặc $128 \times 128$ Master)* | **$26 \times 18\text{ px}$ (Thân)**<br>*(Tổng sải chân $36 \times 20\text{ px}$)* | $1.4\times – 1.8\times$ | Sprite Sheet 8 hướng<br>*(Yêu cầu **Rim light hổ phách**)* |
| **Côn trùng chiến đấu**| Kiến lính (Soldier Ant)| **$128 \times 128\text{ px}$** | $36 \times 24\text{ px}$ (sải chân 44) | $1.23\times$ | Sprite Sheet 8 hướng |
| **Côn trùng hoàng gia**| Kiến chúa (Queen Ant) | **$256 \times 256\text{ px}$** | $58 \times 36\text{ px}$ | $1.45\times$ | Layered Rig / Sprite Sheet |
| **Giai đoạn ấu trùng** | Trứng kiến (Egg) | **$32 \times 32\text{ px}$** | $8 \times 5\text{ px}$ | $1.33\times$ | Cụm tĩnh (Cluster) |
| **Giai đoạn ấu trùng** | Ấu trùng kiến (Larva) | **$64 \times 64\text{ px}$** | $18 \times 12\text{ px}$ | $1.14\times$ | Sprite Sheet 4 frame |
| **Côn trùng bay** | Ong thợ (Worker Bee) | **$128 \times 128\text{ px}$** | $28 \times 20\text{ px}$ (cánh 36px) | $1.45\times$ (rõ vân cánh) | Sprite Sheet 6 frame vỗ |
| **Côn trùng bay hoàng gia**| Ong chúa (Queen Bee) | **$256 \times 256\text{ px}$** | $50 \times 30\text{ px}$ | $1.60\times$ | Sprite Sheet hoàng gia |
| **Tổ ong sáp** | Ô bánh tổ lục giác | **$128 \times 128\text{ px}$** | $40 \times 34.6\text{ px}$ ($R = 20\text{ px}$) | $0.80\times$ (cực kỳ sắc nét) | Modular Tile Kit |
| **Thực vật nhỏ** | Bụi cỏ & Hoa dại | **$128 \times 128\text{ px}$** | Cao $28 – 44\text{ px}$ | $1.0\times$ | Modular Flora Pack |
| **Cổ thụ lớn** | Thân sồi đại thụ (Trunk)| **$760 \times 1280\text{ px}$** | $380 \times 640\text{ px}$ | $0.5\times$ (Texture Mesh) | Sliced Layered Mesh |
| **Cổ thụ lớn** | Cành bạnh ngang sồi | **$1200 \times 360\text{ px}$** | $600 \times 180\text{ px}$ | $0.5\times$ | Modular Tree Bough |
| **Tán lá** | Vòm tán lá sồi | **$512 \times 512\text{ px}$** | $240 \times 240\text{ px}$ | $0.53\times$ | Parallax Foliage Clump |
| **Vật liệu địa tầng** | Texture đất mùn (Loam)| **$512 \times 512\text{ px}$** | $128 \times 128\text{ px}$ (Tileable) | $1.0\times$ (Seamless pattern)| **ART REVISION REQUIRED**<br>Khử đốm lặp nhân tạo |
| **Thủy sinh nhỏ** | Cá nhỏ bầy đàn | **$64 \times 64\text{ px}$** | $22 \times 12\text{ px}$ | $0.88\times$ | Sprite Sheet 6 frame |
| **Thủy sinh lớn** | Cá chép hồ lớn | **$256 \times 128\text{ px}$** | $64 \times 32\text{ px}$ | $1.14\times$ | Sprite Sheet 8 frame |
| **Chim muông** | Vịt trời bơi hồ | **$128 \times 128\text{ px}$** | $48 \times 36\text{ px}$ | $0.76\times$ | Sprite Sheet 8 frame |
| **Giao diện người dùng**| Icon HUD & Buttons | **$128 \times 128\text{ px}$** | $44 \times 44\text{ px}$ | $0.86\times$ (Fixed Screen Size)| Vector SVG / Hi-res PNG |

---

## 3. QUY ĐỊNH TỌA ĐỘ TRỌNG TÂM (PIVOT / ANCHOR STANDARDS — PROPOSED)

Tọa độ chuẩn hóa `(X, Y)` chạy từ `(0.0, 0.0)` (góc trên bên trái) đến `(1.0, 1.0)` (góc dưới bên phải):

```
(0,0) ─────────────── (0.5,0) ─────────────── (1,0)
  │                                             │
  │                      ▲                      │
(0,0.5) ───────────── (0.5,0.5) ─────────── (1,0.5)  <-- Ong, Cá, Bánh tổ
  │                   [Trọng tâm bay]           │
  │                                             │
(0,0.85) ──────────── (0.5,0.85) ────────── (1,0.85) <-- Kiến bò (chân chạm đất)
  │                                             │
(0,1.0) ───────────── (0.5,1.0) ─────────── (1,1.0)  <-- Hoa, Cây cối (gốc cắm đất)
```

- **Côn trùng bò trên mặt đất/vách hầm (Kiến thợ, Kiến lính, Bọ):** `Pivot (0.50, 0.85)`  
  *Nguyên lý:* Điểm tiếp xúc của các khớp chân với mặt đất nằm ở 85% chiều cao sprite, giúp kiến bám sát bề mặt uốn lượn của đường hầm hữu cơ khi leo dốc hay lộn ngược trần hầm mà không bị hẫng chân hoặc thụt vào trong vách đất.
- **Kiến chúa (Queen Ant):** `Pivot (0.50, 0.80)`  
  *Nguyên lý:* Bụng to nằm bẹp xuống sàn buồng chúa, trọng tâm thấp tạo cảm giác uy nghi, nặng nề.
- **Côn trùng bay trên không (Ong thợ, Ong chúa, Bướm, Chuồn chuồn):** `Pivot (0.50, 0.50)`  
  *Nguyên lý:* Tâm khối ngực (Thorax) là trọng tâm vật lý của cơ thể khi bay lượn, cho phép xoay góc nghiêng mượt mà theo vector vận tốc bay mà không bị văng tâm.
- **Thực vật cắm đất (Cây sồi, Cỏ, Hoa dại, Nấm):** `Pivot (0.50, 1.00)`  
  *Nguyên lý:* Gốc rễ cắm cố định vào tọa độ mặt đất, phần thân và hoa phía trên có thể đung đưa lắc lư tự nhiên theo lực gió mà gốc không bị xê dịch khỏi mặt đất.
- **Bánh tổ lục giác (Comb Cells):** `Pivot (0.50, 0.50)`  
  *Nguyên lý:* Tâm đối xứng hình học lục giác đều, giúp giải thuật ghép ô theo trục Axial Hex Grid $(q, r)$ hoàn toàn trùng khớp không sai lệch 1 pixel.
- **Thủy sinh (Cá nhỏ, Cá lớn):** `Pivot (0.40, 0.50)`  
  *Nguyên lý:* Nằm ở phần vây ngực gần đầu, giúp đuôi cá phía sau có biên độ dao động vẫy sóng tự nhiên khi bơi.
- **Thủy cầm mặt nước (Vịt trời):** `Pivot (0.50, 0.85)`  
  *Nguyên lý:* Trùng với đường ngấn nước (waterline) của mặt hồ để thân vịt nổi một nửa và chân vịt chìm dưới nước.

---

## 4. QUY ƯỚC ĐẶT TÊN FILE CHUẨN HÓA (NAMING CONVENTION — PROPOSED)

Cấu trúc định danh duy nhất:  
`{nhóm}_{loài/đối_tượng}_{vai_trò}_{hành_động}_{hướng}_{frame:03}.png`

### 4.1. Nhóm Sinh Vật (Characters: `char_`)
- `char_ant_worker_walk_east_001.png` $\rightarrow$ `char_ant_worker_walk_east_008.png`
- `char_ant_worker_dig_down_001.png` $\rightarrow$ `char_ant_worker_dig_down_006.png`
- `char_ant_worker_carry_mud_east_001.png`
- `char_ant_soldier_idle_east_001.png`
- `char_ant_queen_idle_001.png` $\rightarrow$ `char_ant_queen_idle_004.png`
- `char_ant_egg_cluster_001.png`
- `char_ant_larva_breathe_001.png` $\rightarrow$ `char_ant_larva_breathe_004.png`
- `char_bee_worker_fly_east_001.png` $\rightarrow$ `char_bee_worker_fly_east_006.png`
- `char_bee_worker_harvest_001.png` $\rightarrow$ `char_bee_worker_harvest_004.png`
- `char_bee_queen_idle_001.png`

### 4.2. Nhóm Môi Trường & Thực Vật (Environment: `env_`)
- `env_tree_ancient_trunk.png`
- `env_tree_bough_moss_left.png`
- `env_tree_roots_deep_cluster.png`
- `env_foliage_canopy_cluster_01.png`
- `env_flower_clover_white.png`
- `env_flower_daisy_golden.png`
- `env_flower_bluebell_purple.png`
- `env_shroom_white_garden_cluster.png`

### 4.3. Nhóm Bánh Tổ & Địa Hình (Colony & Terrain: `comb_`, `terrain_`)
- `comb_hex_empty_wax.png`
- `comb_hex_nectar_half.png`
- `comb_hex_honey_capped.png`
- `comb_hex_pollen_store.png`
- `comb_hex_brood_larva.png`
- `terrain_soil_dark_loam_tileable_512.png`
- `terrain_soil_clay_strata_512.png`
- `terrain_earthen_rim_edge_atlas.png`
- `terrain_stone_boulder_embedded_01.png`
- `terrain_subterranean_lantern_glow.png`

### 4.4. Nhóm Động Vật Khác (Wildlife: `wild_`)
- `wild_fish_minnow_swim_001.png` $\rightarrow$ `wild_fish_minnow_swim_006.png`
- `wild_fish_carp_swim_001.png` $\rightarrow$ `wild_fish_carp_swim_008.png`
- `wild_duck_mallard_swim_001.png` $\rightarrow$ `wild_duck_mallard_swim_008.png`

---

## 5. TIÊU CHUẨN NGHIỆM THU CHẤT LƯỢNG (QUALITY ACCEPTANCE GATES)

Mọi file asset đưa vào engine phải vượt qua 5 cổng kiểm định kỹ thuật:
1. **Alpha Channel Integrity:** Viền trong suốt 100%, không bị ám viền đen (dark halo) hoặc răng cưa do scale nội suy kém.
2. **In-Engine Resolution Test:** Kiểm tra trực tiếp trên engine tại 3 mốc zoom $1.0\times$, $2.0\times$ và $4.0\times$. Đảm bảo tại $4.0\times$ các nét vẽ tay hand-painted vẫn mịn màng, không bị vỡ hạt pixel.
3. **Palette Adherence:** Giá trị màu sắc nằm trong giới hạn base/highlight/shadow của VISUAL_BIBLE.md.
4. **Animation Stability:** Chuyển động lặp (looping) không bị giật, trọng tâm pivot cố định, không bị trượt chân trên bề mặt di chuyển.
5. **Ký duyệt (Sign-off):** Cập nhật trạng thái `APPROVED` trong `ASSET_MANIFEST.csv` trước khi tích hợp vào scene chính thức.
