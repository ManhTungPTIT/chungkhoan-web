import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from "../admin/untils/tokenStorage";
import { CLIENT_HEADERS, IS_APP, refreshRequestConfig } from "./appClient";

// Single axios instance for both user and admin. The refresh token rides in an
// httpOnly cookie, so withCredentials must be on for it to be sent/received.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_NODEJS_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const redirectToLogin = () => {
  const path = window.location.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";
  window.location.href = path;
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Báo cho BE biết đây là client app → nó trả refresh token qua body thay vì
    // cookie (xem appClient.js). Trên web object này rỗng nên không đổi gì.
    Object.assign(config.headers, CLIENT_HEADERS);
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Web: không body — refresh token tự đi theo cookie.
      // App: token đi trong body vì WebView chạy cross-origin, cookie không được gửi.
      // Bare axios (no interceptor) so a 401 from /refresh can't re-enter this
      // handler and deadlock the queue — it surfaces in the catch below instead.
      const { body, headers } = refreshRequestConfig(getRefreshToken());
      const { data } = await axios.post(
        `${import.meta.env.VITE_NODEJS_API_URL}/auth/refresh`,
        body,
        { withCredentials: true, headers },
      );
      setAccessToken(data.accessToken);
      // BE xoay vòng refresh token và coi token cũ dùng lại là bị đánh cắp (nó
      // thu hồi TOÀN BỘ phiên). Không ghi đè bản mới ở đây thì lần refresh kế
      // tiếp sẽ đá người dùng ra khỏi mọi thiết bị.
      if (IS_APP && data.refreshToken) setRefreshToken(data.refreshToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosClient(original);
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
