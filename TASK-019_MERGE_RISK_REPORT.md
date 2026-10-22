# TASK-019 MERGE RISK & CONFLICT RESOLUTION REPORT
## PACK-004 AQUATIC vs SIBLING BRANCHES (TASK-018, TASK-020, MAIN)

> **Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/GAME/.worktrees/task-019-aquatic`  
> **Branch:** `task/019-aquatic`  
> **Base Commit:** `6c28a32`  
> **Current Commit:** `6b36635`  
> **Evaluation:** CONDITIONAL PASS — ENGINEERING PROTOTYPE / ART QA NOT APPROVED

---

## 1. Phân Tích Xung Đột Tiềm Năng Giữa TASK-019 và TASK-020

Cả 2 nhánh `task/019-aquatic` và `task/020-weather` đều được phân nhánh từ cùng base commit `6c28a32`. Khi rà soát chi tiết mã nguồn bị sửa đổi, chỉ có đúng **2 file** có xung đột hunk:

### File 1: `the-vivarium-web/src/App.tsx`
- **Nguyên nhân xung đột:**
  - `task/019-aquatic` thêm import `AquaticShowcaseScene` và kiểm tra route `?mode=aquatic`.
  - `task/020-weather` thêm import `WeatherShowcaseScene` và kiểm tra route `?mode=weather`.
  - Cả 2 nhánh cùng chèn vào dòng 9-16 ngay trước `isEnvPreviewMode`.
- **Mức độ rủi ro:** THẤP (Trivial Hunk Conflict). Logic hoàn toàn trực giao (orthogonal).
- **Phương án tích hợp an toàn đề xuất (Unified Integration):**
```typescript
import { AssetPreviewScene } from './components/AssetPreviewScene';
import { EnvironmentPreviewScene } from './components/EnvironmentPreviewScene';
import { AquaticShowcaseScene } from './aquatic/AquaticShowcaseScene';
import { WeatherShowcaseScene } from './weather/WeatherShowcaseScene';
import type { ToolType, TimeSpeed } from './types';

export const App: React.FC = () => {
  // Standalone showcase routes
  const isAquaticMode = window.location.search.includes('mode=aquatic');
  if (isAquaticMode) return <AquaticShowcaseScene />;

  const isWeatherMode = window.location.search.includes('mode=weather');
  if (isWeatherMode) return <WeatherShowcaseScene />;

  const isEnvPreviewMode = window.location.search.includes('mode=environment-preview');
  if (isEnvPreviewMode) return <EnvironmentPreviewScene />;

  const isPreviewMode = window.location.search.includes('mode=preview');
  if (isPreviewMode) return <AssetPreviewScene />;
```

### File 2: `the-vivarium-web/tsconfig.app.json`
- **Nguyên nhân:** Cả 2 nhánh cùng thực hiện **chính xác 100% cùng một thay đổi**:
  - Dòng 7: `"types": ["vite/client", "node"]` (thêm node type cho native `node:test`).
  - Dòng 25: `"exclude": ["src/**/*.test.ts"]` (ngăn bundler bundle các file unit test vào production dist).
- **Mức độ rủi ro:** KHÔNG CÓ (Idempotent / Fast-forward compatible). Git sẽ tự động hòa giải sạch sẽ (3-way merge tự resolved).

---

## 2. Xác Nhận Trạng Thái Các Interface Weather / Aquatic

Các interface liên kết giữa hai hệ thống được định nghĩa trong:
- `the-vivarium-web/src/aquatic/AquaticTypes.ts` (`IAquaticEnvironment`)
- `the-vivarium-web/src/weather/WeatherTypes.ts` (`IEnvironmentalAtmosphere`)

**XÁC NHẬN CHÍNH THỨC:**
> Hiện tại, các interface này **CHỈ Ở TRẠNG THÁI THIẾT KẾ HỢP ĐỒNG (DESIGN CONTRACTS)**.
> - `AquaticSystem.applyRainInflow(rate, dt)` và `evaporateWater(rate, dt)` đã được unit test nội bộ độc lập (`AquaticSystem.test.ts`), pass 6/6 test.
> - `WeatherSystem.getAquaticRainInflow()` đã được unit test nội bộ độc lập (`WeatherSystem.test.ts`), pass 6/6 test.
> - **CHƯA ĐƯỢC NGHIỆM THU KẾT NỐI RUNTIME THỰC TẾ GIỮA 2 ENGINE**.
> - Không tự ý import `WeatherSystem` vào `task/019-aquatic` và ngược lại để đảm bảo nguyên tắc phân tách nhiệm vụ độc lập (Parallel Isolation).
> - Việc nối dây dữ liệu thực tế (wiring runtime) sẽ được thực hiện tại **Sprint Integration (PACK-005/PACK-006)** sau khi Game Director phê duyệt cả hai gói.

---

## 3. Rủi Ro Tích Hợp Với Hệ Thống Đất & Hang Ngầm (TASK-018 / PACK-003)

- **Biên giới hình học:** Lòng hồ nằm ở khoảng tọa độ $X \in [1350, 1980]$, độ sâu $Y \in [570, 750]$.
- **Rủi ro đào xuyên thủng đáy hồ:** Nếu người chơi hoặc kiến thợ đào đất (`digRadius`) tại khu vực này trong `OrganicTerrainData`, nguy cơ hình thành hang rỗng dưới lòng hồ nhưng nước không tràn xuống (do 2 layer render tách rời).
- **Giải pháp kiểm soát:**
  1. Hợp đồng `IAquaticEnvironment.getSedimentMoisture()` sẽ báo độ ẩm bão hòa ($1.0$) cho các cell liền kề.
  2. Bổ sung cờ `isBasinBoundary(cx, cy)` trong `SubterraneanGrid` để ngăn lệnh Dig phạm vi lòng hồ cho đến khi có cơ chế Flood simulation.
