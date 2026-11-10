# CHUNK STREAMING & PERSISTENCE ARCHITECTURE
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & OBJECTIVE

Tài liệu này xác định kiến trúc quản lý, nạp/xả động (Streaming), đồng bộ biên giới và lưu trữ bền vững (Persistence) cho các khối thế giới (**Chunks**) trong *THE VIVARIUM*. 

Mục tiêu cốt lõi: Cho phép thế giới mở rộng quy mô lớn trên nền tảng Web browser mà không gây tràn bộ nhớ hay tụt khung hình, đồng thời đảm bảo mọi tương tác đào, lấp, xây dựng của người chơi được lưu trữ xác định và nhất quán tuyệt đối.

---

## 2. QUY CHUẨN LƯỚI KHÓA V1 & TỌA ĐỘ THẾ GIỚI 2D

### 2.1 Kích Thước Tiêu Chuẩn (Grid Standards V1)
- **Kích thước một ô (Cell/Tile):** **$32 \times 32$ pixels** (Khóa bất biến V1).
- **Kích thước Chunk:** **$64 \times 64$ cells**.
- **Quy mô hiển thị 1 Chunk:** **$2.048 \times 2.048$ world pixels** ($64 \times 32\text{px}$).
- **Cấu hình Prototype V1 (TASK-021 Verification):** Lưới **$2 \times 3$ Chunks** (2 cột ngang $X \in [0, 1]$, 3 tầng sâu $Y \in [0, 2]$) = Tổng cộng 6 Chunks:
  - Chiều ngang: $128\text{ cells} = 4.096\text{ world pixels}$.
  - Chiều sâu: $192\text{ cells} = 6.144\text{ world pixels}$.
- *Phương án $16\text{px/cell}$:* Lưu giữ dưới dạng phương án nghiên cứu cho Micro-Simulation tương lai, không áp dụng cho V1.

```
   Chunk (0, 0) [Bề mặt: Ancient Forest]   |   Chunk (1, 0) [Bề mặt: Breeze Meadow]
   (2.048 x 2.048 px)                      |   (2.048 x 2.048 px)
   ----------------------------------------+---------------------------------------
   Chunk (0, 1) [Tầng đất mùn & Rễ sâu]    |   Chunk (1, 1) [Tầng sét & Mạch nước nông]
   ----------------------------------------+---------------------------------------
   Chunk (0, 2) [Hang đá vôi Karst ngầm]   |   Chunk (1, 2) [Tầng đá nứt & Đáy hang]
```

### 2.2 Hệ Thống Tọa Độ Xác Định (Coordinate System)
- **Global Cell Coordinates $(x, y)$:** $1\text{ unit} = 32\text{px}$.
  - $x \in \mathbb{Z}$: Tọa độ ô toàn cục theo phương ngang.
  - $y \in \mathbb{Z}$: Tọa độ ô toàn cục theo chiều sâu ($y = 0$ là mặt đất cơ sở, $y > 0$ là lòng đất).
- **Chunk Coordinates $(cx, cy)$:**
  $$cx = \lfloor x / 64 \rfloor, \quad cy = \lfloor y / 64 \rfloor$$
- **Local Cell Coordinates $(lx, ly)$ trong Chunk:**
  $$lx = ((x \pmod{64}) + 64) \pmod{64}, \quad ly = ((y \pmod{64}) + 64) \pmod{64}$$

---

## 3. DETERMINISTIC GENERATION & TÁCH BIỆT DELTA STATE

### 3.1 Nguyên Tắc Ổn Định Seed Tuyệt Đối (Order-Independent Generation)
- Thuật toán sinh địa hình nền dựa hoàn toàn vào hàm toán học thuần túy:
  $$\text{CellBaseState} = f(\text{WorldSeed}, GlobalX, GlobalY)$$
- **Tính độc lập thứ tự sinh (Order-Independence):** Cho dù Chunk $(1, 0)$ được nạp trước hay Chunk $(0, 0)$ nạp trước, giá trị sinh ra tại ô $(x, y)$ luôn giống nhau $100\%$, không phụ thuộc vào trạng thái bộ sinh ngẫu nhiên toàn cục (PRNG sequence independence).

```
+------------------------------------------------------------------------+
| 1. DETERMINISTIC BASE LAYER (Không lưu vào Save File)                  |
| Sinh tự động từ: WorldSeed + (GlobalX, GlobalY) qua Perlin/Simplex     |
| Kết quả luôn đồng nhất 100% trên mọi máy client.                       |
+------------------------------------------------------------------------+
                                  +
+------------------------------------------------------------------------+
| 2. PLAYER MODIFICATION DELTA LAYER (Được lưu bền vững)                 |
| Chỉ lưu các ô bị người chơi tác động:                                  |
| - Ô bị đào rỗng (Dug cell) theo cọ đào 32px                            |
| - Ô được đắp bùn sét (Filled cell từ ClayMudStockpile)                 |
| - Nhánh rễ bị cắt đứt                                                  |
| - Túi nước ngầm hình thành mới                                         |
+------------------------------------------------------------------------+
                                  =
+------------------------------------------------------------------------+
| FINAL RUNTIME CELL STATE (Trạng thái hiển thị và vật lý thực tế)      |
+------------------------------------------------------------------------+
```

---

## 4. QUY TẮC ĐỒNG BỘ BIÊN GIỚI CHUNK (CROSS-CHUNK BOUNDARY RULES)

Để ngăn ngừa lỗi rạn nứt địa hình (Edge Seams), đứt dòng nước hoặc gián đoạn đường đi của kiến tại mép các Chunk ($lx = 63 \leftrightarrow lx = 0$):

1. **Dig / Fill Across Boundaries:**
   - Khi cọ đào/lấp quét qua đường biên giữa hai Chunk, thao tác được tách thành hai giao dịch nguyên tử (Atomic Sub-actions). Nếu Chunk bên cạnh chưa nạp vào RAM, thay đổi được ghi trực tiếp vào Delta Record của Chunk đó trong IndexedDB, không làm mất dữ liệu.
2. **Dòng Thủy Văn Xuyên Chunk (Cross-Chunk Fluid Balance):**
   - Sự kiện truyền thể tích nước qua mép biên được ghi nhận vào `CrossChunkBoundaryQueue`. Nước không bị chặn lại thành bức tường vô hình ở mép Chunk $64\text{ cells}$.
3. **Mạng Rễ Cây Xuyên Biên (Root Continuance):**
   - Rễ đại thụ từ Chunk $(0, 0)$ đâm sang Chunk $(1, 0)$ hoặc Chunk $(0, 1)$ duy trì vector hướng rễ liên tục dựa trên tọa độ pixel toàn cục.
4. **Hierarchical Pathfinding Across Chunks (HPA*):**
   - Đồ thị tìm đường của đàn kiến sử dụng các cổng biên giới (Boundary Portals) tại các ô kết nối giữa hai Chunk kề nhau, cho phép kiến tìm đường xuyên biên mà không cần nạp toàn bộ các Chunk trung gian vào bộ nhớ PixiJS.

---

## 5. PERSISTENCE SCHEMA, VERSIONING & PHỤC HỒI DỮ LIỆU

### 5.1 Quản Lý Phiên Bản Lưu Trữ (Save Schema Versioning)
Mọi bản lưu Delta đều mang thông tin phiên bản cấu trúc dữ liệu (`schemaVersion`) để đảm bảo khả năng nâng cấp ngược tương thích:

```typescript
export interface CellDeltaRecord {
  readonly localIndex: number; // lx + ly * 64 (0..4095)
  readonly modifiedType: 'AIR_DUG' | 'CLAY_FILLED' | 'ROOT_SEVERED' | 'WATER_POCKET';
  readonly moistureLevel?: number;
}

export interface ChunkDeltaState {
  readonly chunkX: number;
  readonly chunkY: number;
  readonly timestamp: number;
  readonly deltas: CellDeltaRecord[];
}

export interface WorldSaveManifestV1 {
  readonly schemaVersion: '1.0.0';
  readonly worldSeed: number;
  readonly createdAt: number;
  readonly lastSavedAt: number;
  readonly activeChunks: string[]; // "cx,cy"
}
```

### 5.2 Cơ Chế Phục Hồi & Tự Sửa Lỗi (Data Recovery & Fallback)
- Nếu dữ liệu Delta của một Chunk trong IndexedDB bị lỗi (Corrupted CRC check), hệ thống tự động loại bỏ Delta lỗi và tái tạo lại Chunk từ `Deterministic Base Layer`, đồng thời ghi log cảnh báo thay vì làm treo toàn bộ ứng dụng.

---

## 6. ACCEPTANCE CRITERIA
- [x] Khóa thông số lưới V1: Cell $32 \times 32\text{ px}$, Chunk $64 \times 64\text{ cells}$ ($2.048 \times 2.048\text{ px}$).
- [x] Tách rời tuyệt đối Base Layer (Order-Independent Seed) và Delta Layer.
- [x] Quy tắc xử lý biên giới Chunk chi tiết cho Dig/Fill, Nước, Rễ cây và Tìm đường kiến.
- [x] Định nghĩa Schema Versioning và cơ chế phục hồi dữ liệu an toàn.
