const ACCESS_KEY = "accessToken";

// "Ghi nhớ đăng nhập": remember=true → localStorage (giữ qua phiên),
// remember=false → sessionStorage (mất khi đóng trình duyệt).
export const getAccessToken = () =>
  localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_KEY, token);}

// Refresh token now lives in an httpOnly cookie — only the access token is
// stored client-side. Any refreshToken passed in is intentionally ignored.
export const setTokens = ({ accessToken, user, remember = true }) => {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(ACCESS_KEY, accessToken);
  other.removeItem(ACCESS_KEY); // tránh trùng token ở hai nơi

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
  localStorage.removeItem("auth-storage"); // xoá hồ sơ user khi đăng xuất
};
