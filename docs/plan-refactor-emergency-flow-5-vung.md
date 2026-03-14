## Plan: Refactor Emergency Flow 5 Vùng End-to-End

Mục tiêu là refactor toàn bộ luồng Emergency Flow 5 Vùng dựa trên báo cáo hiện tại, đồng bộ từ Database đến Backend và Frontend, đồng thời loại bỏ lệch schema/hợp đồng API và các thao tác FE dạng mock không có giá trị vận hành.

**Phạm vi bắt buộc**
1. Đối soát schema DB với entity/service BE và type/service FE.
2. Xử lý lệch chức năng trong luồng 5 vùng (đặc biệt rule cấm reject ở vùng không cho phép).
3. Hoàn thiện FE để thao tác đầy đủ incident/review/rollback theo đúng nghiệp vụ.
4. Rà soát và thay thế các thao tác mock/placeholder ảnh hưởng vận hành.

**Steps**
1. Pha 1 - Chốt quy tắc nghiệp vụ 5 vùng ở tầng Backend (khẩn cấp, blocking)
- Chặn tuyệt đối reject sai luồng đối với request thuộc vùng không cho reject (DEPARTED, MID_ROUTE).
- Chuẩn hóa state machine cho request auto-execute để tránh mơ hồ trạng thái hậu kiểm.
- Rà soát đường đi approve/reject/review/rollback để không còn đường vòng vi phạm rule.
- Kết quả mong đợi: không còn khả năng thao tác sai rule dù gọi API trực tiếp.

2. Pha 2 - Đồng bộ schema Database với mô hình Backend (blocking)
- Tạo migration bổ sung các cột/ràng buộc còn thiếu hoặc chưa đồng bộ với entity hiện tại.
- Backfill dữ liệu lịch sử cho cột mới theo nguyên tắc an toàn, có khả năng rollback migration.
- Chuẩn hóa enum/check constraint cho incident_type (và quy định incident_gps nếu cần).
- Kết quả mong đợi: DB phản ánh đúng mô hình 5 vùng, không còn lệch ORM-schema.

3. Pha 3 - Chuẩn hóa cấu hình vận hành cho 5 vùng
- Đưa toàn bộ ngưỡng quan trọng vào file cấu hình thay vì phụ thuộc default trong code:
  - urgent window
  - handover gap
  - escalation timeout
- Đồng bộ tài liệu vận hành để tránh lệch cấu hình giữa môi trường.
- Kết quả mong đợi: có thể audit và tuning theo môi trường mà không sửa code.

4. Pha 4 - Đồng bộ hợp đồng API BE-FE
- Chốt bộ trạng thái canonical giữa BE-FE (PENDING, ESCALATED, APPROVED, REJECTED, CANCELLED hoặc bộ mở rộng đã thống nhất).
- Chốt bộ change type canonical và label hiển thị tương ứng.
- Bổ sung metadata hậu kiểm (reviewedBy/reviewedAt/reviewNotes…) nếu cần cho vận hành.
- Cập nhật typing FE theo DTO cuối cùng, tránh fallback sai.
- Kết quả mong đợi: FE hiển thị đúng ngữ nghĩa và không lệch trạng thái.

5. Pha 5 - Hoàn thiện Frontend cho luồng 5 vùng (feature completion)
- Bổ sung đầy đủ service methods còn thiếu: incident, review, rollback (nếu chưa wiring đầy đủ).
- Bổ sung UI thao tác:
  - Tạo sự cố dọc đường (MID_ROUTE)
  - Hậu kiểm cho request auto-execute
  - Hoàn tác trong cửa sổ cho phép
- Guard UX theo vùng:
  - DEPARTED/MID_ROUTE: không cho reject
  - URGENT: hiển thị rõ timeout/escalate
  - CRITICAL: hiển thị đúng hậu kiểm
- Kết quả mong đợi: người dùng nghiệp vụ thao tác đủ 5 vùng ngay trên UI.

6. Pha 6 - Rà soát chức năng phân công liên đới (Operation Assignment)
- Đối chiếu luồng TripChangeExecutor với DriverAssignment/BusAssignment:
  - replace driver
  - endEarly bus assignment
  - attach trip to bus assignment
- Rà soát side effect handover trong processResourceChange/reviewEmergencyHandover.
- Chốt audit log cho các nhánh emergency và rollback.
- Kết quả mong đợi: thay đổi nhân sự/xe giữa đường nhất quán với tài liệu nghiệp vụ.

7. Pha 7 - Dọn mock/placeholder FE không có giá trị vận hành
- Phân loại mock thành 2 nhóm:
  - Nhóm bắt buộc thay API thật trước release
  - Nhóm chấp nhận tạm thời ở môi trường demo/UAT
- Ưu tiên xử lý mock thuộc dashboard điều hành và dữ liệu tác nghiệp.
- Kết quả mong đợi: màn hình vận hành phản ánh dữ liệu thật, không gây quyết định sai.

8. Pha 8 - Kiểm thử hồi quy và tiêu chí nghiệm thu
- Backend tests:
  - zone resolution
  - urgent timeout escalate
  - reject guard theo vùng
  - review flow
  - rollback window
- FE tests:
  - hiển thị đúng trạng thái/zone
  - hành động đúng theo quyền và theo vùng
- Migration tests:
  - dữ liệu cũ sau backfill hợp lệ
- Kết quả mong đợi: đủ bằng chứng kỹ thuật để triển khai an toàn.

**Phụ thuộc triển khai**
1. Pha 1 và Pha 2 là blocker cho toàn bộ phần FE.
2. Pha 4 phải hoàn tất trước khi đóng Pha 5.
3. Pha 6 chạy song song một phần với Pha 5 nhưng chỉ chốt sau khi contract ổn định.
4. Pha 8 thực hiện sau khi hoàn tất thay đổi chính ở Pha 1-7.

**Danh mục kiểm tra lệch schema/chức năng bắt buộc**
1. Lệch DB-BE:
- Cột enum/field tồn tại trong entity nhưng thiếu hoặc khác ràng buộc ở DB.
- Trạng thái nghiệp vụ cần query nhưng chưa có cột lưu bền vững.
2. Lệch BE-FE:
- Enum status/type khác nhau giữa backend và frontend.
- Endpoint có ở BE nhưng FE chưa gọi hoặc gọi sai ngữ nghĩa.
3. Lệch chức năng:
- Rule cấm/cho phép thao tác theo vùng chưa được enforce nhất quán ở cả BE và FE.
4. Mock thao tác FE:
- Dashboard số liệu cứng.
- Hook/service trả dữ liệu rỗng hoặc placeholder TODO.
- Flow mô phỏng thanh toán/sự cố không phản ánh nghiệp vụ thật.

**Tiêu chí hoàn thành refactor**
1. Không còn lệch schema DB với model BE trong phạm vi Emergency Flow.
2. Không còn đường thao tác sai rule 5 vùng.
3. FE thao tác đầy đủ incident/review/rollback và hiển thị đúng status/zone.
4. Các mock ảnh hưởng vận hành đã được thay thế hoặc gắn cờ rõ theo chính sách phát hành.
5. Test hồi quy pass cho các kịch bản trọng yếu.
