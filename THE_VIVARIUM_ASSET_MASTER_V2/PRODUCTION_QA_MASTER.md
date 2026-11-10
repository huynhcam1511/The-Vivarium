# THE VIVARIUM — PRODUCTION & QA MASTER REGISTER (V2 BASELINE)
*Sổ bộ quản lý bàn giao kỹ thuật, tiêu chuẩn nghiệm thu và kiểm tra chất lượng (Quality Gates)*

---

## 1. Tiêu chuẩn Kỹ thuật Bàn giao (Handoff Requirements)

| Tiêu chí | Quy định kỹ thuật (Engine Compatibility) |
| :--- | :--- |
| **Định dạng file** | PNG 32-bit (RGBA, 8 bits/channel), nén nén không suy hao (Lossless DEFLATE). |
| **Alpha Channel** | Kênh Alpha sạch, 256 cấp độ độ trong suốt mượt mà. Nghiêm cấm viền đen, viền trắng (*anti-aliasing fringe / halo*). |
| **Hệ tọa độ & Canvas** | Cùng canvas kích thước chuẩn cho các layer cùng pack. Điểm neo (*Anchor Pivot*) thống nhất. |
| **Kiểm tra Composite** | Ghép chồng (Blend normal) tất cả các layer thành phần ở Opacity 100% phải khớp chính xác 100% với file `Full Composite`. |
| **Bảo lưu hình học che khuất** | Các bộ phận động (cành đu đưa, rễ ngầm đào đất) phải có phần bù lấn ranh giới (*dilation buffer* từ 8 - 32px) để không bị lộ lỗ thủng khi dịch chuyển. |
| **Checksum & Integrity** | Mỗi file bàn giao có mã băm SHA-256 đối chiếu trong `ASSET_MANIFEST.json`. |

---

## 2. Nhật ký Sản xuất & Trạng thái QA (Production & QA Tracking)

| Pack ID | Asset Name | File Name | Size (px) | Art QA Check | Engine Test | Trạng thái nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PACK-006** | **Oak V6 Canopy Left** | `env_tree_oak_v6_canopy_left.png` | $819 \times 1024$ | PASSED (Clean Alpha) | PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Canopy Right** | `env_tree_oak_v6_canopy_right.png` | $819 \times 1024$ | PASSED (Clean Alpha) | PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Canopy Top** | `env_tree_oak_v6_canopy_top.png` | $819 \times 1024$ | PASSED (Clean Alpha) | PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Trunk Core** | `env_tree_oak_v6_trunk_core.png` | $819 \times 1024$ | PASSED (Seamless Bark) | PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Buttress Moss** | `env_tree_oak_v6_buttress_moss.png`| $819 \times 1024$ | PASSED (Ground Blend)| PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Roots Primary** | `env_tree_oak_v6_roots_primary.png`| $819 \times 1024$ | PASSED (Taproots RGBA) | PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Roots Fine** | `env_tree_oak_v6_roots_fine.png` | $819 \times 1024$ | PASSED (Capillary Alpha)| PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-006** | **Oak V6 Full Composite**| `env_tree_oak_v6_full_composite.png`|$819 \times 1024$ | PASSED (Reference Match)| PENDING | IN_PRODUCTION (Batch 01) |
| **PACK-007** | Organic Ground | `env_ground_*.png` | TBD | NOT STARTED | - | PENDING (Batch 02) |
| **PACK-008** | Root Details | `env_sub_root_*.png` | TBD | NOT STARTED | - | PENDING (Batch 02) |
| **PACK-009** | Terrain Details | `env_strata_*.png` | TBD | NOT STARTED | - | PENDING (Batch 02) |
| **PACK-010** | Ant Colony MVP | `fauna_ant_digger_*.png` | TBD | NOT STARTED | - | PLANNED (Batch 05) |

---

## 3. Quy trình Kiểm thử Art QA (Art QA Gate Checklist)
- [x] **Test 1: Black Matte Test** — Đặt asset lên nền đen `#000000` để phát hiện viền trắng / halo sáng.
- [x] **Test 2: White Matte Test** — Đặt asset lên nền trắng `#FFFFFF` để phát hiện viền xám / vụn alpha bẩn.
- [x] **Test 3: Seam & Overlap Test** — Kiểm tra vùng tiếp giáp giữa Canopy và Trunk Core, giữa Buttress và Roots Primary không để hở khoảng trống khi xoay $\pm 2.5^\circ$.
- [x] **Test 4: Dual-Pass Root Masking Compatibility** — Tách biệt rõ giữa rễ cái chịu lực và rễ tơ mao dẫn để shader ngầm của engine áp dụng mask đào đất mượt mà.
