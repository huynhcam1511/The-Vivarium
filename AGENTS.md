# THE VIVARIUM — AGENT FACTORY BLUEPRINT (AGENTS.md)
## DÂY CHUYỀN SẢN XUẤT TỰ ĐỘNG & QUY CHUẨN MÔ PHỎNG ECOSYSTEM SANDBOX

> **Phiên bản:** 1.0.0 — Factory Architecture  
> **Áp dụng cho:** Toàn bộ Agent thuộc hệ thống Antigravity, Subagents, Worker & QA Reviewers  
> **Nguyên tắc tối thượng:** Chuyển hóa toàn bộ quá trình phát triển The Vivarium từ mô hình thủ công nhỏ lẻ thành một **Nhà máy sản xuất Game Sinh thái Tự động (Automated Ecosystem Game Factory)**.

---

## 1. MÔ HÌNH NHÀ MÁY SẢN XUẤT (THE 3-TIER FACTORY ROLES)

```
┌────────────────────────────────────────────────────────┐
│               PROJECT OWNER (USER)                     │
│  - Phê duyệt trực quan cuối cùng (Visual & Feel)       │
│  - Định hướng mở rộng quy mô & trải nghiệm Sandbox     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               GAME DIRECTOR (CHATGPT)                  │
│  - Thiết kế Game Loop, World Bible & Checklist Gates   │
│  - Phân bổ Task, quy định chỉ số chấp thuận (Criteria) │
│  - Kiểm định độc lập (Director QA Acceptance)          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│          ANTIGRAVITY AGENT FACTORY (AI TEAMWORK)       │
│  ├── Factory Lead / Orchestrator: Điều phối dây chuyền │
│  ├── Architecture Artisans: Dựng hệ thống lõi & Web/Godot│
│  ├── Asset Pipeline Engine: Chuẩn hóa, bóc tách sprite │
│  └── Forensic QA Auditors: Chụp diff, đo đạc, benchmark│
└────────────────────────────────────────────────────────┘
```

---

## 2. NGUYÊN TẮC CỔNG TUẦN TỰ (STRICT GATE PROGRESSION)

Dây chuyền sản xuất phải tuân thủ nghiêm ngặt thứ tự đóng cổng Checklist. **Tuyệt đối không nhảy cóc giai đoạn:**

- **Checklist 01 (ĐÃ ĐÓNG 100%):** Art Direction, Visual Bible & Color Palette Foundation.
- **Checklist 02 (ĐANG HOÀN TẤT CHẶNG CUỐI):** Environment, Biomes, Seams & Organic Cave.
  - *Điều kiện đóng Checklist 02:* Hoàn tất tích hợp Cổ thụ sồi V5 không vết cắt cụt, thảm cỏ cắm sâu vào đất, khử triệt để ảo giác lặp tiling đất ngầm, tích hợp đầy đủ hệ thủy sinh & khí quyển, và vượt qua kiểm định của Game Director.
- **Checklist 03 (CHỈ MỞ KHI CHECKLIST 02 ĐÃ DUYỆT):** Fauna, Colony Lifecycle & Animation Sprite Sheets.
- **Checklist 04:** Colony Structures, Honeycomb Construction & Simulation Economy.
- **Checklist 05:** Seasonal Cycles, Storm Floods, Predators & Survival Logic.
- **Checklist 06:** Audio Synthesis, Cloud Database Save & Multiplatform Deployment.

---

## 3. KIẾN TRÚC MỞ RỘNG SANDBOX DẠNG LEGO (MODULAR BIOME LEGO ENGINE)

Để giải quyết bài toán *"thế giới hiện tại quá nhỏ, chơi 1-2 ngày là hết"*, hệ thống từ bỏ kiến trúc ma trận cố định (fixed grid) và chuyển sang **Kiến trúc Ghép khối Lego vô hạn (Infinite Biome Chunk Chaining)**:

### 3.1. Đơn vị Chunk Chuẩn (Standard Biome Chunk: $64 \times 64$ cells)
Mỗi Chunk địa hình là một khối module độc lập chứa:
- Tầng đất / đá / mạch khoáng riêng biệt.
- Lưới va chạm & mật độ hữu cơ Marching Squares.
- Tọa độ neo các đối tượng sinh thái (cây, rễ, tổ, mạch nước).

### 3.2. Cổng Kết Nối Khối Ghép (Conduit Sockets / Lego Ports)
Mỗi Chunk thiết kế sẵn các cổng kết nối chuẩn ở 4 cạnh biên (Trái, Phải, Đáy sâu):
1. **Root Vein Ports (Cổng rễ cây):** Cho phép rễ sồi cổ thụ đâm xuyên từ Chunk bề mặt xuống các Chunk tầng sâu cấp 2, cấp 3 mà không bị đứt đoạn.
2. **Underground Tunnel Sockets (Cổng hầm ngầm):** Điểm chờ sẵn để kiến đào thông sang khu vực hang đá vôi (*Limestone Caves*) hoặc túi quặng sét (*Clay Deposits*).
3. **Aquifer & Drainage Ports (Cổng túi nước ngầm):** Dẫn nước từ hồ trên mặt cạn ngấm dần xuống các mạch nước ngầm và hang ngập nước.

*Chiến lược sản xuất:* Giai đoạn hiện tại dựng cụm Chunk trung tâm hoàn hảo, nhưng để sẵn các cổng chờ để sau này nối dài vô tận sang hai bên và đâm sâu hàng trăm mét.

---

## 4. DÂY CHUYỀN SẢN XUẤT ASSET SINH VẬT ĐA TẦNG (FAUNA ASSET PIPELINE)

Một sinh thái sống động **không thể dùng sprite tĩnh**. Agent Factory quy định tiêu chuẩn sản xuất cho Checklist 03 gồm **Ma trận 3 Chiều**:

$$\text{Tổng Asset Sinh Vật} = \text{Loài} \times \text{Vòng đời / Giai cấp} \times \text{Trạng thái Hoạt ảnh}$$

### 4.1. Cây Phân Cấp Giai Cấp & Vòng Đời (Colony Caste & Lifecycle Matrix)
- **Đàn Kiến (*Camponotus Formicarium*):**
  - *Vòng đời non:* Trứng chùm $\to$ Ấu trùng $\to$ Nhộng kén tơ $\to$ Kiến non mới nở (*Callow*).
  - *Giai cấp trưởng thành:*
    1. **Kiến Chúa (Queen):** Thân lớn 120px, bụng căng phồng, nhịp thở sinh học.
    2. **Kiến Lính (Major Soldier):** Đầu to hình tim, hàm gọng kìm khỏe, cơ bắp.
    3. **Kiến Thợ Đào (Excavator Worker):** Hàm cạp đất, chân gai bám vách.
    4. **Kiến Y Tá (Nurse Worker):** Di chuyển chậm, chuyên bế trứng và mớm mồi.
    5. **Kiến Trinh Sát (Scout):** Thân thon dài, tốc độ chạy cao trên mặt cỏ và leo cành sồi.
- **Đàn Ong Mật (*Apis Mellifera Apiary*):**
  - *Vòng đời non:* Ấu trùng cuộn chữ C trong lỗ sáp lục giác $\to$ Nhộng đậy nắp sáp bánh quy.
  - *Giai cấp:* Ong Chúa, Ong Đực, Ong Thợ Vườn (Forager), Ong Quạt Gió (Fanner), Ong Thợ Xây Sáp.

### 4.2. Bộ Hoạt Ảnh Chuẩn (8 – 12 Animation States / Caste)
Mỗi giai cấp được sản xuất sprite sheet tối thiểu 6-12 frame cho từng hành động:
1. `idle`: Cử động râu và nhịp thở tự nhiên.
2. `walk_horizontal`: Bước chân 6 chân luân phiên (Tripod gait) trên mặt phẳng.
3. `climb_vertical_up / down`: Bám leo vách đất dốc 90° và trèo thân cây sồi.
4. `crawl_ceiling`: Bò ngược trần vòm hang đá/buồng ấp.
5. `dig_excavate`: Động tác cắn đất, bứng hạt sét và hất lùi.
6. `carry_heavy`: Tha vác mồi, hạt sỏi hoặc bế trứng trên lưng.
7. `feed_trophallaxis`: Chạm râu mớm mồi dịch mật trao đổi chất.
8. `attack_bite`: Giương hàm kẹp, phun axit formic phòng vệ.
9. `death_curl`: Co quắp chân khi chết hoặc bị thiên địch hạ gục.

---

## 5. BỘ LỌC KIỂM SOÁT CHẤT LƯỢNG MỸ THUẬT (ART QUALITY GATES)

Mọi asset trước khi nạp vào engine phải vượt qua bộ lọc 5 điểm:
1. **Không có vết cắt cụt (Zero Planar Cuts):** Cành cây, rễ cây, cuống hoa không được kết thúc bằng đường cắt thẳng tắp của mép canvas. Đỉnh cành phải nối vào tán lá; đuôi rễ phải vuốt nhọn tự nhiên đâm vào kẽ đất.
2. **Khử ảo giác lặp Tiling (Anti-Tiling Regularity):** Texture đất mùn và vách hang phải dùng thuật toán Multiscale Blend (pha trộn ít nhất 2 lớp texture kích thước lệch nhau và noise mask hữu cơ) để triệt tiêu hiện tượng xoáy lặp mắt trên diện rộng.
3. **Cỏ & Hoa cắm rễ tự nhiên (Rooted Vegetation):** Đáy bụi cỏ, khóm hoa phải có sợi rễ con cắm sâu vào lớp đất mặt tối thiểu 3-5px, loại bỏ cảm giác thanh dán đè.
4. **Hốc đào không răng cưa ô vuông:** Vách đất đào phải được tính toán viền sỏi và shadow bằng Marching Squares siêu mịn, không lộ ô lưới logic 32px.
5. **Khí quyển có chiều sâu (Atmospheric Parallax):** Bầu trời phải gồm 3 tầng: Nền trời gradient theo thời gian $\to$ Núi xa mờ sương $\to$ Mây trôi đa tốc độ theo vector gió.

---

## 6. HƯỚNG DẪN DÀNH CHO SUBAGENTS & WORKERS

- Khi nhận lệnh từ Giám đốc (Director), luôn đọc file này trước tiên để hiểu chuẩn mực công nghiệp của dự án.
- Luôn tạo bằng chứng kiểm thử bằng hình ảnh thực tế (screenshot runtime in-engine) tại các độ thu phóng $1.0\times, 2.0\times, 4.0\times$.
- Báo cáo minh bạch số liệu đo đạc, không ngụy tạo kết quả telemetry.
