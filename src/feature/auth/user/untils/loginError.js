// Map thông điệp lỗi đăng nhập từ backend sang tiếng Việt cho người dùng.
export function mapLoginError(message) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("pending")) return "Tài khoản đang chờ admin duyệt.";
  if (m.includes("rejected")) return "Tài khoản đã bị từ chối.";
  // BE trả "Account is inactive" cho MỌI status khác active — trong đó có "deleted"
  // (user tự xóa) và "locked" (admin khóa). Không phân biệt được hai cái ở đây nên
  // nói cả hai, còn hơn để người dùng tưởng mình gõ sai mật khẩu.
  if (m.includes("inactive")) return "Tài khoản đã bị xóa hoặc bị khóa.";
  return "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.";
}

// Hiện khi bị đẩy về đây kèm ?reason=superseded — tức phiên này vừa bị một lần
// đăng nhập khác trên CÙNG nền tảng đá ra.
export const SUPERSEDED_NOTICE =
  "Tài khoản đã được đăng nhập ở thiết bị khác. Mỗi tài khoản chỉ dùng được trên một trình duyệt và một ứng dụng.";

// Hiện khi vừa tự xóa tài khoản xong (?reason=deleted). Nói rõ "không đăng nhập lại
// được" vì xóa mềm giữ định danh cũ: đăng ký lại bằng email/SĐT đó cũng không được.
export const DELETED_NOTICE =
  "Tài khoản của bạn đã được xóa. Bạn không thể đăng nhập lại bằng tài khoản này.";
