// Nhận diện "tài khoản" của user là email hay số điện thoại VN.
// Dùng chung cho luồng đăng nhập và đăng ký.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/; // số di động VN: đúng 10 chữ số, bắt đầu bằng 0

// Trả về "email" | "phone" | "invalid" dựa trên chuỗi nhập vào.
export function detectAccountType(value) {
  const v = (value ?? "").trim();
  if (EMAIL_RE.test(v)) return "email";
  if (PHONE_RE.test(v)) return "phone";
  return "invalid";
}

// Trả về phần payload tài khoản: { email } | { phoneNumber } | null.
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
