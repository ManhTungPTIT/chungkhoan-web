// Map thông điệp lỗi đăng nhập từ backend sang tiếng Việt cho người dùng.
export function mapLoginError(message) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("pending")) return "Tài khoản đang chờ admin duyệt.";
  if (m.includes("rejected")) return "Tài khoản đã bị từ chối.";
  return "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.";
}
