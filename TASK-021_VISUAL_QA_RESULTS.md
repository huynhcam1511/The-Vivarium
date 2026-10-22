# TASK-021: VISUAL QA RESULTS (GATE B.2)
## THE VIVARIUM — CHECKLIST-02

**Test Environment:** Windows x64, Chromium Headless, WebGL2, Viewport $1600 \times 1000$, Port `22021` (`--strictPort`).  
**Tester:** Technical Developer (Antigravity)  
**Verification Target:** Integration of 10 Approved Art Assets + Strata + Oak V5 + Subsystems.

---

### 1. VISUAL INSPECTION CHECKLIST

| Test ID | Visual Criterion | Screenshot Evidence | Result | Observations |
| :--- | :--- | :--- | :---: | :--- |
| **VQA-01** | **Toàn cảnh thế giới đa lớp** (Oak V5, Clay/Peat, Lake, Waterfall, Mountains, Clouds, Weather) | `01_world_overview_b2.png` | **PASS** | Tất cả các tầng hiển thị hài hòa, không xung đột Z-index. Không có black geometric boxes. |
| **VQA-02** | **Oak V5 Groundline & Mối nối thân đất** | `02_oak_v5_undulating_groundline.png` | **PASS** | Bạnh gốc ôm sát theo đường cong địa hình tự nhiên (`terrainData.getSurfaceY`). Không có vệt cắt ngang. |
| **VQA-03** | **Đào làm lộ rễ ngầm** (Excavation) | `03_root_dig_exposed.png` | **PASS** | Rễ ngầm Dual-Pass lộ tự nhiên bên trong khoang hang được đào; rễ ngoài vùng đào vẫn bị đất đặc che kín. |
| **VQA-04** | **Lấp đất che lại rễ** (Fill restoration) | `04_root_fill_recovered.png` | **PASS** | Thao tác Fill tại cùng tọa độ lấp đầy đất đặc, che phủ hoàn toàn các nhánh rễ trở lại trạng thái ban đầu. |
| **VQA-05** | **Thác nước Sprite Sheet 6 frame** | `05_aquatic_waterfall_sheet.png` | **PASS** | Thác nước chuyển động mượt 6 frame ($128 \times 440\text{px}$), mép thác hòa vào mặt nước hồ và vách đá riparian slate. |
| **VQA-06** | **Lòng hồ & Bùn đáy PACK-004** | `06_aquatic_lake_basin_mud.png` | **PASS** | Bùn đáy hồ (`env_lake_bottom_mud.png`) phủ theo hình học lòng chảo parabol, không bị méo góc, không có viền hộp đen. |
| **VQA-07** | **Địa tầng hang ngầm Clay/Peat/Pebble** | `07_underground_strata_clay_peat.png` | **PASS** | Địa tầng Clay ở tầng giữa, Peat ở tầng đáy và Pebble rải rác; chuyển tiếp mềm mại qua Marching Squares. |
| **VQA-08A** | **Thời tiết Mưa (Rain)** | `08a_weather_rain.png` | **PASS** | Hạt mưa rơi xiên theo góc gió, tạo splash trên mặt đất và mặt hồ. |
| **VQA-09B** | **Thời tiết Giông bão & Sét (Storm & Lightning)** | `08b_weather_storm_lightning.png` | **PASS** | Bầu trời tối xám, tia sét chớp sáng toàn cảnh, gió thổi mạnh làm nghiêng thảm thực vật. |
| **VQA-10C** | **Thời tiết Sương mù (Fog & Mist)** | `08c_weather_fog_mist.png` | **PASS** | Dải sương mù nhẹ nhàng cuộn trôi qua mặt đất và tán cây với độ trong suốt mềm mại, không lộ mép tròn. |
| **VQA-11** | **Camera Multi-Zoom 1x / 2x / 4x** | `09a_camera_zoom_1x.png`, `09b_camera_zoom_2x.png`, `09c_camera_zoom_4x.png` | **PASS** | Độ phân giải hiển thị sắc nét, không vỡ layout, Smart Selection căn đúng lưới 32px ở mọi mức zoom. |
| **VQA-12** | **Trạng thái ổn định sau thao tác** | `10_performance_b2_steady_overview.png` | **PASS** | Sau chu kỳ đào và chuyển đổi thời tiết, thế giới giữ nguyên tính toàn vẹn hình ảnh. |
