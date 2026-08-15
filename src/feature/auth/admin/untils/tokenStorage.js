import { IS_APP } from "../../untils/appClient";
import {
  getSecureValue,
  removeSecureValue,
  setSecureValue,
} from "../../untils/secureStorage";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

let refreshTokenCache = null;
let refreshTokenRemembered = false;
let initializationPromise = null;

// "Ghi nhớ đăng nhập": remember=true → localStorage (giữ qua phiên),
// remember=false → sessionStorage (mất khi đóng trình duyệt).
export const getAccessToken = () =>
  localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
export const setAccessToken = (token) => {
  const store = sessionStorage.getItem(ACCESS_KEY) && !localStorage.getItem(ACCESS_KEY)
    ? sessionStorage
    : localStorage;
  store.setItem(ACCESS_KEY, token);
};

// ─── Refresh token ────────────────────────────────────────────────────────
// CHỈ tồn tại ở bản app. Trên web refresh token nằm trong cookie httpOnly, JS
// không đọc được và cũng KHÔNG ĐƯỢC lưu lại — lưu là tự vứt bỏ đúng cái lợi của
// httpOnly.
//
// Bản app: refresh token dài hạn nằm trong kho bảo mật của hệ điều hành qua plugin
// local — Keystore trên Android, Keychain trên iOS. `remember=false` chỉ giữ token
// trong RAM, tương đương session cũ nhưng không để plaintext trong WebView storage.
// Web vẫn dùng cookie httpOnly và luôn trả null.
async function initializeAppRefreshToken() {
  const persistentLegacy = localStorage.getItem(REFRESH_KEY);
  const sessionLegacy = sessionStorage.getItem(REFRESH_KEY);
  const legacyToken = persistentLegacy || sessionLegacy;

  // Xóa plaintext ngay đầu quá trình migration. Nếu Keystore lỗi, fail closed:
  // đăng xuất thay vì tiếp tục giữ refresh token ở nơi không an toàn.
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);

  try {
    const secureToken = await getSecureValue(REFRESH_KEY);
    if (secureToken) {
      refreshTokenCache = secureToken;
      refreshTokenRemembered = true;
      return;
    }

    if (legacyToken) {
      refreshTokenCache = legacyToken;
      refreshTokenRemembered = Boolean(persistentLegacy);
      if (persistentLegacy) {
        await setSecureValue(REFRESH_KEY, legacyToken);
      }
    }
  } catch (error) {
    refreshTokenCache = null;
    refreshTokenRemembered = false;
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("auth-storage");
    console.error("Không mở được kho bảo mật của thiết bị; cần đăng nhập lại.", error);
  }
}

export function initializeTokenStorage() {
  if (!IS_APP) return Promise.resolve();
  if (!initializationPromise) {
    initializationPromise = initializeAppRefreshToken();
  }
  return initializationPromise;
}

export const getRefreshToken = async () => {
  if (!IS_APP) return null;
  await initializeTokenStorage();
  return refreshTokenCache;
};

export const setRefreshToken = async (token, remember = refreshTokenRemembered) => {
  if (!IS_APP || !token) return;
  await initializeTokenStorage();
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);

  // Fail closed, cùng lý lẽ với migration ở trên. Kho bảo mật ghi hỏng mà ta vẫn giữ token
  // trong cache thì app chạy tiếp như đã đăng nhập, trong khi trên thiết bị không có gì —
  // tắt đi mở lại là mất phiên, không dấu hiệu báo trước. Thà lộ lỗi ngay tại đây.
  try {
    if (remember) {
      await setSecureValue(REFRESH_KEY, token);
    } else {
      await removeSecureValue(REFRESH_KEY);
    }
  } catch (error) {
    refreshTokenCache = null;
    refreshTokenRemembered = false;
    console.error("Không ghi được refresh token vào kho bảo mật của thiết bị.", error);
    throw error;
  }

  refreshTokenCache = token;
  refreshTokenRemembered = remember;
};

// `refreshToken` chỉ được dùng ở bản app; trên web nó nằm trong cookie httpOnly
// nên setRefreshToken tự bỏ qua.
export const setTokens = async ({ accessToken, refreshToken, user, remember = true }) => {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(ACCESS_KEY, accessToken);
  other.removeItem(ACCESS_KEY); // tránh trùng token ở hai nơi

  try {
    await setRefreshToken(refreshToken, remember);
  } catch (error) {
    localStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("auth-storage");
    throw error;
  }

  // Hồ sơ user theo đúng format mà MainLayout/InfoUser đọc: { state: { user } }.
  // Luôn để ở localStorage cho khớp chỗ đọc; ghi đè dữ liệu cũ để tránh hiển thị sai.
  if (user) {
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user } }));
  } else {
    localStorage.removeItem("auth-storage");
  }
};

export const clearTokens = async () => {
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("auth-storage"); // xoá hồ sơ user khi đăng xuất
  refreshTokenCache = null;
  refreshTokenRemembered = false;
  if (IS_APP) {
    try {
      await removeSecureValue(REFRESH_KEY);
    } catch (error) {
      // Token WebView đã bị xóa; báo lỗi nhưng không giữ người dùng ở màn cũ.
      console.error("Không xoá được refresh token khỏi kho bảo mật của thiết bị.", error);
    }
  }
};
