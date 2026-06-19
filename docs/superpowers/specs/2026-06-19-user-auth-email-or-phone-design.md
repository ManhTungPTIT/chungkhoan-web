# Đăng nhập / Đăng ký user bằng Email hoặc Số điện thoại

**Ngày:** 2026-06-19
**Phạm vi:** Luồng auth của user (không đụng admin, backend, token, axios)

## Mục tiêu

Cho phép "tài khoản" của user là **email** hoặc **số điện thoại** ở cả hai luồng đăng nhập và đăng ký.

### Hiện trạng cần sửa

- **Đăng nhập** (`feature/auth/user/layouts/login.jsx`): có 1 ô account nhưng khi submit luôn gửi cứng `{ email: account, password }` → nhập số điện thoại vẫn bị đẩy dưới khóa `email`.
- **Đăng ký** (`feature/auth/user/layouts/register.jsx`): bắt buộc **cả** email và số điện thoại (2 ô riêng), gửi `{ fullName, email, password, phoneNumber }`.

## Quyết định thiết kế (đã chốt với user)

1. Đăng ký dùng **một ô "Tài khoản" duy nhất** (email hoặc số điện thoại), bỏ 2 ô riêng.
2. Frontend **tự nhận diện** loại tài khoản và gửi `{ email }` hoặc `{ phoneNumber }` — giữ nguyên tên trường backend đang dùng. Backend không đổi.
3. Số điện thoại VN: **đúng 10 chữ số, bắt đầu bằng `0`** → regex `/^0\d{9}$/`.
4. Validate mật khẩu khi đăng ký **giữ nguyên** (≥8 ký tự, có chữ thường, chữ hoa, chữ số, ký tự đặc biệt).

## Thiết kế

### 1. Helper mới — `feature/auth/user/untils/accountType.js`

Dùng chung cho cả login và register, test được độc lập.

```js
// Trả về loại tài khoản dựa trên chuỗi nhập vào
export function detectAccountType(value) {
  const v = (value ?? "").trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "email";
  if (/^0\d{9}$/.test(v)) return "phone";
  return "invalid";
}

// Trả về payload phần tài khoản, hoặc null nếu không hợp lệ
export function buildAccountPayload(value) {
  const v = (value ?? "").trim();
  switch (detectAccountType(v)) {
    case "email":
      return { email: v };
    case "phone":
      return { phoneNumber: v };
    default:
      return null;
  }
}
```

- Email regex giữ đúng quy ước đang dùng trong `register.jsx`.
- Phone regex theo chuẩn di động VN 10 số.

### 2. Đăng nhập — `login.jsx` (+ service giữ nguyên)

- Đổi label ô **"Email" → "Tài khoản"**, placeholder "Email hoặc số điện thoại".
- Trong `handleSubmit`:
  - Gọi `buildAccountPayload(account)`.
  - Nếu `null` → set `errors.account = "Vui lòng nhập email hoặc số điện thoại hợp lệ"`, **không** gọi API.
  - Nếu hợp lệ → `login({ ...payload, password: password.trim() })`.
- `LoginUserService.login` và `loginUserHook` **không đổi** (vẫn forward `data` tới `/api/user/login`).

### 3. Đăng ký — `register.jsx` (+ service giữ nguyên)

- **Bỏ** state/ô `phone` và `email` riêng; thêm **state/ô `account`** duy nhất (label "Tài khoản", placeholder "Email hoặc số điện thoại").
- Giữ nguyên: `fullName`, `password`, `confirmPassword` và toàn bộ rule validate mật khẩu.
- Trong `validate()`:
  - `account` rỗng → "Vui lòng nhập trường này".
  - `detectAccountType(account) === "invalid"` → "Vui lòng nhập email hoặc số điện thoại hợp lệ".
- Trong `handleSubmit`:
  - `register({ fullName, password, ...buildAccountPayload(account) })`.
- `RegisterUserService.register` và `registerUserHook` **không đổi**.

### 4. Test — `feature/auth/user/untils/__tests__/accountType.test.js`

Vitest (hạ tầng test đã có sẵn). Các case:

- Email hợp lệ → `"email"`, payload `{ email }`.
- `0987654321` (10 số) → `"phone"`, payload `{ phoneNumber }`.
- `098765432` (9 số) → `"invalid"`.
- `01234567890` (11 số) → `"invalid"`.
- `+84987654321` → `"invalid"` (không bắt đầu bằng `0`).
- Chuỗi rỗng / chỉ khoảng trắng → `"invalid"`, payload `null`.
- Chuỗi rác (`"abc"`, `"a@b"`) → `"invalid"`.

## Ngoài phạm vi

- Backend (`/api/user/login`, `/api/user/register`) — không đổi.
- Luồng admin, token storage, axiosClient — không đụng.
- OTP / xác thực số điện thoại — không nằm trong scope này.
