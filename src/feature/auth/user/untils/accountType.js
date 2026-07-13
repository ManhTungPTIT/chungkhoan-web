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

// Trả về phần payload tài khoản theo loại tài khoản đang chọn:
// - "VPS" | "TCBS" → { broker, brokerAccount } (số tài khoản chứng khoán).
// - còn lại ("email", mặc định) → gõ tự do: có "@" → { email }, khác → { phoneNumber }.
// Rỗng → null. Đăng nhập/đăng ký dùng chung để input map về cùng một field.
export function buildAccountPayload(value, accountType = "email") {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (accountType === "VPS" || accountType === "TCBS") {
    return { broker: accountType, brokerAccount: v };
  }
  return v.includes("@") ? { email: v } : { phoneNumber: v };
}
