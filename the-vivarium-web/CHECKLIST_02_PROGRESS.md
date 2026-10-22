# THE VIVARIUM — CHECKLIST 02 PROGRESS TRACKER
## PHÂN HỆ MÔI TRƯỜNG & THẾ GIỚI TỰ NHIÊN (ENVIRONMENT & BIOMES)

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Cơ chế:** Director Workflow (Project Owner: USER | Game Director: CHATGPT | Technical Developer: ANTIGRAVITY)  
> **File quản lý:** `CHECKLIST_02_PROGRESS.md`  
> **Khởi tạo:** 2026-10-19 (DIRECTOR TASK-009)  
> **Trạng thái phân hệ:** **IN PROGRESS (10%)** (Checklist 01 đã đóng 100%, 01 asset đất mùn V2 đã nghiệm thu)

---

## 1. TIÊU CHÍ NGHIỆM THU TỔNG QUAN (ACCEPTANCE GATES)
Mọi asset môi trường phải thỏa mãn 6 cổng nghiệm thu kỹ thuật:
- **AG-01 (Tách lớp độc lập):** Không dùng tranh concept nguyên tấm làm background tĩnh. Tất cả tán lá, thân cây, rễ, hoa cỏ, vách hang, hồ nước phải là sprite riêng biệt có alpha sạch 100%.
- **AG-02 (Seamless & Anti-Grid):** Địa hình đất, cát, bùn khi ghép lại không được lộ ô vuông hay gờ phân cách (Seam difference = 0.0 px).
- **AG-03 (Tương thích LOD 4 Mức):** Sắc nét ở $1.0\times, 2.0\times, 4.0\times$ nhờ source artwork chuẩn canvas (không mờ nhòe bilinear blur).
- **AG-04 (Hữu cơ hóa vách hang):** Vách hang buồng tổ đào bới phải dùng viền hữu cơ (Organic Earthen Rim / Marching Squares), tuyệt đối không để lộ răng cưa ô vuông thô ráp.
- **AG-05 (Tuân thủ Base Palette):** Màu sắc hòa hợp với bảng màu VISUAL_BIBLE.md (vỏ cây `#2A1810`, rêu `#588157`, lá `#2D6A4F`, nước `#2A6F97` $\rightarrow$ `#0F2A3F`).
- **AG-06 (Hiệu năng 60 FPS):** Ghép cảnh đa tầng (Parallax) không làm sụt giảm khung hình trên WebGL / PixiJS v8.

---

## 2. DANH MỤC ASSET PACKS PHÂN KỲ SẢN XUẤT

```
[PACK-001 (Đã duyệt)] ──> [PACK-002: Vertical Slice Cơ Bản] ──> [PACK-003: Địa Tầng & Hang] 
                                       │                                    │
                                       ▼                                    ▼
                          [PACK-004: Thủy Sinh & Hoa Lá]   ──> [PACK-005: Khí Quyển & Thời Tiết]
                                                                            │
                                                                            ▼
                                                               [PACK-006: Multi-Biome Mở Rộng]
```

### PACK-001: Nền tảng vật liệu (ĐÃ DUYỆT 100%)
- [x] `ENV-TERRAIN-LOAM-V2` (`terrain_soil_dark_loam_v2.png`) — **APPROVED** (TASK-008 PASS)

---

### PACK-002-A: Cây Sồi Cổ Thụ Đa Lớp (Ancient Oak - V2 QA EVALUATION)
*Đợt kiểm thử bản V2 trích xuất (THE_VIVARIUM_PACK_002A_V2_QA). Xem chi tiết tại [ASSET_PACK_002A_CONTRACT.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/ASSET_PACK_002A_CONTRACT.md).*

| Asset ID | Tên File Bàn Giao | Canvas Nguồn | Bounding Box Thực | Pivot | Z-Layer | Trạng thái QA | Ghi chú kỹ thuật & Lỗi mỹ thuật |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `ENV-TREE-TRUNK-BASE` | `env_tree_ancient_trunk_base_v2.png`| $760 \times 800$ | $723 \times 570\text{ px}$ | `(0.50, 1.00)` | Z: 40 | **CONDITIONAL PASS** | Cải thiện vượt bậc: Đáy chạm sát $Y=794$, bề rộng $723\text{ px}$ phủ kín. Điểm cắt đỉnh ($Y=225$) cần cành bough V2 phủ đè để che. |
| `ENV-TREE-BOUGH-MAIN` | `env_tree_bough_main_moss_v2.png` | $1200 \times 360$ | $600 \times 343\text{ px}$ | `(0.15, 0.65)` | Z: 45 | **CONDITIONAL PASS** | Chiều cao chạm sát biên ($343/360\text{ px}$). Chiều ngang đạt $600\text{ px}$ (đủ làm nhánh chính, nhưng chưa vươn hết $1200\text{ px}$). |
| `ENV-CANOPY-CLUMP-01` | `env_foliage_canopy_clump_01_v2.png`| $512 \times 512$ | $487 \times 394\text{ px}$ | `(0.50, 0.50)` | Z: 20 & 70 | **PASS** | Tán lá sắc nét, xanh sồi `#2D6A4F` tự nhiên, phủ kín $95\%$ chiều ngang canvas. |
| `ENV-TREE-ROOT-DEEP` | `env_tree_root_deep_cluster_v2.png` | $640 \times 920$ | $610 \times 382\text{ px}$ | `(0.50, 0.00)` | Z: 35 | **CONDITIONAL PASS** | Đỉnh rễ chạm sát mép $Y=4$, bề rộng $610\text{ px}$ nối khít 100% với đáy thân $723\text{ px}$. Tuy nhiên rễ chỉ sâu $382/920\text{ px}$ (cần nối tiếp rễ tầng sâu ở Pack 003). |

> **KẾT LUẬN PACK-002-A V2 (TASK-012 VERTICAL SLICE PROTOTYPE):** **PASS CHO GIAI ĐOẠN DỰNG PROTOTYPE VERTICAL SLICE**.  
> Scene độc lập `?mode=environment-preview` đã dựng thành công với Bầu trời procedural gradient, Cây sồi 4 lớp V2 liền mạch, Mặt cắt lòng đất đất mùn V2, Kiến thợ V2 36.8px.

### KẾT QUẢ TRIỂN KHAI TASK-013 — ORGANIC TERRAIN FOUNDATION (2026-10-20)
- [x] **Mặt đất hữu cơ uốn lượn:** Thay thế đường ngang phẳng bằng đường cong địa hình nhấp nhô tự nhiên (harmonic surface profile); gốc sồi tự động neo chặt vào độ dốc đất, không bị lơ lửng.
- [x] **Phân tách Simulation Grid (32px):** Ô lưới logic 32px quản lý đào/lấp độc lập hoàn toàn với hình học render; tuyệt đối không xuất hiện các cạnh ô vuông thô ráp.
- [x] **Hệ thống Hang & Buồng tổ hữu cơ:** Dựng hầm cong chữ S và buồng ấp trứng/chúa hình tròn không đều (irregular oval); vách đất bo cong mượt mà bằng contour masking.
- [x] **Viền đất Earthen Rim & Khử lặp Tiling:** Viền đất sần sùi với hạt sỏi vi mô; áp dụng 2 lớp Tiling Sprite với offset lệch 37px khử hiện tượng lặp mắt của texture mùn.
- [x] **Công cụ Đào & Lấp tương tác:** Tích hợp trực tiếp bút Đào (Dig) và Lấp (Fill) trên scene; render cập nhật tức thời dạng vết cắt hữu cơ mềm mại.
- [x] **Hiệu năng thực tế đo đạc in-engine:** Đạt **59 – 60 FPS** ổn định liên tục trên Chrome Puppeteer / WebGL PixiJS v8.

### KẾT QUẢ TRIỂN KHAI TASK-014 — ORGANIC CAVE RENDERER CORRECTION (2026-10-20)
- [x] **Xóa bỏ hoàn toàn lỗi vòng tròn đen riêng lẻ (Zero Ring Artifacts):** Loại bỏ hoàn toàn vòng tròn stroke vẽ quanh từng ô lưới; vách hang chỉ vẽ theo contour tiếp giáp duy nhất giữa đất đặc và khoảng rỗng.
- [x] **Unified Cave Void Mask (Lòng hang rỗng liên tục):** Đào đất thực sự loại bỏ texture đất mùn khỏi lòng hang; các hầm đào cắt nhau hòa nhập thành một khoảng không gian rỗng thống nhất không vết cắt nối hay khe hở.
- [x] **Subterranean Cave Interior Rendering:** Lòng hang sở hữu nền tối màu đất trầm ấm (`#1d1009`) cùng quầng sáng đỏ quan sát (red observation light 660nm) dịu mắt; kiến thợ đứng vững trên sàn lòng hang mà không bị texture đất đè lên.
- [x] **Viền vách đất đa tầng liên tục (Marching Squares 16px Isosurface):** Đường biên vách hang được tạo bằng thuật toán Marching Squares trên sub-grid 16px với 3 lớp stroke: Contact shadow mờ sâu (`#080402`), Vách đất mùn (`#1f110a`) và Viền sáng (`#3d2719`), kèm sỏi vi mô phân bố tự nhiên.
- [x] **Xác thực hình học Đào/Lấp sống (Living Dynamic Geometry Test):** Bộ 3 screenshot cố định góc máy chứng minh số lượng cell thay đổi chính xác thời gian thực: Trước khi đào (2315 solid / 85 void) $\rightarrow$ Sau khi đào (2310 solid / 90 void) $\rightarrow$ Sau khi lấp (2313 solid / 87 void).
- [x] **Đóng gói bằng chứng & Kiểm định kỹ thuật:** Toàn bộ 7 screenshot nghiệm thu đã được lưu tại `QA/TASK-014/` và nén vào `TASK-014_VISUAL_EVIDENCE.zip`. Build production sạch 0 lỗi (`npm run build` PASS).

### KẾT QUẢ TRIỂN KHAI TASK-015 — ORGANIC CAVE VISUAL POLISH (2026-10-20)
- [x] **Trạng thái phê duyệt:** **TASK-015 PASS PROTOTYPE (APPROVED FOR PROTOTYPE)**.
- [x] **Mịn hóa đường biên Marching Squares (Sub-grid 8px + Gaussian Kernel liên tục):** Loại bỏ triệt để hiện tượng bậc thang 32px; đường biên lòng hang giờ đây là các đường cong uốn lượn tự nhiên mềm mại như tranh vẽ tay sinh học (hand-painted organic 2D).
- [x] **Khử viền đen dạng ống — Mặt cắt đất thật (Soft Cutaway Shading):** Thay đổi toàn diện bảng màu đường biên: Giảm độ tương phản viền đen thô ráp, áp dụng 3 tầng bóng tiếp xúc đất ẩm tự nhiên gồm Contact Occlusion Shadow (`#160c07`, alpha 0.45), Compact Loam Rim (`#2e1a10`, alpha 0.75), và Peat Highlight sần sùi (`#4a2d1d`, alpha 0.65). Vách hang mang diện mạo mặt cắt lát đất tự nhiên, không còn cảm giác đường ống có viền bao.
- [x] **Quy hoạch 3 Không Gian Hang Kết Nối Liên Tục:**
  1. *Đường hầm vận chuyển hẹp (Narrow Transit Shafts):* Chiều cao hầm ~42-48px, vừa vặn với kích thước kiến 36.8×20px di chuyển dưới rễ cây.
  2. *Buồng sinh hoạt trung bình (Medium Living Chamber):* Rộng ~110px × cao ~80px, trữ thức ăn và ấp nhộng.
  3. *Buồng kiến chúa rộng (Spacious Royal Queen Chamber):* Rộng ~220px × cao ~130px, vòm trần cao với ánh sáng hổ phách ấm áp (`#6e240c` / `#9e3810`), sàn lòng buồng phẳng uốn nhẹ để đàn kiến quần tụ.
- [x] **Kiểm định Tỷ Lệ Sinh Học & Tư Thế Đứng (Biological Scale Probe):** Bố trí 5 cá thể kiến thợ V2 (sải 36.8px) tại các vị trí: (1) Mặt đất, (2) Hầm hẹp, (3) Buồng sinh hoạt, (4) Buồng hoàng gia, (5) Kiến thợ chăm sóc chúa. Toàn bộ chân kiến đứng vững vàng trên sàn lòng hang, không bị chìm hay đè bởi texture đất.
- [x] **Đóng gói bằng chứng & Kiểm định kỹ thuật:** 6 screenshot chất lượng cao được lưu tại `QA/TASK-015/` và nén thành công vào `TASK-015_VISUAL_EVIDENCE.zip`. Production build sạch sẽ (`npm run build` PASS).
- [!] **Ghi nhận 3 tồn đọng mỹ thuật chờ hoàn thiện các task sau (Backlog Art Issues - Không sửa ở TASK-016):**
  1. *Shading ô vuông trong hang:* Vùng lòng hang vẫn còn vết bóng mờ của các khối ô lưới 32px khi vẽ nền amber/red glow.
  2. *Viền vách đều:* Độ gồ ghề của vách đất cần thêm biến thiên hình học vi mô tự nhiên hơn ở các giai đoạn sau.
  3. *Nội thất hang còn trống:* Cần bổ sung các chi tiết sinh thái buồng tổ (trứng, ấu trùng, rễ cây đâm xuyên trần vòm, hạt giống dự trữ) ở các đợt phát triển tiếp theo.

---

### PACK-002-B1: Mặt Đất & Thảm Thực Vật Tầng Thấp (KẾT QUẢ KIỂM THỬ TÍCH HỢP PROTOTYPE QA)
| Asset ID | Tên File Quy Chuẩn | Canvas Nguồn | Bounding Box Thực | Tọa Độ Pivot | Z-Layer | Trạng Thái QA | Đánh Giá Chi Tiết & Tồn Đọng Mỹ Thuật |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `ENV-TERRAIN-SURFACE-GRASS` | `env_terrain_surface_grass.png` | $512 \times 96\text{ px}$ | $500 \times 90\text{ px}$ ($X: 6..505, Y: 4..93$) | `(0.50, 0.35)` | Z: 50 | **FAIL CHO PRODUCTION** / **CONDITIONAL PROTOTYPE** | **Lỗi nghiêm trọng:** 2 cạnh biên trái/phải ($X=0..5$ và $X=506..511$) rỗng hoàn toàn ($A=0$), dẫn tới khoảng hở $12\text{ px}$ trong suốt giữa các dải khi lặp ngang (không liền mạch/non-tileable). Texture đất dưới chân dải không ăn khớp với texture đất mùn `terrain_soil_dark_loam_v2`. |
| `ENV-GRASS-TUFT-GREEN` | `env_grass_tuft_green.png` | $128 \times 128\text{ px}$ | $122 \times 105\text{ px}$ ($X: 3..124, Y: 21..125$) | `(0.50, 0.95)` | Z: 52 | **CONDITIONAL PASS PROTOTYPE** | Tỷ lệ hòa hợp ($64\times 64\text{ px}$ logic), viền alpha sạch không lộ caro. Tồn đọng: Bụi cỏ bị cắt phẳng ngang mép dưới ($Y=125$), cần cắm sâu xuống mặt đất $3\text{ px}$ để giấu vết cắt. |
| `ENV-FLOWER-CLOVER-WHITE` | `env_flower_clover_white.png` | $128 \times 128\text{ px}$ | $122 \times 91\text{ px}$ ($X: 3..124, Y: 35..125$) | `(0.50, 0.95)` | Z: 55 | **CONDITIONAL PASS PROTOTYPE** | Cánh hoa trắng giữ chi tiết khá, không bị chroma key ăn lẹm nặng. Tồn đọng: Viền quanh chùm hoa có viền sáng nhẹ (faint halo) do trích xuất từ composite presentation, cuống hoa bị cắt cụt ở đáy. |
| `ENV-FLOWER-DAISY-GOLDEN` | `env_flower_daisy_golden.png` | $128 \times 128\text{ px}$ | $122 \times 113\text{ px}$ ($X: 3..124, Y: 13..125$) | `(0.50, 0.95)` | Z: 55 | **CONDITIONAL PASS PROTOTYPE** | Hoa cúc vàng nổi bật, nhụy cam rực rỡ, tỷ lệ cân đối khi đặt cạnh kiến thợ V2 ($36.8\text{ px}$). Tồn đọng: Cuống hoa bị cụt ngang đáy, một số cánh hoa mảnh có viền tách nền hơi cứng. |

> **KẾT LUẬN CHUNG PACK-002-B1:** **CONDITIONAL PASS CHO PROTOTYPE ONLY — KHÔNG ĐẠT CHUẨN PRODUCTION**.  
> Cần bàn giao danh sách lỗi mỹ thuật để Game Director chỉ đạo vẽ độc lập / làm seamless dải cỏ ở đợt Polish tiếp theo.  
> Bằng chứng nghiệm thu 7 screenshots: `QA/TASK-017/TASK-017_VISUAL_EVIDENCE.zip`.

---

### PACK-002-B2: Hồ Nước, Ánh Sáng & Khí Quyển (Sản xuất đợt kế tiếp)
| Asset ID | Tên File Đề Xuất | Canvas Nguồn | Pivot | Trạng thái | Ghi chú nghiệm thu |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ENV-SKY-DAY-001` | `env_sky_day_gradient.png` | $1920 \times 640$ | `(0.5, 0.0)` | PENDING | Gradient nền trời xanh dịu ban ngày |
| `ENV-FLOWER-CLOVER-01`| `env_flower_clover_white.png` | $128 \times 128$ | `(0.5, 1.0)` | PENDING | Cỏ ba lá trắng (thực phẩm của ong) |
| `ENV-FLOWER-DAISY-01` | `env_flower_daisy_golden.png` | $128 \times 128$ | `(0.5, 1.0)` | PENDING | Cúc dại nở rộ trên thảm cỏ |
| `ENV-GRASS-TUFT-01` | `env_grass_tuft_green.png` | $128 \times 128$ | `(0.5, 1.0)` | PENDING | Bụi cỏ nhung viền che mép đất |
| `ENV-TERRAIN-SURFACE-GRASS`| `env_terrain_surface_grass.png`| $512 \times 96$ | `(0.0, 0.5)` | PENDING | Dải mép cỏ mặt đất chuyển tiếp xuống lòng đất |
| `ENV-CAVE-WALL-RIM-ATLAS` | `env_cave_wall_rim_atlas.png` | $512 \times 512$ | `(0.5, 0.5)` | PENDING | Atlas bo viền hầm ngầm hữu cơ (khử ô vuông) |
| `ENV-LAKE-SURFACE-WAVE`| `env_lake_surface_wave.png` | $768 \times 96$ | `(0.0, 0.0)` | PENDING | Mặt nước lăn tăn gợn sóng phản chiếu |
| `ENV-LAKE-WATER-BODY` | `env_lake_water_body.png` | $768 \times 480$ | `(0.0, 0.0)` | PENDING | Khối nước trong chuyển từ lam sang thẫm |
| `ENV-LAKE-BANK-SLOPE` | `env_lake_bank_slope.png` | $360 \times 240$ | `(0.0, 0.0)` | PENDING | Bờ đất dốc thoai thoải ngập nước |
| `ENV-LIGHT-SUN-RAY-01`| `env_light_sun_ray_01.png` | $560 \times 840$ | `(0.5, 0.0)` | PENDING | Vệt nắng vàng rọi qua kẽ lá (Additive blend) |
| `ENV-LIGHT-CAVE-RED-GLOW`| `env_light_cave_red_glow.png` | $440 \times 440$ | `(0.5, 0.5)` | PENDING | Vùng sáng đỏ 660nm buồng tổ quan sát |

---

### PACK-003: Địa Tầng Nâng Cao & Hang Ngầm
- [ ] `ENV-TERRAIN-CLAY-01` (`env_terrain_clay_512.png`) — PENDING
- [ ] `ENV-TERRAIN-PEAT-01` (`env_terrain_peat_512.png`) — PENDING
- [ ] `ENV-TRANSITION-MASK-01` (`env_mask_organic_blend.png`) — PENDING
- [ ] `ENV-PEBBLE-EMBED-01` (`env_pebble_embedded.png`) — PENDING

---

### PACK-004: Thủy Sinh Chi Tiết & Thảm Thực Vật Mát Rừng
- [ ] `ENV-FLOWER-BLUEBELL-01` (`env_flower_bluebell.png`) — PENDING
- [ ] `ENV-MOSS-PATCH-01` (`env_moss_patch.png`) — PENDING
- [ ] `ENV-FERN-CLUSTER-01` (`env_fern_cluster.png`) — PENDING
- [ ] `ENV-LAKE-BOTTOM-MUD` (`env_lake_bottom_mud.png`) — PENDING
- [ ] `ENV-WATER-FALL-STREAM` (`env_waterfall_stream.png`) — PENDING

---

### PACK-005: Khí Quyển, Parallax Sâu & Thời Tiết
- [ ] `ENV-SKY-CLOUDS-001` (`env_sky_clouds_mid.png`) — PENDING
- [ ] `ENV-SKY-MNTN-001` (`env_sky_mountain_far.png`) — PENDING
- [ ] `ENV-CANOPY-CLUMP-02` (`env_canopy_sunlit.png`) — PENDING
- [ ] `ENV-CANOPY-LEAF-FALL` (`env_particle_leaf_fall.png`) — PENDING
- [ ] `ENV-FX-RAIN-DROP-01` (`env_particle_rain.png`) — PENDING

---

### PACK-006: Hệ Sinh Thái Đa Vùng (Multi-Biome World)
- [ ] `ENV-BIOME-DESERT-SAND` (`env_biome_desert_sand.png`) — PENDING
- [ ] `ENV-BIOME-SWAMP-MUCK` (`env_biome_swamp_muck.png`) — PENDING
