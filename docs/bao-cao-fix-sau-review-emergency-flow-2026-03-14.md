# Báo Cáo: Sửa Lỗi Sau Đánh Giá Refactor Emergency Flow 5 Vùng
**Ngày:** 2026-03-14  
**Phạm vi:** Frontend UX — thay thế browser native dialogs bằng component chuẩn

---

## Bối cảnh

Sau khi kiểm tra đợt refactor Emergency Flow 5 Vùng, tôi xác định 2 nhóm vấn đề cần sửa:

1. **`handleReview` dùng `window.prompt()`** — không nhất quán với phần còn lại, bị chặn trên một số browser/mobile, không có loading state.
2. **`confirm()` rải rác toàn Frontend** — cùng lý do UX như trên, không thể tùy chỉnh style, thiếu disabled state khi mutation đang pending.

---

## Thay đổi thực hiện

### 1. Tạo `ConfirmDialog` component tái sử dụng

**File mới:** `frontend/src/components/ui/confirm-dialog.tsx`

Component dùng chung cho toàn dự án thay thế `window.confirm()`:
- Props: `title`, `description`, `confirmLabel`, `cancelLabel`, `variant` (`danger` | `warning` | `info`), `isLoading`, `onConfirm`
- Hiển thị icon theo `variant`: `AlertTriangle` cho danger/warning, `Info` cho info
- Disable cả hai nút khi `isLoading = true`
- Nút Xác nhận đổi `variant` thành `destructive` khi `danger`

---

### 2. Sửa `trip-changes/page.tsx`

**Trước → Sau:**

| Hành động | Trước | Sau |
|-----------|-------|-----|
| Hậu kiểm đạt/không đạt | `window.prompt()` | `ReviewDialog` (Dialog chuẩn có Textarea) |
| Duyệt yêu cầu | `window.confirm()` | `ConfirmDialog` (variant: `info`) |
| Hoàn tác yêu cầu | `window.confirm()` | `ConfirmDialog` (variant: `warning`) |

**State mới:**
- `reviewDialogOpen`, `reviewTarget`, `reviewApproved`, `reviewNotes` — cho Review Dialog
- `approveConfirmOpen`, `approveTarget` — cho Duyệt
- `rollbackConfirmOpen`, `rollbackTarget` — cho Hoàn tác

**Cải tiến bổ sung:**
- Nút "Từ chối" disabled theo Zone Rule có thêm `title` tooltip giải thích lý do (VD: `"Vùng DEPARTED không cho phép từ chối. Dùng Hậu kiểm."`)
- `disabled:cursor-not-allowed` cho nút bị khóa

---

### 3. Sửa `trips/page.tsx`

**Trước → Sau (4 `confirm()`):**

| Hành động | Trước | Sau |
|-----------|-------|-----|
| Duyệt chuyến | `confirm(...)` | `ConfirmDialog` (variant: `info`) |
| Bắt đầu khởi hành | `confirm(...)` | `ConfirmDialog` (variant: `info`) |
| Hoàn thành chuyến | `confirm(...)` | `ConfirmDialog` (variant: `info`) |
| Hủy chuyến | `confirm(...)` | `ConfirmDialog` (variant: `danger`) |

**Thiết kế:** dùng 1 `ConfirmDialog` duy nhất với state `confirmAction` (`approve`|`start`|`complete`|`cancel`) và `CONFIRM_CONFIG` map để tránh render 4 dialog riêng biệt.

---

## Kết quả kiểm tra

- `npm run build` → **✅ Compiled successfully in 4.7s**
- Không còn `window.prompt()` hay `window.confirm()` trong 2 file ưu tiên cao
- Commit: `fix(fe): replace all confirm/prompt with proper Dialogs; add reusable ConfirmDialog component`

---

## Còn lại (không blocker)

Các file vẫn còn `confirm()` nhưng ít ảnh hưởng vận hành, có thể xử lý dần:

| File | Số lượng | Mức độ |
|------|----------|--------|
| `bus-schedule/page.tsx` | 1 | Thấp |
| `buses/page.tsx` | 1 | Thấp |
| `bus-types/page.tsx` | 1 | Thấp |
| `routes/page.tsx` | 1 | Thấp |
| `schedules/page.tsx` | 1 | Thấp |
| `stations/page.tsx` | 1 | Thấp |
| `depots/page.tsx` | 1 | Thấp |
| `crew/page.tsx` | 1 | Thấp |
| `booking/lookup/page.tsx` | 2 | Trung bình (phía khách hàng) |
| `AssignmentForm.tsx` | 1 | Trung bình |
| `PickupPointsDialog.tsx` | 1 | Thấp |

Tất cả đều có thể thay bằng `ConfirmDialog` theo cùng pattern đã lập.
