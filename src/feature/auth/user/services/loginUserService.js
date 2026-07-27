import loginUserHook from "../hooks/loginUserHook";
import axiosClient from "../../untils/axiosClient";
import {
  setTokens,
  clearTokens,
  getRefreshToken,
} from "../../admin/untils/tokenStorage";
import { refreshRequestConfig } from "../../untils/appClient";

export function LoginUserService() {
  const login = async (data, remember = true) => {
    const response = await loginUserHook(data);
    // Lấy user từ response (đổi đường dẫn nếu backend trả khác)
    const user = response.data.user ?? response.data.data?.user ?? null;
    // `refreshToken` chỉ có ở bản app — trên web nó nằm trong cookie httpOnly và
    // setTokens tự bỏ qua giá trị undefined này.
    setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user,
      remember,
    });
  };

  const logout = async () => {
    try {
      // App phải gửi kèm refresh token để BE thu hồi đúng phiên; web thì BE đọc
      // từ cookie nên body là null.
      const { body } = refreshRequestConfig(getRefreshToken());
      await axiosClient.post("/auth/logout", body);
    } catch {
      // best-effort; clear locally regardless
    }
    clearTokens();
    window.location.href = "/login";
  };

  return { login, logout };
}
