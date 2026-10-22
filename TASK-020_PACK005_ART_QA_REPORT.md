# TASK-020 PACK-005 ART INTAKE QA REPORT
## BÁO CÁO KIỂM ĐỊNH MỸ THUẬT 5 ASSET ỨNG VIÊN KHÍ QUYỂN & THỜI TIẾT

> **Dự án:** THE VIVARIUM — Living Ecosystem Sandbox  
> **Gói Asset Tiếp Nhận:** `THE_VIVARIUM_TASK020_PACK005_ART_CANDIDATE.zip`  
> **Môi trường thẩm định:** Worktree độc lập `task-020-weather` (Web engine: PixiJS v8 × React 19)  
> **Cổng vận hành thử nghiệm:** `http://localhost:22020/?mode=art-candidate-qa`  
> **Tỷ lệ khung hình:** $\ge 60\text{ FPS}$ liên tục trong quá trình chuyển động Parallax đa tầng.  
> **Ngày thực hiện:** 2026-10-21  

---

## 1. TỔNG HỢP KẾT QUẢ NGHIỆM THU (QA MATRIX)

| Mã Asset ID | File Name | Kích thước & Mode | Alpha Min/Max | Trạng Thái QA | Đánh giá & Điều kiện tích hợp |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **ENV-SKY-CLOUDS-001** | `env_sky_clouds_001.png` | $1024 \times 512$ RGBA | $0 \rightarrow 130$ | **PASS** | Cụm mây trôi xa parallax, alpha sạch $100\%$, $0\text{px}$ edge seam (biên trái/phải alpha = 0). Khi trôi tốc độ $0.15$ không để lại gờ cắt. |
| **ENV-SKY-MNTN-001** | `env_sky_mountain_001.png` | $1024 \times 512$ RGBA | $0 \rightarrow 108$ | **CONDITIONAL PASS** | Dãy núi xa mờ sương, chân núi tiếp giáp mặt đất tốt. Tuy nhiên độ lệch biên trái/phải là $11.98\text{px}$ nên cần fade viền biên mềm (linear alpha ramp 32px) khi lặp vô tận. |
| **ENV-FX-FOG-MIST** | `env_fx_fog_mist.png` | $1024 \times 512$ RGBA | $0 \rightarrow 108$ | **CONDITIONAL PASS** | Dải sương mù lam mềm mại, độ trong suốt cao (max alpha 108). Nhưng viền đáy/mép chạm cạnh canvas (edge alpha 95) cần blend mờ viền khi đặt vào scene gameplay. |
| **ENV-FX-RAIN-DROP-01** | `env_fx_rain_drop_01.png` | $512 \times 512$ RGBA | $0 \rightarrow 185$ | **PASS** | Atlas hạt mưa $8 \times 8$ (64 cell hạt mưa xiên và vệt splash). Tách biệt hoàn hảo, không dính viền ô, alpha trong trẻo $0 \rightarrow 185$. |
| **ENV-CANOPY-LEAF-FALL** | `env_canopy_leaf_fall.png` | $512 \times 512$ RGBA | $0 \rightarrow 238$ | **PASS** | Atlas lá rơi $8 \times 8$ với 38 cell chuyển động xoay. Màu sắc lá sồi tự nhiên hòa hợp hoàn toàn với Ancient Oak V2 Canopy. |

---

## 2. KẾT QUẢ ĐỐI CHIẾU KỸ THUẬT & SOẠN THẢO CODE MÔ PHỎNG

1. **Khả năng tương thích với `WeatherSystem`:**
   - 5 asset hoàn toàn map khớp với các trạng thái thời tiết của `WeatherSystem`:
     - `CLEAR_SUNNY` & `OVERCAST`: Sử dụng `env_sky_clouds_001.png` trôi theo vận tốc gió `windSpeed`.
     - Toàn cảnh hậu cảnh: Sử dụng `env_sky_mountain_001.png` làm lớp núi xa mờ với độ mờ điều chỉnh theo `humidity`.
     - `GENTLE_RAIN` & `STORMY_TEMPEST`: Trích xuất trực tiếp sprite hạt mưa và splash từ atlas `env_fx_rain_drop_01.png` theo các frame $64 \times 64$.
     - `AUTUMN_BREEZE`: Sử dụng atlas `env_canopy_leaf_fall.png` thả lá sồi bay nghiêng theo vector gió.
     - `FOGGY_MIST`: Phủ lớp `env_fx_fog_mist.png` là là mặt đất và tán lá khi độ ẩm $> 80\%$.
2. **Kiểm tra Alpha Fringes & Đổ bóng:**
   - Đã soi trên 4 nền: Checkerboard, Bầu trời xanh (`#8ECAE6`), Đêm đen (`#0A0F1D`), và Trắng tinh (`#FFFFFF`).
   - Không xuất hiện quầng đen (black halos) hay răng cưa pixel bilineary thô ráp.
3. **Hiệu năng Render Runtime:**
   - Chạy đồng thời 2 lớp núi parallax, 2 lớp mây trôi liên tục, 1 lớp sương mù, 28 hạt mưa atlas và 18 lá rơi atlas: Duy trì ổn định **60 FPS** (PixiJS v8 ticker).

---

## 3. DANH MỤC SCREENSHOT NGHIỆM THU

Toàn bộ 6 ảnh screenshot độ phân giải $1600 \times 1000$ được lưu trữ tại `QA/TASK-020-ART-INTAKE/`:
1. `art_qa_01_overview_1x_checker.png` — Toàn cảnh $1\times$ trên nền checkerboard, soi cấu trúc alpha tổng thể.
2. `art_qa_02_overview_1x_sky.png` — Toàn cảnh $1\times$ trên nền trời xanh, kiểm tra mây trôi và dải núi xa.
3. `art_qa_03_zoom_2x_midground.png` — Trung cảnh $2\times$, soi chi tiết hạt mưa xiên và lá sồi rơi chuyển động.
4. `art_qa_04_zoom_4x_detail_inspect.png` — Cận cảnh $4\times$, kiểm tra chi tiết cấu trúc pixel và độ mịn của viền sprite.
5. `art_qa_05_night_contrast_alpha.png` — Kiểm tra độ tương phản ban đêm ($2\times$) trên nền tối.
6. `art_qa_06_white_contrast_silhouette.png` — Kiểm tra silhouette và độ sắc nét trên nền trắng tinh khiết ($1\times$).
