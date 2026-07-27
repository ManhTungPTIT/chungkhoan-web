// Phân biệt bản build chạy trong app native với bản chạy trên web.
//
// App (Capacitor) chạy trong WebView ở origin `capacitor://localhost` (iOS) hoặc
// `https://localhost` (Android), nên mọi request tới API là cross-origin. Cookie
// refresh của BE đặt `sameSite=lax` sẽ KHÔNG được gửi kèm → app phải nhận và gửi
// lại refresh token qua body. Header dưới đây báo cho BE biết dùng kênh nào
// (xem chart_back/src/untils/clientType.js).
//
// Dựa vào cờ lúc BUILD chứ không dò `window.Capacitor` lúc chạy: dò lúc chạy sẽ
// sai trong test và trong lúc dev bằng trình duyệt, mà đây là quyết định ảnh
// hưởng tới bảo mật nên phải tất định.
export const IS_APP = import.meta.env.VITE_TARGET === "app";

export const CLIENT_HEADERS = IS_APP ? { "X-Client": "app" } : {};

/**
 * Body + header cho lời gọi /auth/refresh, khác nhau theo loại client.
 *
 * Web cố ý trả body `null`: refresh token đi theo cookie, nhét thêm vào body chỉ
 * làm lộ token ra ngoài kênh an toàn mà chẳng được gì.
 */
export function refreshRequestConfig(refreshToken) {
  return IS_APP
    ? { body: { refreshToken }, headers: CLIENT_HEADERS }
    : { body: null, headers: {} };
}
