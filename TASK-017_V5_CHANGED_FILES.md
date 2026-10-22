# TASK-017_V5_CHANGED_FILES.md
## Danh Sách Tệp Đã Thay Đổi / Tạo Mới Trong Phiên Kiểm Định QA V5

Quy chuẩn an toàn tuyệt đối: **KHÔNG ghi đè tệp V2/V4, KHÔNG can thiệp gameplay, KHÔNG thay đổi core renderer, KHÔNG can thiệp branch của TASK-018/019/020**.

### 1. Tệp Tạm Thời Dành Riêng Cho QA (Isolated QA Artifacts)
- `the-vivarium-web/src/components/OakUnifiedV5QAScene.tsx`: Component kiểm thử độc lập cho Unified Oak V5, hỗ trợ chuyển đổi view, nền, mức zoom và so sánh trực tiếp V2 / V4 / V5.
- `the-vivarium-web/src/components/OakRootV4QAScene.tsx`: Component kiểm thử V4 trước đó.
- `the-vivarium-web/src/App.tsx`: Bổ sung route điều hướng tạm thời `?mode=qa-oak-unified-v5` và `?mode=qa-oak-root-v4`. Không sửa đổi bất kỳ logic sandbox, tool, simulation hay router chính.
- `the-vivarium-web/public/assets/qa_temp_v5/env_tree_ancient_unified_v5.png`: Bản sao tạm của V5 trong thư mục public để PixiJS load texture.
- `the-vivarium-web/public/assets/qa_temp_v4/`: Bản sao tạm của V4 trong thư mục public.
- `the-vivarium-web/scripts/capture_task017_v5.mjs`: Kịch bản Puppeteer tự động hóa chụp 12 ảnh bằng chứng pixel-perfect.
- `the-vivarium-web/QA/TASK-017_V5/`: Thư mục lưu 12 ảnh screenshot kiểm định thực tế.

### 2. Tệp Báo Cáo & Nghiệm Thu Xuất Xưởng (Director Deliverables)
- `TASK-017_V5_QA_REPORT.md`: Báo cáo chi tiết đánh giá từng tiêu chí PASS / CONDITIONAL / FAIL kèm phân tích chuyên sâu.
- `TASK-017_V5_ASSET_INSPECTION.json`: Toàn bộ số liệu đo đạc tọa độ bounding box, alpha distribution và phân tích viền pixel.
- `TASK-017_V5_CHANGED_FILES.md`: Tài liệu này.
- `TASK-017_V5_VISUAL_EVIDENCE.zip`: Gói nén chứa 12 ảnh screenshot chứng thực độ phân giải cao ($24.97\text{ MB}$).
