import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearTokens,
} from "../admin/untils/tokenStorage";

// Single axios instance for both user and admin. The refresh token rides in an
// httpOnly cookie, so withCredentials must be on for it to be sent/received.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BACK_API_URL,
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
      // No body — the refresh token is sent automatically as a cookie.
      const { data } = await axiosClient.post("/api/auth/refresh");
      setAccessToken(data.accessToken);
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
