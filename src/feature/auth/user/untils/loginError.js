// Map thông điệp lỗi đăng nhập từ backend sang tiếng Việt cho người dùng.
export function mapLoginError(message) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("pending")) return "Tài khoản đang chờ admin duyệt.";
  if (m.includes("rejected")) return "Tài khoản đã bị từ chối.";
  return "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.";
}

// Hiện khi bị đẩy về đây kèm ?reason=superseded — tức phiên này vừa bị một lần
// đăng nhập khác trên CÙNG nền tảng đá ra.
export const SUPERSEDED_NOTICE =
  "Tài khoản đã được đăng nhập ở thiết bị khác. Mỗi tài khoản chỉ dùng được trên một trình duyệt và một ứng dụng.";
