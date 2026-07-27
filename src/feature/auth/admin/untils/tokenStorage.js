import { IS_APP } from "../../untils/appClient";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

// "Ghi nhớ đăng nhập": remember=true → localStorage (giữ qua phiên),
// remember=false → sessionStorage (mất khi đóng trình duyệt).
export const getAccessToken = () =>
  localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_KEY, token);}

// ─── Refresh token ────────────────────────────────────────────────────────
// CHỈ tồn tại ở bản app. Trên web refresh token nằm trong cookie httpOnly, JS
// không đọc được và cũng KHÔNG ĐƯỢC lưu lại — lưu là tự vứt bỏ đúng cái lợi của
// httpOnly.
//
// ⚠️ Bản app hiện lưu bằng localStorage của WebView. Đây là bước tạm: kế hoạch là
// chuyển sang Keychain/Keystore qua plugin secure storage của Capacitor (spec mục
// 1.1). Khi chuyển, các hàm dưới đây sẽ phải thành bất đồng bộ vì API secure
// storage là async.
export const getRefreshToken = () =>
  IS_APP
    ? localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
    : null;

export const setRefreshToken = (token, remember = true) => {
  if (!IS_APP || !token) return;
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(REFRESH_KEY, token);
  other.removeItem(REFRESH_KEY);
};

// `refreshToken` chỉ được dùng ở bản app; trên web nó nằm trong cookie httpOnly
// nên setRefreshToken tự bỏ qua.
export const setTokens = ({ accessToken, refreshToken, user, remember = true }) => {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(ACCESS_KEY, accessToken);
  other.removeItem(ACCESS_KEY); // tránh trùng token ở hai nơi

  setRefreshToken(refreshToken, remember);

  // Hồ sơ user theo đúng format mà MainLayout/InfoUser đọc: { state: { user } }.
  // Luôn để ở localStorage cho khớp chỗ đọc; ghi đè dữ liệu cũ để tránh hiển thị sai.
  if (user) {
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user } }));
  } else {
    localStorage.removeItem("auth-storage");
  }
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("auth-storage"); // xoá hồ sơ user khi đăng xuất
};
