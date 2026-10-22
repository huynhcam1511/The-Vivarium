# BÁO CÁO NGHIỆM THU QA MỸ THUẬT: PACK-003 ART CANDIDATES
## CHECKLIST-02 / TASK-018 — SUBTERRANEAN STRATA & PEBBLES

**Gói kiểm tra:** `THE_VIVARIUM_TASK018_PACK003_ART_CANDIDATE.zip`  
**Chế độ:** QA ONLY — NO PRODUCTION INTEGRATION  
**Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-018-underground`  
**Branch:** `task/018-underground`  
**Commit:** `6544243` (Giữ nguyên tuyệt đối)  
**Thời gian kiểm định:** 2026-10-21  

---

## 1. TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ TỪNG ASSET

| Asset ID | Tên File Quy Chuẩn | Kích Thước | Chế Độ Màu | Đánh Giá QA | Lý Do Kỹ Thuật & Tồn Đọng Mỹ Thuật |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ENV-TERRAIN-CLAY-01` | `env_terrain_clay_512.png` | $512 \times 512$ | RGB (Opaque) | **CONDITIONAL PASS** | **Ưu điểm:** Khử seam toán học hoàn hảo (Seam H=0, V=0). Màu đất sét nâu cam (`#904a1d`) ấm áp, chuẩn tone palette.<br>**Tồn đọng:** Khi lặp 3×3 ở zoom 1× xuất hiện các vệt đốm sáng lặp chu kỳ 512px (tiling repeat signature). Cần khử lặp bằng kỹ thuật dual-layer UV offset như đất mùn Loam V2. |
| `ENV-TERRAIN-PEAT-01` | `env_terrain_peat_512.png` | $512 \times 512$ | RGB (Opaque) | **PASS** | **Ưu điểm:** Khử seam toán học tuyệt đối (Seam H=0, V=0). Màu than bùn sẫm (`#2c1a11`), độ tương phản vừa phải, hạt hữu cơ vụn tự nhiên. Khi ghép 3×3 không bị lộ ô vuông hay gờ chia cắt. Thích hợp làm base địa tầng sâu. |
| `ENV-TRANSITION-MASK-01` | `env_mask_organic_blend.png` | $512 \times 512$ | Grayscale (L) | **PASS** | **Ưu điểm:** Mask mây/khói hữu cơ liền mạch 100% (Seam H=0, V=0), dải gradient mượt từ 0 đến 255. Dùng làm mask hòa trộn giữa Đất mùn / Đất sét / Than bùn rất tự nhiên, tạo ranh giới tầng đất uốn lượn không răng cưa. |
| `ENV-PEBBLE-EMBED-01` | `env_pebble_embedded.png` | $512 \times 512$ | RGBA | **CONDITIONAL PASS** | **Ưu điểm:** Cụm sỏi chi tiết, ánh sáng góc nghiêng sinh động, alpha sạch 84.57% trong suốt, hòa hợp tốt trên nền đất mùn/đất sét.<br>**Tồn đọng:** Trên nền trắng lộ viền mờ (faint dark contact fringe) khoảng 1-2px do cắt nền. Dưới dạng decal tĩnh $512\times 512$ thì cụm sỏi hơi to, cần scale $0.4\times - 0.5\times$ khi gắn vào vách hang để đúng tỷ lệ kiến ($36.8\text{ px}$). |

---

## 2. KẾT QUẢ KIỂM THỬ KỸ THUẬT CHI TIẾT

### 2.1 Kiểm tra Seam & Boundary Pixel
- **Clay 512:** Max Edge Difference Horizontal = 0, Vertical = 0 (Seam = 0.0 px).
- **Peat 512:** Max Edge Difference Horizontal = 0, Vertical = 0 (Seam = 0.0 px).
- **Mask 512:** Max Edge Difference Horizontal = 0, Vertical = 0 (Seam = 0.0 px).
- **Pebble 512:** Decal RGBA độc lập; biên ngoài 4 cạnh $A=0$ sạch sẽ.

### 2.2 Kiểm tra Đa Mức Phóng Đại (LOD 1.0×, 2.0×, 4.0×)
- **1.0× (Native Macro):** Than bùn và Đất sét sắc nét, chi tiết đất tơi xốp rõ ràng.
- **2.0× (Formicarium Observation):** Vết rạn nứt đất sét và sợi xơ hữu cơ của than bùn không bị nhòe bilinear hay vỡ hạt.
- **4.0× (Micro Inspection):** Không có hiện tượng nén JPEG artifact (file PNG chuẩn lossless). Hạt sỏi giữ được độ khối 3D.

### 2.3 Chuyển Tầng Địa Chất & Mask Hòa Trộn (Strata Transition)
- Sử dụng `env_mask_organic_blend.png` để blend tầng Than bùn (dưới) và Đất sét (trên) tạo thành mặt cắt địa tầng 2 màu phong phú.
- Độ dốc chuyển tiếp mượt mà, ranh giới hữu cơ uốn lượn tự nhiên, xóa bỏ hoàn toàn cảm giác dải phẳng ngang nhân tạo.

### 2.4 Tương Tác với Organic Cave Dig/Fill
- Khi khoét rỗng buồng hang (Living Chamber & Queen Chamber), 2 tầng đất sét và than bùn bộc lộ mặt cắt rõ ràng.
- Cụm sỏi `env_pebble_embedded.png` gắn dọc bờ vách đất tăng đáng kể độ gồ ghề vi mô tự nhiên của vách hang (khắc phục tồn đọng vách hang trơn nhẵn ở TASK-015).

---

## 3. DANH MỤC SCREENSHOT NGHIỆM THU

Bộ 8 ảnh chụp màn hình thực tế (độ phân giải cao $1450 \times 920$) lưu tại `QA/TASK-018_PACK003_ART_QA/`:
1. `01_tiles_3x3_seam_audit_dark.png` — Kiểm tra ghép 3×3 4 asset trên nền tối.
2. `02_pebble_alpha_audit_white.png` — Kiểm tra alpha và viền sỏi trên nền trắng (Halo/Fringe check).
3. `03_pebble_alpha_audit_soil.png` — Kiểm tra sỏi nhúng chìm vào nền đất ẩm.
4. `04_zoom_1x_strata_detail.png` — Chi tiết vật liệu ở mức phóng đại 1.0×.
5. `05_zoom_2x_strata_detail.png` — Chi tiết vật liệu ở mức phóng đại 2.0×.
6. `06_zoom_4x_strata_detail.png` — Chi tiết vi mô vật liệu ở mức phóng đại 4.0×.
7. `07_strata_transition_blend.png` — Hòa trộn đa tầng địa chất sử dụng Grayscale Noise Mask.
8. `08_organic_cave_dig_integration.png` — Tích hợp mặt cắt vách hang ngầm, buồng tổ và sỏi gắn vách.

---

## 4. KẾT LUẬN & KIẾN NGHỊ BÀN GIAO

- **Nghiệm thu kỹ thuật:** **CONDITIONAL PASS CHO TOÀN BỘ PACK-003**. Đủ tiêu chuẩn chất lượng mỹ thuật để đưa vào tích hợp chính thức ở giai đoạn tiếp theo.
- **Lưu ý khi tích hợp Production (Game Director Note):**
  1. Đất sét (`env_terrain_clay_512.png`) cần áp dụng dual-layer UV offset (như đất mùn Loam V2) để triệt tiêu vệt lặp tiling chu kỳ 512px.
  2. Cụm sỏi (`env_pebble_embedded.png`) nên được render ở kích thước scale $0.35\times - 0.5\times$ (khoảng $180 - 250\text{ px}$) và blend nhẹ viền bóng tiếp xúc để tiệp hoàn toàn vào vách đất.
- **An toàn mã nguồn:** Không ghi đè bất kỳ production asset nào; toàn bộ mã nguồn và commit `6544243` được giữ nguyên vẹn.
