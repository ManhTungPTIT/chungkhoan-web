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

/**
 * Rời hẳn app về màn đăng nhập, kèm `?reason=` để bên kia giải thích được vì sao.
 *
 * Tải lại trang thật (`location.href`) chứ không `navigate()`: phiên đã chết, mọi cache
 * react-query và state trong bộ nhớ phải biến mất theo.
 */
export function goToLogin(reason) {
  window.location.href = reason ? `/login?reason=${reason}` : "/login";
}
