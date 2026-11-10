# DEPTH COUPLING SYSTEM BLUEPRINT
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & OBJECTIVE

Hệ thống **Depth Coupling** (Tương tác liên tầng theo chiều sâu) định nghĩa các cơ chế vật lý và sinh thái tương tác giữa sinh cảnh bề mặt (Surface Biome), tầng đất trung gian và sinh thái ngầm (Subterranean Biome). 

Mục tiêu cốt lõi: Thế giới không phải là các lớp đồ họa xếp chồng rời rạc, mà là một thể thống nhất hữu cơ. Bốn trụ cột tương tác được mô hình hóa theo nguyên lý **mô phỏng đơn giản hóa có kiểm soát (Simplified Controlled Simulation)**, chạy theo chu kỳ Tick thời gian thưa (Tick-based / Cellular Automata thưa), không giải hệ phương trình vi phân phức tạp ở từng frame nhằm đảm bảo ngân sách CPU/RAM trên nền tảng Web.

Toàn bộ đơn vị không gian ánh xạ trên hệ lưới tiêu chuẩn **$32 \times 32\text{ px/cell}$**.

---

## 2. BỐN MÔ HÌNH TƯƠNG TÁC CHIỀU SÂU CỐT LÕI

```
  [BỀ MẶT: Mưa, Nắng, Gió, Thảm thực vật Stylized Hand-Painted]
        │                   │                   │                   │
        ▼ (Thấm nước)       ▼ (Khuếch tán nhiệt)▼ (Thông khí)       ▼ (Neo giữ cơ học)
    1. HYDROLOGY         2. TEMPERATURE       3. VENTILATION        4. STRUCTURAL ROOTS
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
  [LÒNG ĐẤT: Đất mùn -> Tầng sét -> Hang Karst ngầm -> Tầng đá gốc sâu]
```

### 2.1 Mô Hình 1: Thủy Văn Liên Tầng (Hydrology Flow)
Nước mưa bề mặt thấm xuống lòng đất theo hai phương thức thủy văn phân biệt:

1. **Thấm chậm qua chất nền xốp (Porous Matrix Infiltration):**
   - Áp dụng cho: *Ancient Forest*, *Breeze Meadow*, *Wetland*.
   - Nguyên lý: Nước ngấm từ từ qua các cell đất ($32\text{px}$) theo hệ số thấm ($K_{\text{sat}}$). Khi tầng đất đạt độ bão hòa, nước dư thừa nhỏ giọt xuống trần các hang động bên dưới hoặc tạo thành vũng trũng.
2. **Dòng chảy nhanh qua mạng lưới Karst (Rapid Conduit Karst Transport):**
   - Áp dụng cho: *Limestone Caverns*.
   - Khác biệt với đất xốp: Nước mặt rơi vào các hố sụt (Sinkholes) hoặc rãnh nứt đá vôi xả trực tiếp thành thác/suối ngầm chảy xiết theo các ống rỗng karst. 
   - Hệ quả gameplay: Mưa bão trên Ancient Forest có thể gây ngập úng bất ngờ tại các khoang hang Limestone Caverns nằm sâu bên dưới chỉ sau vài phút mô phỏng.

### 2.2 Mô Hình 2: Truyền Dẫn Nhiệt Độ (Heat & Thermal Damping)
Nhiệt độ môi trường ngầm không biến thiên đột ngột như mặt đất mà được giảm chấn theo độ sâu $Y$ (tính theo số cells $32\text{px}$):

- **Công thức suy giảm biên độ nhiệt (Thermal Damping Function):**
  $$\Delta T(Y) = \Delta T_{\text{surface}} \cdot e^{-Y / D_{\text{thermal}}}$$
  Trong đó $D_{\text{thermal}}$ là hằng số suy giảm nhiệt của loại đất đá (quy chuẩn $D_{\text{thermal}} \approx 20\text{ cells} = 640\text{px}$).
- **Quy luật:**
  - Ở bề mặt ($Y = 0$): Chênh lệch nhiệt ngày/đêm rất rõ nét (đặc biệt tại *Arid Canyon* lên tới $\pm 18^\circ\text{C}$).
  - Ở tầng sâu ($Y > 40\text{ cells} = 1.280\text{px}$): Biên độ ngày/đêm bị triệt tiêu gần như hoàn toàn. Hang đá vôi (*Limestone Caverns*) luôn giữ nhiệt độ mát mẻ ổn định ($15 - 16^\circ\text{C}$), đóng vai trò nơi trú ẩn lý tưởng cho đàn kiến khi bề mặt quá nóng hoặc bão tuyết rét buốt.

### 2.3 Mô Hình 3: Khí Quyển & Thông Gió Hang Động (Gas & Cave Ventilation)
Môi trường ngầm phụ thuộc vào sự lưu thông dưỡng khí:

- **Chỉ số chất lượng khí (Air Quality Index - $Q_{\text{air}}$):**
  - Dao động từ $1.0$ (không khí tươi sạch) đến $0.0$ (ngạt khí/tụ khí $CO_2$ hoặc khí độc hữu cơ).
- **Quy tắc trao đổi khí:**
  - Các khoang hang đào kín, không có lối thông lên mặt đất hoặc hang khác sẽ bị giảm dần $Q_{\text{air}}$ do sinh vật thở và chất hữu cơ phân hủy.
  - Khi đàn kiến đào thông một đường hầm mới nối khoang kín với bề mặt hoặc nối hai hang có chênh lệch áp suất nhiệt độ, **luồng đối lưu gió (Chimney Effect)** sẽ tự động kích hoạt, hồi phục $Q_{\text{air}}$ về mức an toàn.

### 2.4 Mô Hình 4: Hệ Rễ & Tính Toàn Vẹn Cấu Trúc (Roots & Structural Stability)
Mối liên kết cơ học giữa cây đại thụ và độ ổn định địa chất lòng đất:

- **Mạng lưới neo giữ (Root Reinforcement Grid):**
  - Rễ sồi cổ thụ (*Ancient Forest Oak V5*) ăn sâu xuống lòng đất, các nhánh rễ đan xen tạo thành khung giàn chịu lực tự nhiên cho đất mùn.
  - Các ô đất $32\text{px}$ nằm trong bán kính ảnh hưởng của rễ đại thụ ($R_{\text{root}}$) được tăng $300\%$ độ gắn kết cơ học ($C_{\text{soil}}$), ngăn ngừa hoàn toàn nguy cơ sạt lở hoặc sụt trần hang.
- **Rủi ro đứt rễ:**
  - Nếu thao tác Dig/Fill của người chơi làm đứt các nhánh rễ chịu lực chính, trần hầm bên dưới sẽ mất liên kết neo và có nguy cơ sụp đổ khi chịu tải trọng bề mặt lớn hoặc khi ngập nước.

---

## 3. THUẬT TOÁN ĐIỀU PHỐI ĐƠN GIẢN HÓA (ALGORITHMIC DESIGN)

Để không vượt quá ngân sách thời gian CPU:
1. **Phân vùng cập nhật thưa (Sparse Tick Updating):**
   - Chỉ cập nhật mô hình thấm nước và truyền nhiệt trên các cột Chunk đang hoạt động (Active Streaming Chunks).
   - Tần suất tick: Thủy văn chạy $2\text{Hz}$ (2 lần/giây), Nhiệt độ và Thông khí chạy $0.5\text{Hz}$ (1 lần mỗi 2 giây).
2. **Quy tắc xử lý biên Chunk đối với nước và khí (Cross-Chunk Boundary Rules):**
   - Nước chảy qua mép biên ($x = 63$ sang $x = 0$ của Chunk kế cận) được đưa vào hàng đợi `CrossChunkFlowQueue`. Nếu Chunk kế cận chưa nạp, lưu lượng nước được cộng dồn vào Delta Layer của Chunk đó và chỉ áp dụng khi Chunk thức tỉnh.

---

## 4. DESIGN-ONLY DATA CONTRACTS (TYPESCRIPT)

```typescript
export interface SubterraneanCellCouplingState {
  readonly cellX: number;
  readonly cellY: number;
  waterSaturation: number;       // Mức bão hòa nước (0.0 - 1.0)
  temperatureCelsius: number;    // Nhiệt độ hiện thời (°C)
  airQualityIndex: number;       // Chất lượng dưỡng khí (0.0 - 1.0)
  structuralIntegrity: number;   // Độ bền chịu lực vòm trần (0.0 - 1.0)
  hasRootReinforcement: boolean; // Có được rễ cổ thụ neo giữ không
  isKarstConduit: boolean;       // Có phải ống dẫn karst suối ngầm không
}

export interface DepthInteractionRules {
  readonly cellSizePixels: 32;   // Khóa bất biến 32px
  readonly infiltrationRatePerTick: number;
  readonly thermalDiffusionFactor: number;
  readonly ventilationDecayPerEntity: number;
  readonly collapseThresholdModifier: number;
}
```

---

## 5. ACCEPTANCE CRITERIA
- [x] Mô hình hóa 4 tương tác sâu chuẩn xác trên hệ lưới $32 \times 32\text{ px}$.
- [x] Làm rõ cơ chế thủy văn Karst chảy xiết nhanh khác biệt hoàn toàn với thấm chậm đất mùn.
- [x] Thiết kế theo nguyên tắc "Mô phỏng đơn giản hóa có kiểm soát", tần suất cập nhật thưa (Tick-based), bảo toàn ngân sách CPU.
- [x] Xác định rõ quy tắc xử lý biên Chunk cho thủy văn và chất lượng khí.
