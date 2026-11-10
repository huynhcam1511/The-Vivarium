# BIOME DEFINITION MATRIX V1
**Project:** THE VIVARIUM  
**Branch:** `task/021-world-integration`  
**Classification:** Architecture Specification / Non-Runtime Document  
**Status:** DESIGN APPROVED (Game Director Review Aligned) / IMPLEMENTATION HOLD  
**Author:** Antigravity (World Architecture Division — Branch 04)  
**Date:** 2026-11-11  
**Revision:** R1 (Director QA Correction Applied)  

---

## 1. SCOPE & OVERVIEW

Tài liệu này xác lập chi tiết ma trận tham số sinh thái, địa chất, mối nguy và tài nguyên cho toàn bộ 8 Biome của *THE VIVARIUM*. Định dạng giao diện dữ liệu trừu tượng (**TypeScript Data Contracts**) đóng vai trò chuẩn mực giao tiếp trong thiết kế, định hình cấu trúc dữ liệu JSON/TypeScript tương lai mà không tạo runtime code trong giai đoạn này.

Mọi giá trị không gian đều ánh xạ chuẩn xác trên hệ thống lưới **$32 \times 32\text{ px/cell}$**.

---

## 2. DATA CONTRACTS SPECIFICATION (DESIGN-ONLY TYPESCRIPT INTERFACES)

> **LƯU Ý:** Các định nghĩa dưới đây thuần túy phục vụ đặc tả thiết kế, **không** biên dịch thành file `.ts` trong thư mục thực thi `src/`.

```typescript
/** Phân loại Biome */
export type BiomeCategory = 'SURFACE' | 'SUBTERRANEAN';

/** Mã định danh chuẩn của 8 Biome */
export type BiomeId =
  | 'ancient_forest'
  | 'breeze_meadow'
  | 'wetland_marsh'
  | 'coastal_dunes'
  | 'arid_canyon'
  | 'cold_forest'
  | 'limestone_caverns'
  | 'crystal_depths';

/** Tham số khí hậu đặc thù */
export interface ClimateProfile {
  readonly baseTemperatureCelsius: number; // Nhiệt độ nền (°C)
  readonly temperatureDiurnalRange: number; // Biên độ dao động ngày/đêm
  readonly humidityPercent: number;        // Độ ẩm không khí (0 - 100%)
  readonly precipitationFrequency: number; // Tần suất mưa (0.0 - 1.0)
  readonly surfaceWindIntensity: number;   // Cường độ gió bề mặt (0.0 - 1.0)
}

/** Tham số địa chất và cơ học đất (Quy chuẩn trên cell 32x32px) */
export interface GeologyProfile {
  readonly topsoilType: string;            // Loại đất bề mặt (humus, sand, clay, loess, gravel)
  readonly soilCohesionFactor: number;     // Độ gắn kết (0.0: dễ sạt lở cát, 1.0: vững chắc)
  readonly diggingDifficulty: number;      // Độ cản đào xới (1: nhanh, 5: rất cứng)
  readonly hydraulicConductivity: number;  // Độ thấm nước (tốc độ thấm ngầm mm/h)
  readonly subterraneanVoidTendency: number; // Tỉ lệ xuất hiện hốc/hang tự nhiên (0.0 - 1.0)
}

/** Sinh vật và thảm thực vật (Hand-Painted Visual Assets) */
export interface EcologyProfile {
  readonly dominantVegetation: string[];   // Các loài thực vật chính
  readonly rareFlora: string[];            // Loài hiếm/đặc hữu
  readonly indigenousFauna: string[];      // Sinh vật bản địa (Future Integration Contract)
  readonly decompositionRate: number;      // Tốc độ phân giải xác hữu cơ thành mùn
}

/** Mối nguy tự nhiên và tài nguyên */
export interface EnvironmentalHazardProfile {
  readonly primaryHazards: string[];       // Lũ quét, sạt lở, đóng băng, cát lún
  readonly hazardTriggerThreshold: number; // Ngưỡng kích hoạt
}

export interface ResourceProfile {
  readonly harvestableResources: string[]; // Gỗ mục, bùn sét, hạt giống, mật ong, v.v.
  readonly soilNutrientYield: number;      // Giá trị dinh dưỡng cung cấp cho nấm/thực vật
}

/** Data Contract đầy đủ của một Biome */
export interface BiomeDefinition {
  readonly biomeId: BiomeId;
  readonly category: BiomeCategory;
  readonly isOptionalFantasy: boolean;
  readonly climate: ClimateProfile;
  readonly geology: GeologyProfile;
  readonly ecology: EcologyProfile;
  readonly hazards: EnvironmentalHazardProfile;
  readonly resources: ResourceProfile;
  readonly depthRules: {
    readonly minDepthY: number;            // Độ sâu ô tối thiểu (Cell Y: 1 cell = 32px)
    readonly maxDepthY: number;            // Độ sâu ô tối đa
    readonly bedrockTransitionY: number;   // Ngưỡng chuyển tiếp sang tầng đá nền
  };
}
```

---

## 3. CHI TIẾT MA TRẬN 8 BIOMES

### 3.1 Nhóm Sinh Cảnh Bề Mặt (Surface Biomes)

#### 01. Ancient Forest (Rừng cổ thụ)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ nền $18^\circ\text{C}$ (dao động $\pm 4^\circ\text{C}$ nhờ tán sồi rậm che chắn); độ ẩm $85\%$; gió bề mặt nhẹ ($0.2$); mưa dồi dào.
- **Địa chất:** Đất mùn hữu cơ dày ($0 - 25\text{ cells}$ sâu, tương đương $800\text{px}$). Rễ cây đại thụ phân nhánh dày đặc cản trở đào thẳng hàng nhưng tạo giàn chống tự nhiên.
- **Sinh thái:** Tán sồi cổ thụ (Stylized Hand-Painted), nấm hoại sinh phân giải gỗ rụng. Nấm phát quang là sinh vật hiếm ở hốc tối chân rễ.
- **Mối nguy:** Gỗ mục sụp đổ cục bộ khi đào rỗng quá mức; bóng râm cản ánh sáng cây non.
- **Tài nguyên:** Mùn hữu cơ giàu dưỡng chất, phôi nấm ăn, gỗ mục, mật ong đại ngàn.

#### 02. Breeze Meadow (Đồng cỏ gió)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ nền $22^\circ\text{C}$ (dao động $\pm 6^\circ\text{C}$); độ ẩm $60\%$; gió bề mặt liên tục ($0.7$); mưa đều đặn theo mùa.
- **Địa chất:** Đất thịt mềm (Loam), rễ cỏ nông ($0 - 6\text{ cells}$, tương đương $0 - 192\text{px}$). Độ gắn kết $0.65$, đào xới nhanh và an toàn.
- **Sinh thái:** Cỏ lau, cúc vàng dại (Golden Daisy), cỏ ba lá trắng (White Clover), bướm, dế mèn, giun đất.
- **Mối nguy:** Gió giật cuốn bay hạt giống và đất đắp chưa nén; nguy cơ cháy cỏ khô cuối hè.
- **Tài nguyên:** Hạt giống cỏ hoa, mật hoa tươi, sợi cỏ dệt tổ, ấu trùng côn trùng.

#### 03. Wetland & Marsh (Đầm lầy & Vùng ngập nước)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ $25^\circ\text{C}$ (dao động $\pm 3^\circ\text{C}$); độ ẩm cực cao $95\%$; mưa rào dày đặc; gió đọng.
- **Địa chất:** Đất bùn sét nhão (Silt & Clay), bão hòa nước ngầm. Độ gắn kết thấp khi ướt ($0.3$), hố đào dễ bị sụt mép và ngập nước nếu không dẫn dòng.
- **Sinh thái:** Bèo tây, lau sậy thân rỗng, rêu than bùn, ấu trùng bọ nước, ốc sên bùn.
- **Mối nguy:** Lũ úng tức thì sau mưa; ngạt nước trong hầm trũng; bùn nhão cản trở di chuyển.
- **Tài nguyên:** Khối bùn sét nén (nguyên liệu cốt lõi cho `ClayMudStockpile` xây tổ), than bùn, nước thô.

#### 04. Coastal Dunes (Cồn cát ven biển)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ nền $28^\circ\text{C}$ (dao động $\pm 10^\circ\text{C}$); độ ẩm $50\%$; gió biển mạnh ($0.85$); bốc hơi cao.
- **Địa chất & Cơ học:** Cát mịn không kết dính (Cohesion $0.1$). Đào hầm bắt buộc phải có trụ chống hoặc đắp bùn sét gia cố; nếu không cát sẽ sụt lở ngay lập tức theo góc trượt tự nhiên.
- **Thủy văn đặc thù (Hydrology):** Có **thấu kính nước ngọt (Freshwater Lens)** nổi trên tầng nước mặn. Đào quá sâu hoặc khai thác quá mức sẽ gây xâm nhập mặn (Saline Intrusion), hủy hoại thảm thực vật nước ngọt.
- **Sinh thái:** Cỏ chịu mặn, xương rồng biển, bọ hung cát, bọ cạp nhỏ ăn đêm.
- **Mối nguy:** Cát lún, bão cát di chuyển đụn cát, xâm nhập mặn tầng nước ngầm.
- **Tài nguyên:** Cát thạch anh lọc nước, muối khoáng tự nhiên, hạt chịu hạn.

#### 05. Arid Canyon (Hẻm núi khô cằn)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ nền $32^\circ\text{C}$ (dao động ngày/đêm cực đại $\pm 18^\circ\text{C}$); độ ẩm thấp $25\%$; gió lốc hẹp trong khe vực.
- **Địa chất & Cơ học khai thác:** Vách đá phiến nhiều tầng nứt nẻ. Kiến **không** sử dụng công cụ đục kim loại; kiến bám vào các khe nứt tự nhiên, gắp từng mảnh đất xốp và vụn đá phong hóa để mở rộng hang hốc.
- **Sinh thái:** Bụi gai khô rụng lá, thằn lằn vách đá, bọ cánh cứng ngưng tụ sương sớm.
- **Mối nguy:** Sốc nhiệt cực hạn; đá lăn từ vách cao; lũ bùn quét hiếm hoi nhưng tàn khốc khi mưa rào bất chợt.
- **Tài nguyên:** Khoáng oxit kết tủa, phiến đá mỏng che chắn hầm, tinh thể lưu huỳnh tự nhiên.

#### 06. Cold Forest (Rừng tuyết lạnh)
- **Category:** `SURFACE` | **Fantasy Flag:** `false`
- **Khí hậu:** Nhiệt độ nền $-6^\circ\text{C}$ (dao động $-15^\circ\text{C}$ đến $+2^\circ\text{C}$); độ ẩm $70\%$; bão tuyết định kỳ.
- **Địa chất hai tầng (Permafrost vs Seasonal Frost):**
  - *Tầng đóng băng theo mùa (Active Layer, $0 - 15\text{ cells}$ sâu):* Đóng băng cứng vào mùa đông, rã đông vào mùa hè. Khi rã đông, đất nhão gây sụt lún cơ học nghiêm trọng (Thermokarst).
  - *Tầng băng vĩnh cửu (Continuous Permafrost, $>15\text{ cells}$ sâu):* Nền đất đá bị xi măng hóa bởi băng vĩnh cửu, độ cứng cực cao, cản trở đào tuyệt đối nếu không có nguồn nhiệt làm mềm.
- **Sinh thái:** Thông lá kim cổ thụ, địa y chịu rét, rêu băng tuyết, bọ tuyết ngủ đông.
- **Mối nguy:** Đóng băng nguồn nước lỏng; hạ thân nhiệt sinh vật; đất lún do rã đông tầng hoạt tính.
- **Tài nguyên:** Băng tinh khiết (tan thành nước ngọt sạch), gỗ thông dẻo chống mối mọt, nhựa thông cách nhiệt.

---

### 3.2 Nhóm Sinh Thái Lòng Đất (Subterranean Biomes)

#### 07. Limestone Caverns (Hang karst đá vôi)
- **Category:** `SUBTERRANEAN` | **Fantasy Flag:** `false`
- **Khí hậu & Vi khí hậu ngầm:** Nhiệt độ ổn định $16^\circ\text{C}$ quanh năm (không phụ thuộc chu kỳ bề mặt); độ ẩm $100\%$; không có gió tự nhiên ngoài đối lưu áp suất hang.
- **Địa chất & Thủy văn Karst (Karst Aquifer):** Vòm đá vôi xói mòn tự nhiên, kèm nhũ đá (Stalactite/Stalagmite).
  - *Dòng chảy Karst:* Nước không thấm chậm mà di chuyển nhanh thành các dòng suối ngầm áp lực qua các khe nứt lớn và ống dẫn karst rỗng. Nước mưa từ Ancient Forest trên bề mặt có thể xả xuống hang chỉ sau vài phút mô phỏng.
- **Sinh thái:** Nấm hang không quang hợp, bọ hang mù mất sắc tố, dơi làm tổ trên trần cao.
- **Mối nguy:** Nhũ đá rơi gãy; ngập lụt tức thời khi hố sụt bề mặt dồn nước; túi khí ngạt thiếu oxy.
- **Tài nguyên:** Bột đá vôi khử chua, nước ngầm siêu sạch lọc qua đá, phân dơi giàu nitrat (Guano) làm phân bón hữu cơ cao cấp.

#### 08. Crystal Depths (Vực tinh thể sâu)
- **Category:** `SUBTERRANEAN` | **Fantasy Flag:** `true` *(NỘI DUNG GIẢ TƯỞNG / TÙY CHỌN)*
- **Nguyên tắc thiết kế:** Tuyệt đối không áp đặt phóng xạ hay năng lượng hạt nhân giả tưởng vào quy luật sinh thái mặc định của The Vivarium.
- **Khí hậu:** Nhiệt độ ấm $28 - 35^\circ\text{C}$ do tiếp giáp nhiệt lượng lòng đất; áp suất nén cao.
- **Địa chất:** Vòm tinh thể rỗng khổng lồ (Geode) trên nền đá bazan cứng. Tinh thể silicat, thạch anh và fluorite phản chiếu ánh sáng tự nhiên từ nhiệt khoáng.
- **Sinh thái:** Nấm tinh thể dạng sợi vô cơ, vi khuẩn ưa nhiệt, bọ giáp khoáng cứng.
- **Mối nguy:** Mảnh tinh thể sắc nhọn; hơi khí lưu huỳnh nóng từ mạch nứt; hang sâu khó thông khí.
- **Tài nguyên:** Tinh thể quang học, khối thạch anh trữ nhiệt, khoáng chất kết tinh quý hiếm.

---

## 4. ACCEPTANCE CRITERIA
- [x] Mọi quy tắc và kích thước cell được chuẩn hóa theo hệ lưới $32 \times 32\text{ px}$.
- [x] Phân định rõ khoa học tự nhiên: Băng vĩnh cửu vs Đất đóng băng mùa (Cold Forest); Thấu kính nước ngọt (Coastal Dunes).
- [x] Kiến khai thác Arid Canyon thuần cơ học tự nhiên loài kiến.
- [x] Định dạng TypeScript Interface thiết kế, không tạo code runtime.
