# Hoàn thiện chức năng quản lý người dùng (admin)

**Ngày:** 2026-06-19
**Phạm vi:** Backend (`chart_back`) + Frontend (`chart`) — màn `ManagerUser` của admin.

## Mục tiêu
Hoàn thiện các tab và thao tác đang là mock trong `managerUser.jsx`:
- Tab **Danh sách**: liệt kê user thật.
- Tab **Tài khoản khóa**: user bị khóa + mở khóa.
- Tab **Nâng hạn mức**: user sắp/đã hết hạn gói.
- Modal: **Khóa/Mở khóa**, **Xóa** (soft delete), **Chọn gói thời hạn**.
- (Tab "Tài khoản mới" đã làm ở spec trước — giữ nguyên.)

## Quyết định & mặc định
- **Gói thời hạn:** thêm `expiresAt` vào user. `null` = không giới hạn (không chặn login). Login chặn khi `expiresAt` đã qua → lỗi `"Account expired"`.
- **Sắp hết hạn** = còn ≤ 7 ngày hoặc đã quá hạn.
- **Xóa = soft delete:** đặt `status:"deleted"`, giữ bản ghi; ẩn khỏi mọi tab; không đăng nhập được.
- Mỗi thao tác gọi API rồi **refetch** danh sách.

## Backend (`chart_back`)

### Model `userModel.js`
- Thêm `expiresAt: { type: Date, default: null }`.
- `status` giá trị hợp lệ mở rộng: `pending | active | rejected | locked | deleted`.

### `services/userService.js` (thêm)
- `listUsers()` → user `status != "deleted"`, trả `{id, fullName, email, phoneNumber, status, createdAt, expiresAt}`.
- `lockUser(id)` → `status:"locked"`; `unlockUser(id)` → `status:"active"`.
- `deleteUser(id)` → `status:"deleted"` (soft delete).
- `setUserPackage(id, days)` → `expiresAt = now + days*86400000`; trả user cập nhật.
- `loginUser`: sau các check status, nếu `user.expiresAt && new Date(user.expiresAt) < new Date()` → throw `"Account expired"`.
- Các hàm not-found → throw `"User not found"`.

### `controllers/userController.js` + `routers/userRouter.js`
Admin-only (`verifyToken + requireAdmin`):
- `GET    /api/user`            → list
- `PATCH  /api/user/:id/lock`   → lock
- `PATCH  /api/user/:id/unlock` → unlock
- `DELETE /api/user/:id`        → soft delete
- `PATCH  /api/user/:id/package` body `{ days }` → set gói

Lỗi `"User not found"` → 404; thiếu/sai input → 400.

## Frontend (`chart`)

### Service mới `feature/auth/admin/services/adminUsers.js`
`getUsers()`, `lockUser(id)`, `unlockUser(id)`, `deleteUser(id)`, `setPackage(id, days)` qua `axiosAdmin`.

### `feature/auth/admin/layouts/managerUser.jsx`
- Bỏ mock `DATA`. Thêm state `users` (toàn bộ), fetch qua `getUsers`, refetch sau mỗi thao tác.
- **Tab Danh sách:** bảng user thật + tìm theo tên/email/sđt.
- **Tab Tài khoản khóa:** lọc `status==="locked"`, nút **Mở khóa**.
- **Tab Nâng hạn mức:** lọc user `expiresAt` quá hạn hoặc ≤7 ngày; cột ngày hết hạn; mở modal để gia hạn.
- Số đếm 4 tab theo dữ liệu thật.
- `Status` sửa để nhận status chuỗi (`active/locked/pending/rejected`) + hiển thị **"Hết hạn"** khi `expiresAt` đã qua.

### `UserModal` (gắn user thật)
- Header dùng `fullName`, email/sđt. Thông tin: trạng thái thật, `createdAt`, `lastActive` (bỏ giá trị cứng).
- **Khóa/Mở khóa:** nhãn theo `status` hiện tại → gọi API ngay → refetch.
- **Xóa tài khoản:** xác nhận → API (soft delete) → refetch → đóng.
- **Gói thời hạn:** chọn 30/90/180/365 → **Lưu** gọi `setPackage` → refetch → đóng.

## Test
Bỏ qua test (theo lựa chọn trước; môi trường đang tự xóa file test). Verify bằng `node --check` backend + `vite build` frontend.

## Ngoài phạm vi
- Lịch sử thao tác / audit log.
- Phân trang danh sách user (YAGNI — số lượng nhỏ).
- Thông báo cho user khi bị khóa/hết hạn.
