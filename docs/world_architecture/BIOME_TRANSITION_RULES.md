# BIOME TRANSITION RULES
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & OBJECTIVE

Tài liệu này xác định các quy tắc toán học, thuật toán pha trộn và chuẩn mực chuyển tiếp tự nhiên (**Natural Biome Transitions**) giữa các sinh cảnh liền kề trong *THE VIVARIUM*. 

Mục tiêu cốt lõi: Ngăn chặn hiện tượng "chia cắt gãy góc thô bạo" (Harsh Cutoffs) khi hai Biome tiếp giáp nhau. Thay vào đó, thế giới tự nhiên chuyển hóa mượt mà qua các vùng đệm sinh thái (Ecotones) thông qua thuật toán đa trường khí hậu (Multi-Field Whittaker/Noise Diagram).

**Định hướng mỹ thuật bắt buộc:** Toàn bộ quá trình chuyển tiếp phải bảo tồn phong cách **Stylized Hand-Painted 2D** (các vệt cọ vẽ tay hữu cơ, chuyển sắc mượt mà, phân tán tự nhiên của các asset thực vật). Tuyệt đối **không** áp dụng các thuật toán giả lập chấm hạt Pixel Art (Pixel Dithering) làm phá vỡ ngôn ngữ thị giác hiện hữu của *The Vivarium*.

---

## 2. THUẬT TOÁN ĐA TRƯỜNG PHÂN BỔ BIOME (MULTI-FIELD SAMPLING)

Mỗi vị trí toàn cục $x$ trên bề mặt thế giới được định đoạt bởi hai hàm số nhiễu Perlin/Simplex liên tục:

1. **Trường Nhiệt Độ $T(x)$ (Temperature Field):**
   $$T(x) = \text{Noise}_{\text{temp}}(x \cdot f_T) \in [-1.0, 1.0]$$
2. **Trường Độ Ẩm $M(x)$ (Moisture / Precipitation Field):**
   $$M(x) = \text{Noise}_{\text{moist}}(x \cdot f_M) \in [-1.0, 1.0]$$

### Biểu Đồ Không Gian Sinh Cảnh (Whittaker Ecoregion Matrix)
Hệ thống ánh xạ cặp giá trị $(T, M)$ để xác định Biome bề mặt:

```
    Độ ẩm (M)
        ▲
   1.0  │   [WETLAND & MARSH]          [ANCIENT FOREST]           [COLD FOREST]
        │    (Nhiệt cao, Rất ẩm)        (Ôn hòa, Ẩm ướt)          (Lạnh, Tuyết/Băng)
        │
   0.0  │   [COASTAL DUNES]            [BREEZE MEADOW]            [COLD FOREST]
        │    (Gió biển, Cát khô)        (Ôn hòa, Độ ẩm vừa)       (Tầng băng mỏng)
        │
  -1.0  │   [ARID CANYON]              [ARID CANYON]              [COLD TUNDRA/ROCK]
        │    (Nắng gắt, Cực khô)        (Hẻm nứt, Gió lốc)        (Băng vĩnh cửu)
        └────────────────────────────────────────────────────────────────────────► Nhiệt độ (T)
            -1.0                       0.0                        1.0
```

---

## 3. CƠ CHẾ PHA TRỘN VÙNG ĐỆM SINH THÁI HỮU CƠ (ORGANIC ECOTONE BLENDING)

Khi giá trị $(T, M)$ rơi vào ranh giới giữa hai Biome, hệ thống kích hoạt **vùng đệm chuyển tiếp có độ rộng $W_{\text{trans}} \approx 16 - 32\text{ cells}$** (tương đương $512 - 1.024\text{ world pixels}$):

```
[BIOME A: Ancient Forest]         [VÙNG CHUYỂN TIẾP HỮU CƠ: ECOTONE]         [BIOME B: Breeze Meadow]
Rừng rậm 100%                 75% Rừng / 25% Cỏ   50% / 50%   25% Rừng / 75% Cỏ      Đồng cỏ 100%
=====================> -----------------------------------------------------> =====================>
Tán sồi cổ thụ hand-painted  Cây bụi nhỏ vẽ tay        Cỏ cao, hoa dại rải rác         Thảm hoa cỏ dại
```

### 3.1 Kỹ Thuật Chuyển Tiếp Sơn Vẽ Hữu Cơ (Brush Density & Asset Scattering)
- Thay vì sử dụng Dithering kiểu 8-bit, hệ thống áp dụng kỹ thuật **phân tán mật độ cá thể (Organic Foliage Scattering)**:
  - Tỉ lệ xuất hiện của các asset vẽ tay (Tufts of grass, Wildflowers, Ferns) thay đổi dần theo hàm sigmoid chuyển tiếp $S(x)$.
  - Màu nền đất chuyển sắc mượt mà bằng cách pha trộn bảng màu (Color Ramp Interpolation) giữa mùn đen rừng già và đất thịt nâu sáng của đồng cỏ.

### 3.2 Quy Tắc Tương Hợp Giữa Các Cặp Biome Liền Kề

| Cặp Biome Tiếp Giáp | Hiện Tượng Chuyển Tiếp Tự Nhiên | Ràng Buộc Thổ Nhưỡng / Môi Trường |
| :--- | :--- | :--- |
| **Ancient Forest $\leftrightarrow$ Breeze Meadow** | Tán sồi thưa dần, nhường chỗ cho cây bụi thấp, hoa cúc vàng và cỏ ba lá xuất hiện; rễ đại thụ giảm mật độ. | Đất mùn đen chuyển dần thành đất thịt nâu sáng; độ cứng đất giảm dần. |
| **Breeze Meadow $\leftrightarrow$ Wetland & Marsh** | Đất cỏ xuất hiện các vũng nước đọng nông; cỏ meadow thay bằng lau sậy và bèo đầm lầy. | Độ ẩm đất tăng vọt từ $60\%$ lên bão hòa $100\%$; đất thịt chuyển thành bùn sét dẻo quánh. |
| **Breeze Meadow $\leftrightarrow$ Coastal Dunes** | Thảm cỏ rách đoạn, xuất hiện các cồn cát nhỏ đón gió; cỏ chân vịt chịu hạn xen kẽ. | Đất thịt chuyển dần sang cát rời; nguy cơ sạt lở tăng dần theo góc trượt tự nhiên. |
| **Ancient Forest $\leftrightarrow$ Limestone Caverns (Theo chiều sâu)** | Tầng rễ sồi ăn sâu vào các kẽ nứt đá vôi; nước từ rừng nhỏ giọt hình thành các mầm nhũ đá đầu tiên. | Đất mùn kết thúc ở độ sâu $Y \approx 30\text{ cells} = 960\text{px}$, chuyển tiếp sang đá vôi phong hóa có nhiều hốc rỗng. |

---

## 4. QUY TẮC CHUYỂN TIẾP TẦNG ĐỊA CHẤT THEO PHƯƠNG THẲNG ĐỨNG ($Y$-AXIS)

Để đảm bảo tính liên kết đa tầng (Depth Coupling), sự chuyển tiếp từ bề mặt xuống tầng sâu tuân theo hàm phân tầng liên tục:

```
Độ sâu Y (1 cell = 32px)
   │
 Y=0    [LỚP MẶT: TOPSOIL]       Đất mùn rừng (Ancient) / Đất cỏ (Meadow) / Cát (Dunes)
   │    ──────────────────────────────────────────────────────────────────────────────
 Y=20   [LỚP ĐỆM: SUBSOIL]       Đất sét đặc, vụn đá, rễ cọc bám sâu (640px)
   │    ──────────────────────────────────────────────────────────────────────────────
 Y=45   [LỚP NỨT NẺ: FRACTURED]  Đá phong hóa, khe nứt karst, suối ngầm thấm qua (1.440px)
   │    ──────────────────────────────────────────────────────────────────────────────
 Y=80+  [LỚP ĐÁ NỀN / HANG SÂU]  Hang đá vôi nguyên khối (Caverns) / Nền đá bazan (2.560px+)
   ▼
```

- **Hàm nhiễu đường biên tầng (Stratification Boundary Noise):**
  $$Y_{\text{boundary}}(x) = Y_{\text{nominal}} + \text{Noise}_{\text{strata}}(x \cdot f_S) \cdot A_S$$
  Nhờ có biên độ dao động $A_S$, ranh giới giữa tầng đất mùn và tầng đá không bao giờ là một đường kẻ ngang phẳng lì nhân tạo, mà uốn lượn lồi lõm nhấp nhô theo cấu trúc địa chất tự nhiên.

---

## 5. DESIGN-ONLY DATA CONTRACTS (TYPESCRIPT)

```typescript
export interface BiomeTransitionProfile {
  readonly biomeFrom: BiomeId;
  readonly biomeTo: BiomeId;
  readonly transitionWidthCells: number; // 16 đến 32 cells (512 - 1.024 px)
  readonly blendNoiseFrequency: number;
  readonly dominantTransitionFoliage: string[]; // Các loài thực vật vẽ tay vùng đệm
  readonly soilGradientLookup: {
    readonly stepRatio: number; // 0.0 .. 1.0
    readonly resultingSoilType: string;
    readonly cohesion: number;
  }[];
}
```

---

## 6. ACCEPTANCE CRITERIA
- [x] Định nghĩa toán học rõ ràng cho phân bổ Biome (Temperature & Moisture Noise sampling).
- [x] Chuẩn hóa phong cách chuyển tiếp Stylized Hand-Painted 2D, loại bỏ dán nhãn Pixel Dithering.
- [x] Mọi quy chuẩn kích thước chuyển tiếp ánh xạ chuẩn xác trên hệ lưới $32\text{px/cell}$.
- [x] Loại trừ hoàn toàn đường biên phân tầng phẳng nhân tạo bằng hàm dao động ngẫu nhiên $Y_{\text{boundary}}$.
