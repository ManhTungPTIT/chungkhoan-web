// Mã lỗi phiên do BE trả trong body 401 (chart_back/src/untils/authErrors.js).
export const SESSION_SUPERSEDED = "SESSION_SUPERSEDED";

/**
 * Đích khi phiên hỏng và phải đẩy người dùng về màn đăng nhập.
 *
 * Kèm `?reason=superseded` khi bị đá vì đăng nhập nơi khác: không nói gì thì
 * người dùng chỉ thấy mình bị đăng xuất vô cớ giữa chừng.
 */
export function loginRedirectPath(pathname, code) {
  const base = String(pathname ?? "").startsWith("/admin") ? "/admin/login" : "/login";
  return code === SESSION_SUPERSEDED ? `${base}?reason=superseded` : base;
}
