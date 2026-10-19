# THE VIVARIUM — Art Direction Starter Pack

This pack contains **8 concept reference images**, a DRAFT visual bible, PROVISIONAL asset specs, and an asset manifest. It is not a game-ready sprite pack.

## Antigravity instructions
1. Read VISUAL_BIBLE.md, ASSET_SPECIFICATION.md, ASSET_MANIFEST.csv.
2. Browse references/ for art direction ONLY.
3. Do not render any entire reference PNG as gameplay background. Do not crop pre-painted chambers and call them dynamic assets.
4. Request approved individual asset packs before production scene integration.
5. Begin with one ant worker and one tunnel/chamber; report actual runtime screenshots at multiple zoom levels.
6. Keep existing Godot/Web projects unchanged until owner authorizes integration.

## Art Direction checklist status (Checklist 01)
1. **Phong cách Premium Hand-Painted 2D/2.5D:** `[DONE]` — Đã chốt chính thức phong cách Semi-Realistic Stylized 2D/2.5D (Option A: Stylized Readability), ưu tiên nhận diện silhouette rõ ràng ở 1.0x và cọ vẽ tay mềm mại ở 2x-4x.
2. **Bảng màu rừng, đất, nước, tổ ong, tổ kiến:** `[PENDING PHÊ DUYỆT - PROPOSED]` — Đã trích xuất và hệ thống hóa bảng mã HEX cụ thể trong VISUAL_BIBLE.md.
3. **Tỷ lệ kiến, ong, cây, buồng tổ:** `[PENDING PHÊ DUYỆT - PROPOSED]` — Đã xây dựng ma trận kích thước Pixel render chuẩn dựa trên Grid 32px trong VISUAL_BIBLE.md.
4. **Góc nhìn side-view và mặt cắt lòng đất:** `[DONE]` — Đã quy định rõ cấu trúc 2D Cross-section Cutaway (640px mặt đất + 800px lòng đất).
5. **Các mức zoom và độ chi tiết tương ứng (LOD):** `[PENDING PHÊ DUYỆT - PROPOSED]` — Đã lập bảng 4 cấp độ zoom (0.25x-0.5x, 1.0x, 2.0x, 4.0x) và hành vi LOD tương ứng.
6. **Thiết lập chuẩn PNG, pivot, kích thước và tên file:** `[PENDING PHÊ DUYỆT - PROPOSED]` — Đã hoàn thiện toàn diện ASSET_SPECIFICATION.md (PNG-24 Alpha, 2px padding, tọa độ pivot, cấu trúc đặt tên chuẩn).
7. **Tạo Visual Bible và bộ ảnh tham chiếu:** `[DONE]` — Đã tích hợp 8 ảnh concept vào thư mục `references/` và hoàn thiện văn bản VISUAL_BIBLE.md.

## Quyết định cần chủ dự án phê duyệt trước khi sản xuất asset
1. Phê duyệt bảng màu mã HEX trong VISUAL_BIBLE.md.
2. Phê duyệt tỷ lệ kích thước kiến ($18\times 14\text{ px}$), ong ($22\times 16\text{ px}$), buồng tổ và ô sáp lục giác ($R = 20\text{ px}$).
3. Phê duyệt bảng quy chuẩn LOD camera zoom (0.5x, 1.0x, 2.0x, 4.0x).
4. Phê duyệt tiêu chuẩn canvas gốc ($64\times 64\text{ px}$) và tọa độ Anchor/Pivot trong ASSET_SPECIFICATION.md.
