# TASK-021: PENDING ART ASSETS & ASSET GATE AUDIT
## GATE A: SAFE GIT & SYSTEM INTEGRATION
**Project:** The Vivarium  
**Checklist:** CHECKLIST-02  
**Date:** 2026-10-21  

---

## 1. QUY TẮC CỔNG MỸ THUẬT (ART ASSET GATE)

> [!WARNING]
> **QUY TẮC BẮT BUỘC:** Không được đánh dấu Checklist-02 hoàn thành 100%. Toàn bộ các gói mỹ thuật từ PACK-002, PACK-003, PACK-004 chỉ được tích hợp dưới dạng Prototype có điều kiện (`CONDITIONAL PROTOTYPE APPROVED`).

---

## 2. DANH SÁCH 5 ASSET CÒN THIẾU TẠI PACK-004 (AQUATIC & RIPARIAN FLORA)

Hiện tại hệ thống thủy sinh đang sử dụng **bộ dựng đồ họa thủ tục Vector Procedural Fallback (PixiJS Graphics)** để thay thế cho 5 asset PNG chưa bàn giao:

| STT | Mã Asset | Tên file quy chuẩn | Mô tả công việc mỹ thuật | Trạng thái kỹ thuật hiện tại |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `ENV-FLORA-BLUEBELL` | `env_flower_bluebell.png` | Cụm hoa chuông xanh tím rủ ven bờ ẩm | **PENDING ART** (Đang dùng vector procedural `#4361EE`/`#7209B7`) |
| 2 | `ENV-FLORA-MOSS-PATCH` | `env_moss_patch.png` | Thảm rêu nhung bám đá ẩm và vách thác | **PENDING ART** (Đang dùng vector cushion `#588157`) |
| 3 | `ENV-FLORA-FERN-CLUSTER` | `env_fern_cluster.png` | Cụm dương xỉ uốn cong viền hồ nước | **PENDING ART** (Đang dùng vector fronds `#2D6A4F`/`#52B788`) |
| 4 | `ENV-LAKE-BOTTOM-MUD` | `env_lake_bottom_mud.png` | Lớp bùn lắng đáy hồ và trầm tích ngầm | **PENDING ART** (Đang dùng dải màu gradient trầm tích `#1B263B`) |
| 5 | `ENV-WATERFALL-STREAM` | `env_waterfall_stream.png` | Dòng suối thác nước chảy cuộn bọt trắng | **PENDING ART** (Đang dùng đường dòng chảy vector `#BAE6FD` + hạt bọt) |

---

## 3. TỒN ĐỌNG MỸ THUẬT TẠI CÁC GÓI KHÁC

### 3.1. PACK-003 (Underground Cave / Formicarium)
- Các asset PACK-003 đã được duyệt ở mức **Prototype có điều kiện**:
  - `terrain_soil_dark_loam_v2.png`: Texture đất cần tinh chỉnh để loại bỏ các vệt lặp ô lưới 32px khi vẽ ambient glow.
  - Vách hang cần thêm biến thiên hình học vi mô ngẫu nhiên tự nhiên hơn ở các giai đoạn hoàn thiện sau.
  - Nội thất các buồng tổ còn thiếu chi tiết sinh thái (trứng kiến, ấu trùng, rễ cây đâm trần buồng).

### 3.2. PACK-002-B1 (Ground Surface & Flora)
- `env_terrain_surface_grass.png`: Có khoảng hở $12\text{ px}$ trong suốt ở 2 cạnh biên trái/phải ($X=0..5$ và $X=506..511$), chưa đạt chuẩn tileable liền mạch cho production.
- `env_flower_clover_pink.png`, `env_flower_daisy_white.png`, `env_grass_tuft_green.png`: Đang dùng ở quy mô prototype.

### 3.3. TASK-017 (Unified Oak V5)
- Sprite monolithic V5 ($1200\times 1680\text{ px}$) đã đạt chuẩn mỹ thuật Prototype (`V5 ART PROTOTYPE APPROVED`).
- Tuy nhiên chưa được phép đưa vào production thay thế hoàn toàn cho đến khi Director phê duyệt kiến trúc render phân lớp (3-Tier Sandwich Rendering with Dynamic Masking).
