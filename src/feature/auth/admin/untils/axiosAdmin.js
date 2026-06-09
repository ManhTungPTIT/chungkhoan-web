import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "./tokenStorage";

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_BACK_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

//gan header  header `Authorization: Bearer <accessToken>`
axiosAdmin.interceptors.request.use(
  (config) => {
    console.log("Add header");
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

//xu ly 401
axiosAdmin.interceptors.response.use(
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
        return axiosAdmin(original);
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
      return axiosAdmin(original);
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      window.location.href = "/admin/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosAdmin;
