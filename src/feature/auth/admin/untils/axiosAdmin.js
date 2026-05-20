import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './tokenStorage';

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_BACK_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

axiosAdmin.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosAdmin.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

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
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACK_API_URL}/api/auth/refresh`,
        { refreshToken: getRefreshToken() },
      );
      setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosAdmin(original);
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      window.location.href = '/admin/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosAdmin;
