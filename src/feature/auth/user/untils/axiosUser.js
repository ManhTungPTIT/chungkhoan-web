import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "../../admin/untils/tokenStorage";

// Cùng backend auth với admin (VITE_BACK_API_URL); khác ở chỗ phiên hết hạn
// thì đưa người dùng về /login thay vì /admin/login.
const axiosUser = axios.create({
  baseURL: import.meta.env.VITE_BACK_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// Gắn header `Authorization: Bearer <accessToken>`
axiosUser.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý 401: thử refresh token, thất bại thì xoá token và về /login
axiosUser.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      !error.config ||
      error.response?.status !== 401 ||
      error.config._retry
    ) {
      return Promise.reject(error);
    }
    const original = error.config;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosUser(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const baseUrl = (import.meta.env.VITE_BACK_API_URL || "").replace(
        /\/$/,
        "",
      );
      const { data } = await axios.post(`${baseUrl}/api/auth/refresh`, {
        refreshToken: getRefreshToken(),
      });
      setAccessToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosUser(original);
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosUser;
