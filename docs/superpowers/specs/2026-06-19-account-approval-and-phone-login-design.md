# Duyệt tài khoản trước khi đăng nhập + Đăng nhập bằng email hoặc số điện thoại

**Ngày:** 2026-06-19
**Phạm vi:** Backend (`chart_back`) + Frontend (`chart`), luồng auth của user và màn duyệt phía admin.

## Mục tiêu

1. **Duyệt tài khoản:** Khi user đăng ký, tài khoản ở trạng thái *chờ duyệt*; **chỉ đăng nhập được sau khi admin duyệt**. Admin có thể **Duyệt** hoặc **Từ chối**.
2. **Đăng nhập/đăng ký bằng email hoặc số điện thoại:** Backend chấp nhận đăng ký và đăng nhập bằng **email HOẶC số điện thoại** (frontend đã gửi `{ email }` hoặc `{ phoneNumber }` từ task trước).

## Bối cảnh hiện trạng

- Backend: Express 5 + Mongoose (MongoDB) + JWT + bcryptjs. MVC dưới `my-app/src/`.
- `userModel.status` (String) **đã tồn tại**, mặc định `"active"`. `loginUser` **đã chặn** `if (user.status !== "active") throw "Account is inactive"`.
- `userModel.email` đang `required:true, unique:true`. `phoneNumber` optional, không unique.
- `registerUser`/`loginUser` hiện **chỉ dùng email**.
- `verifyToken` gắn `req.admin = payload` (payload có `role`: `admin`|`user`); **chưa có guard admin riêng**.
- Admin `ManagerUser.jsx` đang dùng **dữ liệu mock tĩnh**, chưa gọi API danh sách user.

## Quyết định thiết kế (đã chốt)

1. **Cơ chế duyệt:** tái dùng field `status` sẵn có — `pending` → `active` (duyệt) / `rejected` (từ chối). Không thêm field mới.
2. **Từ chối:** đánh dấu `status:"rejected"`, **giữ bản ghi trong DB** (không xoá).
3. **Giao diện duyệt:** nối **tab "Tài khoản mới"** trong `ManagerUser` với API thật; các tab khác giữ mock (ngoài phạm vi).
4. **Gộp login bằng số điện thoại** vào backend.

## Thiết kế — Backend (`chart_back`)

### 1. `models/userModel.js`
- `status`: default `"active"` → **`"pending"`**. Giữ kiểu String. Ghi chú giá trị hợp lệ: `pending` | `active` | `rejected` | `locked`.
- `email`: `required:false`, `unique:true`, **`sparse:true`** (cho phép user không có email).
- `phoneNumber`: thêm `unique:true`, **`sparse:true`**.

> Lưu ý: `sparse` để index unique bỏ qua doc thiếu trường (tránh lỗi trùng `null`). Dữ liệu dev hiện có giữ nguyên.

### 2. `services/userService.js`
- `registerUser({ fullName, email, phoneNumber, password })`:
  - Yêu cầu **ít nhất một** trong `email` / `phoneNumber`; nếu thiếu cả hai → throw `"Email or phone number is required"`.
  - Kiểm trùng theo trường được gửi: `User.findOne({ email })` nếu có email; `User.findOne({ phoneNumber })` nếu có phone. Trùng → throw `"Account already exists"`.
  - Tạo user với `status:"pending"`. Trả `{ status: "pending" }`.
- `loginUser({ email, phoneNumber, password })`:
  - Tìm user theo trường có mặt (`email` ưu tiên, nếu không thì `phoneNumber`).
  - Không thấy / sai mật khẩu → `"Invalid credentials"`.
  - Phân biệt trạng thái trước khi cấp token:
    - `pending` → throw `"Account pending approval"`
    - `rejected` → throw `"Account has been rejected"`
    - khác `active` → throw `"Account is inactive"`
  - Còn lại giữ nguyên: cập nhật `lastActive`, ký token, lưu refresh token.
- Mới: `listPendingUsers()` → trả mảng user `status:"pending"`, các trường `{ id, fullName, email, phoneNumber, createdAt }`.
- Mới: `approveUser(id)` → set `status:"active"`; không thấy → throw `"User not found"`.
- Mới: `rejectUser(id)` → set `status:"rejected"`; không thấy → throw `"User not found"`.

### 3. `controllers/userController.js`
- `register`: bắt buộc `fullName`, `password`, và (`email` **hoặc** `phoneNumber`); thiếu → 400.
- `login`: đọc `{ email, phoneNumber, password }`; bắt buộc `password` và (`email`|`phoneNumber`); gọi `loginUser({ email, phoneNumber, password })`.
- Mới: `pending` (GET danh sách), `approve` (PATCH), `reject` (PATCH) → gọi service tương ứng, trả JSON; lỗi "not found" → 404, lỗi khác → 400/500.

### 4. `middlewares/authMiddleware.js`
- Thêm `requireAdmin(req, res, next)`: chạy sau `verifyToken`; nếu `req.admin?.role !== "admin"` → 403 `"Admin only"`.

### 5. `routers/userRouter.js`
Thêm (đăng ký **trước** 404 handler, theo CLAUDE.md):
```
GET   /api/user/pending        verifyToken, requireAdmin
PATCH /api/user/:id/approve    verifyToken, requireAdmin
PATCH /api/user/:id/reject     verifyToken, requireAdmin
```

## Thiết kế — Frontend (`chart`)

### 6. `feature/auth/user/layouts/RegisterForm.jsx`
- Popup thành công đổi nội dung: *"Tài khoản đã được tạo và đang chờ admin duyệt. Bạn sẽ đăng nhập được sau khi được duyệt."* Nút đóng quay về tab đăng nhập như hiện tại.

### 7. `feature/auth/user/layouts/LoginForm.jsx` + helper
- Tách helper `feature/auth/user/untils/loginError.js` → `mapLoginError(message)` trả text tiếng Việt:
  - chứa `"pending"` → "Tài khoản đang chờ admin duyệt."
  - chứa `"rejected"` → "Tài khoản đã bị từ chối."
  - còn lại → "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại."
- `handleSubmit` catch: đọc `err.response?.data?.message`, đưa qua `mapLoginError`, hiển thị trong popup hiện có (thay vì text cứng).

### 8. `feature/auth/admin/layouts/managerUser.jsx`
- Thêm service gọi API (đặt cùng feature admin, qua `axiosAdmin`):
  - `getPendingUsers()` → `GET /api/user/pending`
  - `approveUser(id)` → `PATCH /api/user/:id/approve`
  - `rejectUser(id)` → `PATCH /api/user/:id/reject`
- Khi `activeTab === 2` ("Tài khoản mới"): render danh sách pending thật (tên, email/sđt, ngày tạo) + nút **Duyệt** / **Từ chối** mỗi dòng; sau thao tác thì refetch danh sách. Số đếm tab "Tài khoản mới" lấy theo độ dài danh sách thật.
- Các tab khác (`Danh sách`, `Tài khoản khóa`, `Nâng hạn mức`) giữ mock — ngoài phạm vi.

## Test

### Backend (vitest — đã cấu hình)
Theo pattern test service sẵn có (`authService.test.js`):
- `registerUser` đặt `status:"pending"`; thiếu cả email & phone → throw.
- `loginUser` ném đúng lỗi khi `pending` / `rejected`; thành công khi `active`.
- `loginUser` tìm được user khi đăng nhập bằng phoneNumber.
- `approveUser` / `rejectUser` đổi đúng status; id không tồn tại → throw.
- `listPendingUsers` chỉ trả user pending.

### Frontend (vitest)
- `mapLoginError()` cho từng nhánh: pending, rejected, mặc định.

## Ngoài phạm vi
- Các tab admin khác vẫn mock.
- Email xác nhận / OTP / thông báo cho user khi được duyệt — không làm lần này.
- Phân trang / tìm kiếm danh sách pending — chưa cần (YAGNI).
