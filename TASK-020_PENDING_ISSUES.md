# TASK-020 PENDING ISSUES & INTEGRATION ROADMAP
## CHECKLIST-02 | PACK-005 — WEATHER & ATMOSPHERE

> **Module:** Weather & Atmospheric Simulation  
> **Worktree:** `C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/worktrees/task-020-weather`  
> **Commit:** `08a555a86bdebf139e497a2b1fce14445bbd7225`  
> **Evaluation Date:** 2026-10-20  

---

## 1. Visual & Effect Considerations (Hiệu ứng Mỹ thuật)

1. **Static Lightning Fork Geometry vs Multi-Branch Arc:**
   - *Current State:* Sấm sét hiển thị chớp sáng toàn màn hình (full-screen white flash exposure) kèm theo tia sét đa đoạn ngẫu nhiên.
   - *Recommendation for Future Polish:* Khi tích hợp shader cấp cao (GLSL / Pixi filter), có thể bổ sung hiệu ứng phân nhánh tia sét hữu cơ (branching fractal lightning) và rung lắc camera nhẹ (screen shake) khi sấm nổ.

2. **Raindrop Screen-Space Wrapping Near Edges:**
   - *Current State:* Hạt mưa rơi nghiêng theo góc gió và tự wrap lại khi vượt quá biên màn hình ($1920 \times 640$).
   - *Recommendation for Future Polish:* Khi camera di chuyển tự do qua zoom/pan không gian lớn, bounding box hạt mưa cần liên kết trực tiếp với viewport con trỏ của `CameraController`.

3. **Ground Splash Surface Conformance:**
   - *Current State:* Hiệu ứng giọt nước bắn tung (ground splash ripples) hiện tại kích hoạt ở độ cao tiếp xúc mặt đất $Y \approx 640\text{ px}$.
   - *Recommendation for Future Polish:* Có thể lấy trực tiếp tọa độ bề mặt nhấp nhô `terrainData.getSurfaceY(drop.x)` để các giọt nước bắn tung chính xác trên sườn đồi uốn lượn hữu cơ.

---

## 2. Performance & Scaling (Hiệu năng & Mở rộng)

1. **Object Pool Sizing on Mobile / Low-End Hardware:**
   - *Current State:* Hệ thống sử dụng đối tượng mảng tĩnh (object pool) gồm 750 hạt mưa và 60 lá rụng. Đạt 59–60 FPS ổn định trên desktop Chrome / WebGL.
   - *Recommendation:* Bổ sung tham số cấu hình chất lượng đồ họa (LOD đồ họa: Low = 250 drops, High = 750 drops) để tối ưu cho thiết bị cấu hình yếu hoặc thiết bị di động.

2. **Garbage Collection Safety:**
   - *Current State:* Không tạo mới object hay mảng trong vòng lặp `update()` chính, hoàn toàn tái sử dụng struct trong pool. Đã kiểm định không phát sinh rò rỉ bộ nhớ.

---

## 3. Cross-System Dependencies (Tích hợp Hệ thống Khác)

1. **Subterranean Cave System (TASK-018 Dependency):**
   - *Contract:* `IEnvironmentalAtmosphere.getSoilMoisture(): number` (giá trị chuẩn hóa $0.0 \rightarrow 1.0$).
   - *Pending Integration:* 
     - Khi `soilMoisture > 0.7`, kích hoạt hạt nước nhỏ giọt ngẫu nhiên từ trần hang ngầm (cave ceiling water drips).
     - Điều hòa tốc độ phát triển của vườn nấm kiến (fungal growth rate) theo độ ẩm đất.
     - Vách hang đổi màu sẫm hơn khi đất ngậm nhiều nước mưa.

2. **Aquatic Lake System (TASK-019 Dependency):**
   - *Contract:* `IEnvironmentalAtmosphere.getAquaticRainInflow(): number`.
   - *Pending Integration:*
     - Lượng mưa tác động trực tiếp đến mực nước hồ (water level elevation delta $\pm 5\text{ cm}$).
     - Khi trời bão hoặc mưa to, tần số và biên độ sóng mặt hồ (`lakeSurfaceWave`) tự động tăng cao tương ứng với `wind.speed`.
     - Độ đục của nước (water turbidity) tăng nhẹ sau các cơn mưa bão lớn do đất xói mòn từ bờ hồ.

3. **Fauna AI & Colony Behavior:**
   - *Bee Colony:* Ong thợ cần tạm hoãn bay hút mật và trú ẩn trong tổ khi `rainIntensity > 0.3` hoặc trời có bão sấm sét.
   - *Ant Colony:* Đàn kiến thợ ngoài mặt đất kích hoạt phản xạ mang vác đất đắp ụ cao quanh miệng tổ khi trời mưa lớn để chống ngập lụt.
