# THE VIVARIUM — ASSET PACK 002-A CONTRACT
## HỢP ĐỒNG KỸ THUẬT & QUY CHUẨN MỸ THUẬT: CÂY SỒI ĐẠI THỤ (ANCIENT OAK)

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Phân hệ:** CHECKLIST-02 — Environment (Môi trường)  
> **Gói sản xuất:** PACK-002-A (Đợt 1 của Asset Pack 002)  
> **Cơ chế thẩm quyền:** Project Owner: USER | Game Director: CHATGPT | Technical Developer: ANTIGRAVITY  
> **Trạng thái tài liệu:** **PENDING DIRECTOR APPROVAL**  

---

## 1. MỤC ĐÍCH & BẢN CHẤT KỸ THUẬT (TECHNICAL NATURE)
- **Kiến trúc đồ họa:** Đây là **2D Layered Sprites (Sprite 2D nhiều lớp phân tầng)** kết hợp alpha channel tách rời, **TUYỆT ĐỐI KHÔNG PHẢI 3D MESH** hay mô hình đa giác 3D.
- **Tính liên tục & Modular:** Cây đại thụ được ghép từ 4 bộ phận riêng biệt (Gốc/Thân, Cành bạnh ngang, Tán lá, Chùm rễ sâu) để engine có thể:
  1. Tạo chiều sâu thị sai (Parallax depth) khi camera di chuyển tự do.
  2. Cho phép ong bay trước/sau tán lá, kiến bò bám trên mặt vỏ cây và rễ.
  3. Neo giữ bánh tổ ong linh hoạt ở cành dưới.
  4. Tạo dao động gió độc lập (Sway shader) cho tán lá và cành mà gốc cây vẫn đứng vững.

---

## 2. BẢNG THÔNG SỐ KỸ THUẬT 4 ASSET (ASSET SPECIFICATION MATRIX)

| Tên File Bàn Giao | Mã Asset ID | Kích Thước Nguồn (Canvas Master) | Kích Thước Logic (World Units) | Tọa Độ Pivot `(X, Y)` | Z-Layer (Thứ Tự Vẽ) | Vùng Kết Nối (Seam Connection Zone) |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `env_tree_ancient_trunk_base.png` | `ENV-TREE-TRUNK-BASE` | **$760 \times 800\text{ px}$** | $380 \times 400\text{ units}$ | `(0.50, 1.00)` *(Gốc cắm mặt đất)* | `layer_tree_trunk` (Z: 40) | **Đỉnh thân ($Y: 0..100\text{ px}$):** Nối cành bạnh ngang.<br>**Đáy thân ($Y: 750..800\text{ px}$):** Nối chùm rễ ngầm tại $Y_{world}=640$. |
| `env_tree_bough_main_moss.png` | `ENV-TREE-BOUGH-MAIN` | **$1200 \times 360\text{ px}$** | $600 \times 180\text{ units}$ | `(0.15, 0.65)` *(Khớp nối chạc cây)*| `layer_tree_bough` (Z: 45) | **Gốc cành bên trái ($X: 0..200\text{ px}$):** Gối đè lên chạc chữ V của thân cây một đoạn $\approx 40\text{ px}$. |
| `env_foliage_canopy_clump_01.png`| `ENV-CANOPY-CLUMP-01` | **$512 \times 512\text{ px}$** | $256 \times 256\text{ units}$ | `(0.50, 0.50)` *(Tâm tán lá)* | Layer sau: `layer_canopy_back` (Z: 20)<br>Layer trước: `layer_canopy_front` (Z: 70) | Tán lá vẽ hữu cơ có lá tỉa rìa ngoài, xếp lớp so le (overlap) $30\% - 40\%$ che khuất đỉnh cành và thân. |
| `env_tree_root_deep_cluster.png` | `ENV-TREE-ROOT-DEEP` | **$640 \times 920\text{ px}$** | $320 \times 460\text{ units}$ | `(0.50, 0.00)` *(Đầu rễ cắm từ đáy gốc)*| `layer_tree_roots` (Z: 35) | **Đỉnh chùm rễ ($Y: 0..120\text{ px}$):** Cổ rễ loe rộng, nối khít vào đáy thân cây dưới lớp cỏ mặt đất. |

---

## 3. NGUYÊN TẮC GHÉP NỐI LIỀN MẠCH (SEAMLESS ASSEMBLY ARCHITECTURE)

Để loại bỏ triệt để hiện tượng hở khe, đường cắt ngang phẳng (hard cut line) hay sai lệch tỷ lệ vỏ cây giữa các file riêng biệt:

1. **Kỹ thuật Overlap Buffer (Đệm phủ đè $40 – 60\text{ px}$):**
   - Đỉnh của `env_tree_ancient_trunk_base` kết thúc bằng chạc chữ V tự nhiên, có vỏ cây gồ ghề và rêu loang lổ (không cắt ngang bằng thước kẻ).
   - Gốc cành `env_tree_bough_main_moss` có phần bạnh gỗ loe ra, đặt đè lên chạc thân một đoạn logic $\approx 30\text{ units}$ ($60\text{ px}$ nguồn). Vệt bóng đổ (contact shadow) được vẽ sẵn ở mặt dưới cành giúp khớp nối hòa quyện tự nhiên.
2. **Khớp nối Gốc - Rễ tại đường chân trời (Horizon Transition at $Y_{world} = 640$):**
   - Đáy thân cây loe rộng thành các múi rễ nổi trên mặt đất (buttress roots).
   - Đỉnh chùm rễ ngầm tiếp nối chính xác vào các múi rễ này.
   - Vùng chuyển tiếp này được che phủ bởi lớp cỏ mặt đất `env_terrain_surface_grass.png` và bụi cỏ `env_grass_tuft_green.png`, đảm bảo không nhìn thấy đường phân ranh giữa khí quyển và lòng đất.
3. **Độ đồng nhất chất liệu vỏ cây (Bark Texture Consistency):**
   - Toàn bộ thân, cành và rễ đều dùng chung Base Palette: Nền vỏ sồi sẫm `#2A1810`, rãnh nứt nâu xám `#1F120B`, highlight gờ gỗ `#6B4423`.
   - Lớp rêu nhung xanh `#588157` tập trung ở mặt trên của cành ngang và sườn đón sáng của thân cây.

---

## 4. SƠ ĐỒ GHÉP CÂY DẠNG VĂN BẢN (TEXT-BASED ASSEMBLY SCHEMATIC)

Thế giới hiển thị theo hệ trục tọa độ $Y$ tăng dần từ trên trời xuống lòng đất ($Y=0$ đỉnh trời, $Y=640$ mặt đất, $Y=1440$ đáy ngầm):

```
TỌA ĐỘ Y (World)                               CẤU TRÚC LẮP GHÉP CÂY SỒI CỔ THỤ
═══════════════════════════════════════════════════════════════════════════════════════════════════
[Y: 80 .. 340]        ┌────────────────────────────────────────────────────────┐
                      │   [ENV-CANOPY-CLUMP-01] (Layer sau: Z=20 & trước: Z=70) │
                      │   * Vòm tán lá sồi rung rinh theo gió, lọc tia nắng     │
                      └────────────────────────────┬───────────────────────────┘
                                                   │
[Y: 280 .. 460]            Khớp nối đè (Overlap)   │  (Mặt trên có rêu nhung mịn cho kiến leo)
                      ┌────────────────────────────▼────────────────────────────────────────────┐
                      │ [ENV-TREE-BOUGH-MAIN] (Z=45) ── Cành bạnh ngang lớn                      │
                      │ ◄ Gốc cành (X: 520)                    Đầu cành vươn ra (X: 1120) ►      │
                      │          │                                                              │
                      │          ▼ [VÙNG TRỐNG NEO TỔ ONG (BEEHIVE RESERVED ZONE)]              │
                      │          └─► Khoảng trống bên dưới cành: X ∈ [720, 960], Y ∈ [380, 520] │
                      └────────────────────────────┬────────────────────────────────────────────┘
                                                   │ Chạc thân chữ V đỡ cành (Overlap 40px)
[Y: 340 .. 640]                       ┌────────────▼───────────┐
                                      │ [ENV-TREE-TRUNK-BASE]  │
                                      │ Thân sồi đại thụ (Z=40)│  ◄── Kiến thợ/lính bò lên xuống
                                      │ Vỏ nứt, rêu phong      │      trên bề mặt vỏ cây (Z=50)
                                      └────────────┬───────────┘
═══════════════════════════════════════════════════╪═══════════════════════════════════════════════
[Y = 640]             ════════════════════════ Mặt Đất ════════════════════════════════════════════
                      [Mép cỏ & Rễ nổi] (Được che mờ tự nhiên bởi thảm cỏ hoa dại)
═══════════════════════════════════════════════════╪═══════════════════════════════════════════════
[Y: 640 .. 1100]                      ┌────────────▼───────────┐
                                      │ [ENV-TREE-ROOT-DEEP]   │  ◄── Đâm xuyên qua tầng đất mùn
                                      │ Chùm rễ ngầm sâu (Z=35)│      Kiến đào hầm luồn qua kẽ rễ
                                      │ Rễ cái & rễ tơ uốn lượn│      Buồng kiến né rễ cây
                                      └────────────────────────┘
```

---

## 5. THỨ TỰ LỚP Z-LAYER KHI SINH VẬT TƯƠNG TÁC (DEPTH & INTERACTION SORTING)

Quy định Z-Index chính xác từ xa đến gần để đảm bảo sinh vật hiển thị đúng chiều sâu thị giác:

```
[Xa nhất / Nền]                                                               [Gần nhất / Tiền cảnh]
Z: 10          Z: 20           Z: 30        Z: 35        Z: 40        Z: 45       Z: 50        Z: 60      Z: 70           Z: 80
Bầu trời  ──>  Tán lá sau  ──>  Đất ngầm ──> Rễ sồi  ──>  Thân sồi ──> Cành ngang ─> KIẾN BÒ ──> ONG BAY ─> Tán lá trước ─> Tia nắng
(Sky)         (Canopy Back)   (Loam)      (Roots)      (Trunk)      (Bough)     (Ants)      (Bees)    (Canopy Front)  (Sun Rays)
```

1. **Kiến di chuyển (`char_ant_worker` / Z: 50):**
   - Khi kiến bò dọc thân cây (`Z: 40`) hoặc cành ngang (`Z: 45`), kiến hiển thị **đè lên trên vỏ cây** (`Z: 50 > 45`), nhìn rõ 6 chân chạm bám vào gờ vỏ và rêu nhung.
   - Khi kiến chui vào sau tán lá trước (`Canopy Front` / `Z: 70`), kiến sẽ bị tán lá che khuất một phần, tạo chiều sâu thị giác chân thực.
2. **Ong bay lượn (`char_bee_worker` / Z: 60):**
   - Ong bay tự do ngoài không gian: Bay **trước thân cây và cành bạnh** (`Z: 60 > 45`).
   - Ong bay **trước tán lá sau** (`Z: 60 > 20`) nhưng **sau tán lá trước** (`Z: 60 < 70`), tạo cảm giác đàn ong đang bay luồn lách giữa các tầng lá sồi.
3. **Ánh nắng & Hiệu ứng khí quyển (Z: 80+):**
   - Luồng sáng rẻ quạt (`env_light_sun_ray_01`) phủ lên trên toàn bộ thân cây, lá và sinh vật theo chế độ Additive/Screen blend.

---

## 6. QUY ĐỊNH VÙNG TRỐNG NEO TỔ ONG (BEEHIVE RESERVED ZONE)

Cành sồi `env_tree_bough_main_moss` là vị trí sinh học cốt lõi để xây dựng **Vương quốc Ong (Bee Colony — Checklist 04)**:
- **Tọa độ neo khả dụng (World coordinates):** $X \in [720, 960]$, $Y \in [380, 520]$ (Ngay mặt dưới đoạn giữa của cành sồi).
- **Yêu cầu vẽ cành ngang (`env_tree_bough_main_moss`):**
  - Mặt trên cành ($Y$ nhỏ hơn): Hơi thoải, phủ thảm rêu nhung xanh để kiến và bọ có thể đi lại tuần tra.
  - Mặt dưới cành ($Y$ lớn hơn): Có đoạn gồ ghề dạng chạc gỗ hoặc mấu mắt tự nhiên ($X \approx 800\text{ units}$), đóng vai trò là "điểm bám vững chắc" để sau này gắn các cụm sáp ong lục giác (`comb_hex_...`) rủ xuống mà không có cảm giác lơ lửng vô lý.

---

## 7. CHIẾN LƯỢC ĐỘ PHÂN GIẢI & CHỐNG MỜ KHI ZOOM 1× – 4× (LOD PRESERVATION)

Để bảo đảm khi người chơi zoom cực đại $4.0\times$ (soi từng con rệp, mắt gỗ, sợi rêu) hình ảnh cây không bị vỡ hạt hay mờ nhòe:

1. **Tỷ lệ Master Canvas gấp $2\times$ kích thước logic:**
   - Thân cây logic $380 \times 400\text{ units}$ được vẽ trên canvas gốc **$760 \times 800\text{ px}$**.
   - Cành sồi logic $600 \times 180\text{ units}$ được vẽ trên canvas gốc **$1200 \times 360\text{ px}$**.
   - Chùm rễ logic $320 \times 460\text{ units}$ được vẽ trên canvas gốc **$640 \times 920\text{ px}$**.
   - Tán lá logic $256 \times 256\text{ units}$ được vẽ trên canvas gốc **$512 \times 512\text{ px}$**.
2. **Hệ số co giãn khi render (Screen Scale Matrix):**
   - Tại **Zoom 1.0x (Normal View):** Sprite được thu nhỏ xuống $50\%$ kích thước file gốc. Mật độ chi tiết cực cao, nét cọ vẽ tay mịn màng tuyệt đối.
   - Tại **Zoom 2.0x (Chamber/Bough View):** Sprite render đúng $100\%$ pixel gốc ($1:1$ pixel mapping). Độ nét đạt đỉnh điểm hoàn hảo.
   - Tại **Zoom 4.0x (Micro Detail View):** Sprite chỉ phóng to $2.0\times$ so với pixel gốc (thay vì $4.0\times$ nếu dùng canvas nhỏ). Nhờ nét cọ digital painting bán hiện thực, hình ảnh vẫn giữ được độ sắc nét của thớ gỗ, vết nứt vỏ cây và vi sợi rêu nhung, hoàn toàn không bị bể ô vuông (pixelated) hay bệt màu.
3. **Kênh Alpha & Biên an toàn:**
   - Giữ lề an toàn $2\text{ px}$ trong suốt quanh rìa tán lá và cành gỗ để bộ lọc `LINEAR` của WebGL không tạo viền đen (dark edge fringe) khi camera zoom mượt.

---

## 8. DANH SÁCH FILE ĐỀ NGHỊ GAME DIRECTOR (CHATGPT) SẢN XUẤT ĐỢT NÀY

Kính đề nghị Game Director tạo và bàn giao đúng **4 file PNG** theo chuẩn kỹ thuật sau:

```
public/assets/source/
├── env_tree_ancient_trunk_base.png    (760 x 800 px | PNG-24 Alpha | Thân gốc sồi nứt nẻ có rêu)
├── env_tree_bough_main_moss.png       (1200 x 360 px | PNG-24 Alpha | Cành sồi ngang, mặt trên rêu, mặt dưới có mấu treo tổ)
├── env_foliage_canopy_clump_01.png    (512 x 512 px | PNG-24 Alpha | Cụm vòm tán lá sồi xanh mát tỉa nét vẽ tay)
└── env_tree_root_deep_cluster.png     (640 x 920 px | PNG-24 Alpha | Chùm rễ sồi uốn lượn cắm sâu lòng đất)
```

---

## 9. KẾT LUẬN & ĐỀ XUẤT BÀN GIAO
- Hợp đồng kỹ thuật trên đã khóa chặt mọi thông số hình học, thứ tự layer, vùng overlap chống hở khe và vùng neo tổ ong.
- Kính mời **Project Owner** gửi tài liệu này cho **Game Director** phê duyệt để tiến hành xuất xưởng 4 asset đầu tiên của PACK-002-A.
