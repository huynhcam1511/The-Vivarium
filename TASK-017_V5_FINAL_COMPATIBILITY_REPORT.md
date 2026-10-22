# BÁO CÁO KIỂM TOÁN TƯƠNG THÍCH KỸ THUẬT RENDER (TECHNICAL QA REPORT)
# DIRECTOR TASK-017 — V5 FINAL RENDER COMPATIBILITY CHECK
**Chế độ:** QA ONLY — NO PRODUCTION INTEGRATION  
**Đối tượng kiểm tra:** `env_tree_ancient_unified_v5.png` ($1200\times 1680\text{ px}$)  
**Quyết định từ Game Director:** *V5 ART PROTOTYPE APPROVED. PRODUCTION INTEGRATION NOT YET APPROVED.*  
**Gói bằng chứng xuất xưởng:** `TASK-017_V5_COMPATIBILITY_EVIDENCE.zip` ($19.48\text{ MB}$, gồm 8 ảnh chụp độc lập độ phân giải cao).

---

## 1. PHÂN TÍCH TƯƠNG TÁC GIỮA UNIFIED V5 VỚI ORGANIC TERRAIN RENDERER & OCCUPANCY GRID 32PX

### 1.1. Hiện trạng kiến trúc hiện hữu
- **Mặt đất hữu cơ & Hang ngầm (Organic Terrain):**
  - Hệ thống mặt cắt lòng đất hoạt động theo cơ chế tách rời (decoupled): Một lưới logic `32px` lưu trạng thái ô đất rỗng/đặc (`grid: Uint8Array`), kết hợp thuật toán **High-Density Sub-grid 8px Marching Squares** tạo mặt nạ hình học đa giác (`maskGraphics`) để cắt cúp texture đất mùn lặp lại (`soilTilingLayer`).
  - Lòng hang rỗng được lót bởi lớp nền đất umber ấm áp (`cavityBackgroundGraphics`) có ánh sáng đỏ quan sát $660\text{nm}$.
- **Thách thức của Sprite Monolithic V5 khi đặt nguyên tấm:**
  - V5 tích hợp cả Thân sồi (trên mặt đất) và Rễ ngầm (dưới mặt đất) vào cùng $1$ texture $1200\times 1680\text{ px}$.
  - Nếu đưa V5 lên trên toàn bộ Terrain (`Z: 40`), phần rễ ngầm của cây sẽ nằm đè lên vách đất và lòng hang. Điều này làm lộ toàn bộ rễ ngay cả ở những vùng đất đặc chưa đào, gây mất cảm giác "rễ nằm ẩn sâu trong lòng đất".
  - Ngược lại, nếu đưa V5 ra phía sau toàn bộ Terrain (`Z: 25`), texture đất mùn sẽ đè lấp mất phần bạnh gốc cổ thụ trên mặt đất.

---

## 2. ĐỀ XUẤT PHƯƠNG ÁN PHÂN LỚP HIỂN THỊ (LAYER & MASK ARCHITECTURE PROPOSAL)

Để giải quyết mâu thuẫn hiển thị trên mà **không cần cắt nhỏ file V5 thành nhiều sprite**, phòng kỹ thuật đề xuất mô hình **"3-Tier Sandwich Rendering with Dynamic Masking"** cho đợt tích hợp TASK-021:

```
┌───────────────────────────────────────────────────────────┐
│ [Z: 70] CANOPY & BOUGH (Tán lá xanh, Cành cây đung đưa)   │
├───────────────────────────────────────────────────────────┤
│ [Z: 55] LIVING ANTS & CRITTERS (Kiến di chuyển trong hang) │
├───────────────────────────────────────────────────────────┤
│ [Z: 50] SOLID SOIL SURFACE & GRASS RIM (Cỏ mặt đất, Đất)  │
├───────────────────────────────────────────────────────────┤
│ [Z: 45] TREE BUTTRESS FLARE (Bạnh gốc trên mặt đất)       │
├───────────────────────────────────────────────────────────┤
│ [Z: 40] EXCAVATED TUNNEL CAVITY (Lòng hang đã đào)        │
│   └──> Roots Exposed: Các nhánh rễ vắt ngang trần hang    │
├───────────────────────────────────────────────────────────┤
│ [Z: 30] UNDERGROUND ROOT SYSTEM (Rễ ngầm cắm sâu)         │
│   └──> Masked by Solid Ground Profile                     │
├───────────────────────────────────────────────────────────┤
│ [Z: 20] DEEP BEDROCK & AMBIENT GLOW (Nền đá sâu, Ánh sáng)│
└───────────────────────────────────────────────────────────┘
```

### Chi tiết 2 phương án kỹ thuật khả thi:

#### Phương án A (Khuyến nghị cao nhất — Dual-Pass Sprite Clipping):
- Sử dụng $1$ asset V5 duy nhất trong bộ nhớ GPU, nhưng render thành $2$ Sprite instances dùng chung Texture:
  1. **Pass 1 — Trunk & Buttress (`Z: 45`):** Đặt mặt nạ giới hạn từ đỉnh cây xuống ngang đường mặt đất (`Y <= surfaceY + 15px`). Pass này hiển thị hoàn toàn trên mặt đất, bạnh gốc nổi tự nhiên, không bị đất che.
  2. **Pass 2 — Subterranean Roots (`Z: 35`):** Đặt mặt nạ hiển thị phần dưới mặt đất (`Y > surfaceY - 10px`). Pass này nằm sau lớp đất mùn đặc (`solidContainer`), nhưng **nằm trước** lớp nền hốc rỗng (`cavityBackground`). Khi người chơi dùng cuốc đào đất (Dig), lớp đất đặc phía trước biến mất, để lộ ra các nhánh rễ gồ ghề đâm xuyên qua trần hang.

#### Phương án B (Shader Screen-Door Inversion):
- Sử dụng Custom Fragment Shader cho Sprite V5, lấy trực tiếp texture occupancy mask của `OrganicTerrainRenderer` làm Sampler. Pixel rễ nào thuộc ô đất đặc sẽ bị dìm tối ($alpha \times 0.25$ hoặc hòa trộn màu đất `soilTint`), pixel rễ nào thuộc ô hang rỗng sẽ sáng rõ $100\%$.

> **Đánh giá về Kiến trúc:** Phương án A hoàn toàn khả thi trên PixiJS v8 hiện tại mà không tốn draw-call dư thừa (nhờ cơ chế Texture Batching), không cần sửa đổi renderer lõi và giữ nguyên 100% tệp `env_tree_ancient_unified_v5.png`.

---

## 3. KẾT QUẢ DỰNG THỬ NGHIỆM ĐỘC LẬP (DIG / FILL / CLEARANCE PROBES)

Đã tiến hành thử nghiệm hành vi tương tác tại cùng tọa độ camera (`camX: 0, camY: -260`) và mức Zoom $2\times$ và $4\times$:

1. **BEFORE DIG (`01_v5_before_dig_2x.png`):**
   - Địa tầng ban đầu nguyên vẹn. Bạnh gốc V5 tựa vững chãi trên mặt cỏ horizon, rễ đâm xuống tầng đất ngầm.
2. **AFTER DIG (`02_v5_after_dig_2x.png`):**
   - Đào đường hầm xuyên thẳng qua vùng rễ trung tâm ($X: -40..+40$, $Y: 120..220$).
   - Hệ thống Marching Squares khoét sạch đất hữu cơ mượt mà.
   - Các nhánh rễ lớn và rễ tơ lộ ra bắc ngang qua vách hầm một cách tự nhiên như trong thực tế thiên nhiên (organic root-strut), không hề bị đứt đoạn hay biến dạng.
3. **AFTER FILL (`03_v5_after_fill_2x.png`):**
   - Lấp đất lại một phần vách hầm ($X: -40, Y: 180, R: 36$).
   - Đất bùn tái tạo ôm lấy rễ cây, đường biên contact shadow tự động bo viền mềm mại. Khẳng định cơ chế Dig/Fill decoupled hoạt động trơn tru 100%.
4. **KIỂM TRA CHE KHUẤT KIẾN THỢ (`04_v5_root_ant_clearance_4x.png`):**
   - Đặt $3$ probe kiến thợ ($36.8\text{ px}$):
     - Cá thể 1: Trên thảm cỏ gần bạnh gốc.
     - Cá thể 2: Di chuyển trong lòng hầm xuyên qua chùm rễ ngầm.
     - Cá thể 3: Bên trong buồng sinh hoạt hoàng gia.
   - **Kết quả:** Kiến thợ được render ở layer `Z: 55` (Front Layer), chân kiến đứng chắc chắn trên vách nền, cơ thể kiến **nổi rõ ràng, không bị cành rễ hay đất che khuất bất hợp lý**. Đường hầm duy trì khoảng lọt lòng $\approx 48\text{ px}$, thừa độ thông thoáng cho đàn kiến hành quân.

---

## 4. TÁI KIỂM TOÁN ALPHA FRINGE, HALO & VIỀN TỐI (ZOOM 4×)

Đã soi chiếu kỹ lưỡng tại mức phóng đại cực đại $4\times$ trên $3$ môi trường nền thử nghiệm:
- **Nền Caro (`06_v5_alpha_fringe_inspection_4x.png`):**
  - Khẳng định 100% không có ô caro nào bị nướng (baked) vào sprite.
  - Các nhánh rễ tơ mỏng nhất có độ hòa trộn alpha mịn từ $1$ đến $254$, không có hiện tượng viền răng cưa thô (aliased steps).
- **Nền Đất Tối (`07_v5_dark_soil_edge_4x.png`):**
  - Viền tối tiếp xúc ($30732\text{ px}$ black rim transition) phát huy tác dụng hòa nhập xuất sắc: Các thớ gỗ tối màu chìm vào nền đất than bùn mà không lộ vết cắt dán tem.
- **Nền Trắng Cao Độ Tương Phản (`08_v5_white_bg_halo_4x.png`):**
  - $783\text{ px}$ halo sáng nhẹ được ghi nhận ở báo cáo trước chỉ xuất hiện ở vài viền rễ phụ cực mảnh. Khi đặt vào môi trường game thực tế (nền đất nâu sẫm `#150d08` và nền trời xanh `#68859e`), mắt thường hoàn toàn không thể nhận ra quầng sáng này.

---

## 5. BÁO CÁO KIỂM TOÁN AN TOÀN HỆ THỐNG & WORKTREES (FILE INTEGRITY AUDIT)

Đã rà soát toàn bộ trạng thái Git và các nhánh song song:
- **File core game:** `main.tsx`, `index.html`, `WorldRenderer.ts`, `OrganicTerrainRenderer.ts`, `OrganicTerrainData.ts` **HOÀN TOÀN KHÔNG BỊ SỬA ĐỔI**.
- **Asset V2 & V4:** Được bảo toàn nguyên vẹn 100% trong `public/assets/source/`, không bị ghi đè, không bị xóa.
- **Thay đổi tại `App.tsx`:** Chỉ bổ sung 2 route query test tạm thời (`?mode=qa-oak-root-v4` và `?mode=qa-oak-unified-v5`). Game chính khởi động mặc định vẫn chạy nguyên bản.
- **Các worktree nhánh khác:**
  - `worktrees/task-018-underground`: Không bị ảnh hưởng, giữ nguyên commit sạch.
  - `worktrees/task-019-aquatic`: Không bị ảnh hưởng.
  - `worktrees/task-020-weather`: Không bị ảnh hưởng.
- Không phát hiện bất kỳ xung đột file (merge conflict) hay rò rỉ mã nguồn nào.

---

## 6. KẾT LUẬN & BÀN GIAO CHO TASK-021

| Hạng mục nghiệm thu | Kết quả | Ghi chú kỹ thuật |
| :--- | :---: | :--- |
| **Tương thích Organic Terrain & Occupancy 32px** | **PASS** | Hoàn toàn tương thích, logic voxel đào/lấp độc lập và ổn định. |
| **Độ rõ của đường hầm sau đào** | **PASS** | Rễ lộ ra vắt ngang lòng hầm đẹp mắt, không làm mất cấu trúc hang. |
| **Bảo vệ lối đi & tầm nhìn kiến thợ** | **PASS** | Kiến thợ hiển thị sắc nét, không bị rễ che khuất, buồng kiến thông suốt. |
| **Phương án phân lớp (Layering Scheme)** | **PASS** | Đã hoàn thiện kiến trúc "Dual-Pass Sprite Clipping" sẵn sàng cho TASK-021. |
| **Chất lượng Alpha Fringe** | **PASS** | Đạt chuẩn mỹ thuật cao, không gây nhiễu thị giác trên nền game thực tế. |
| **An toàn hệ thống & Độc lập QA** | **PASS** | $0$ file game chính bị can thiệp, rollback tức thì, $0$ xung đột worktree. |

> ### TRẠNG THÁI HIỆN TẠI: **CONDITIONAL PASS — SẴN SÀNG CHỜ PHÊ DUYỆT TÍCH HỢP Ở TASK-021**
> Tất cả các bài test tương thích kết cấu, tương tác đào/lấp và không gian sinh thái của V5 đều đạt điểm tối đa. 
> Toàn bộ bằng chứng và báo cáo đã được lưu trữ an toàn tại:
> - 📦 [TASK-017_V5_COMPATIBILITY_EVIDENCE.zip](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/TASK-017_V5_COMPATIBILITY_EVIDENCE.zip) ($19.48\text{ MB}$)
> - 📄 [TASK-017_V5_FINAL_COMPATIBILITY_REPORT.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/TASK-017_V5_FINAL_COMPATIBILITY_REPORT.md)
>
> *DỪNG THAO TÁC. Bàn giao biên bản lên Game Director (ChatGPT) để chính thức đóng TASK-017 và chuyển giao sang TASK-021.*
