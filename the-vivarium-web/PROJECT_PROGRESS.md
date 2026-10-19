# THE VIVARIUM — OFFICIAL PROJECT PROGRESS TRACKER

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Cơ chế quản lý:** Director Workflow (Project Owner: USER | Game Director: CHATGPT | Technical Developer: ANTIGRAVITY)  
> **Tài liệu theo dõi chính thức:** `PROJECT_PROGRESS.md`  
6: > **Cập nhật lần cuối:** 2026-10-19T17:35:00+07:00 (Sau khi hoàn tất DIRECTOR TASK-007 — Khóa Art Direction)  

---

## 1. TỔNG QUAN TIẾN ĐỘ 9 CHECKLIST

| Checklist ID | Phân Hệ | Trạng Thái | Tiến Độ (%) | Ghi Chú |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Art Direction — Chuẩn hóa mỹ thuật** | **DONE** | **100%** | **HOÀN THÀNH TOÀN BỘ PHẦN QUY CHUẨN ART DIRECTION** (Các vấn đề chất lượng asset được tách riêng sang Asset Production QA) |
| **02** | **Environment — Môi trường** | **IN PROGRESS** | **25%** | PACK-002-A Vertical Slice prototype đã dựng thành công in-engine |
| **03** | Ant Colony — Hệ thống tổ kiến | PENDING | 0% | Sẵn sàng tiếp nhận ANT-WORKER-001 V2 |
| **04** | Bee Colony — Hệ thống tổ ong | PENDING | 0% | Sẵn sàng sau khi xong Ant Colony |
| **05** | Wildlife — Sinh vật khác | PENDING | 0% | Chờ hoàn thiện cây & lòng đất |
| **06** | Animation — Chuyển động | PENDING | 0% | Chờ sprite sheet frame-by-frame |
| **07** | World Rendering — Dựng thế giới | IN PROGRESS | 30% | Engine PixiJS v8 đã chạy mượt trên port 2000 |
| **08** | HUD & Game UI | IN PROGRESS | 75% | HUD tiếng Việt, Glassmorphism, Minimap đã lên khung |
| **09** | Integration & QA | IN PROGRESS | 50% | Pipeline kiểm định Gameplay Scale & Tiling tự động hoàn chỉnh |

---

## 2. CHI TIẾT CHECKLIST 01 — ART DIRECTION (ĐÃ ĐƯỢC GAME DIRECTOR PHÊ DUYỆT 100%)

| Mục | Nội dung công việc | Trạng thái | Bằng chứng file output / Tài liệu đối chiếu |
| :---: | :--- | :---: | :--- |
| **1.1** | Chốt phong cách Premium Hand-Painted 2D/2.5D | **APPROVED** | Đã được Game Director duyệt: **Premium Semi-Realistic Stylized Hand-Painted 2D/2.5D (Option A: Stylized Readability)**. Ghi nhận tại [VISUAL_BIBLE.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/VISUAL_BIBLE.md#L9-L21). |
| **1.2** | Chốt bảng màu cho rừng, đất, nước, tổ ong, tổ kiến | **APPROVED** | Đã được Game Director duyệt làm **Base Palette** tại [VISUAL_BIBLE.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/VISUAL_BIBLE.md#L23-L65). |
| **1.3** | Chốt tỷ lệ kiến, ong, cây, buồng tổ | **APPROVED** | Đã phê duyệt chính thức (TASK-007): Thân kiến $26 \times 18\text{ px}$ (sải chân $36 \times 20\text{ px}$) ở zoom 1.0x, giữ nguyên aspect ratio $1.84:1$, không kéo giãn. Bảng ma trận tại [VISUAL_BIBLE.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/VISUAL_BIBLE.md#L84-L105). |
| **1.4** | Chốt góc nhìn side-view và mặt cắt lòng đất | **APPROVED** | Đã được Game Director duyệt: **2D Side-view Cross-section Cutaway**, camera di chuyển tự do. Ghi nhận tại [VISUAL_BIBLE.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/VISUAL_BIBLE.md#L67-L75). |
| **1.5** | Chốt các mức zoom và độ chi tiết tương ứng (LOD) | **APPROVED** | Phạm vi zoom $0.25\times – 4.0\times$ đã nghiệm thu in-engine thành công ở cả cấp độ Master ($96\text{ px}$) và Gameplay Scale ($18\times 14\text{ px} \rightarrow 26\times 18\text{ px}$). |
| **1.6** | Thiết lập chuẩn PNG, pivot, kích thước và tên file | **APPROVED** | Đã khóa tiêu chuẩn tại [ASSET_SPECIFICATION.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/ASSET_SPECIFICATION.md): PNG-24 Alpha, Safe margin 2px, Pivot kiến `(0.50, 0.85)`, bổ sung yêu cầu **Rim light hổ phách** cho côn trùng tối màu. |
| **1.7** | Tạo Visual Bible và bộ ảnh tham chiếu | **APPROVED** | Đã hoàn thiện văn bản quy chuẩn chính thức [VISUAL_BIBLE.md](file:///c:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/the-vivarium-web/art_direction/THE_VIVARIUM_ART_DIRECTION/VISUAL_BIBLE.md) và lưu trữ 8 ảnh concept chuẩn trong thư mục `references/`. |

---

## 3. KÊNH TIẾP NHẬN ASSET PRODUCTION V2 (ASSET INTAKE CHANNELS)

Hệ thống đã thiết lập sẵn các đường dẫn chờ tiếp nhận asset phiên bản V2 từ Game Director:

1. **Kiến thợ V2 (Yêu cầu Rim light hổ phách, Canvas $96\text{ px}$ hoặc $128\text{ px}$, không méo tỷ lệ):**  
   `public/assets/source/char_ant_worker_idle_v2.png`  
   *(Có thể ghi đè trực tiếp vào `public/assets/source/char_ant_worker_idle.png`)*
2. **Texture Đất Mùn V2 (Khử đốm sỏi lớn / cành khô tương phản cao để đạt seamless không lặp mắt):**  
   `public/assets/terrain/terrain_soil_dark_loam_v2.png`  
   *(Có thể ghi đè trực tiếp vào `public/assets/terrain/terrain_soil_dark_loam.png`)*

---

## 4. TỒN ĐỌNG KỸ THUẬT & QUẢN LÝ CHẤT LƯỢNG (ASSET QA LOG)

### 4.1 Báo Cáo Nghiệm Thu ASSET PACK 001 V2 (DIRECTOR TASK-008 — 2026-10-19)
- **ANT-WORKER-001 V2 (`char_ant_worker_idle_v2.png`):** **PASS**
  - Kích thước canvas: $128 \times 128\text{ px}$ (độ phân giải cao, hỗ trợ zoom 4× cực nét).
  - Tỷ lệ khung hình: $116 \times 63\text{ px}$ (aspect ratio $1.841:1$, hoàn toàn đồng nhất với V1).
  - Điểm tiếp đất (Pivot Y): $108 / 128 = 0.844 \approx \mathbf{0.85}$ (chuẩn xác tuyệt đối).
  - Kênh Alpha & Viền: Trong suốt hoàn hảo, không còn viền trắng, râu và các khớp chân sắc nét.
  - Readability: Bổ sung viền sáng hổ phách (amber rim light) giúp tách biệt rõ ràng kiến khỏi nền đất đen ngay cả ở zoom 1× ($36.8 \times 20\text{ px}$ tổng sải).
- **TERRAIN-001 V2 (`terrain_soil_dark_loam_v2.png`):** **PASS (ACCEPTED FOR ENVIRONMENT IMPLEMENTATION)**
  - Kích thước: $512 \times 512\text{ px}$, 24bpp RGB.
  - Độ liền mạch (Seam difference): **0.0000 px** (liền mạch 100% toán học cả 4 cạnh).
  - Họa tiết lặp (Tiling Repetition): Đã loại bỏ các cục đá trắng lớn và cành rễ chéo tương phản cao của V1. Kiểm tra trên ma trận 3×3 và 5×5 cho thấy bề mặt mùn hữu cơ đồng nhất và tự nhiên hơn rõ rệt. Đủ tiêu chuẩn đưa vào pipeline dựng môi trường với alpha masking / marching squares.
- **Tình trạng V1:** V1 chính thức chuyển thành dữ liệu lưu trữ / tham chiếu (Archive); V2 được chọn làm Master Asset.

