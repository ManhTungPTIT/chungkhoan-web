import loginUserHook from "../hooks/loginUserHook";
import axiosClient from "../../untils/axiosClient";
import { setTokens, clearTokens } from "../../admin/untils/tokenStorage";

export function LoginUserService() {
  const login = async (data, remember = true) => {
    const response = await loginUserHook(data);
    // Lấy user từ response (đổi đường dẫn nếu backend trả khác)
    const user = response.data.user ?? response.data.data?.user ?? null;
    setTokens({ accessToken: response.data.accessToken, user, remember });
  };

  const logout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {
      // best-effort; clear locally regardless
    }
    clearTokens();
    window.location.href = "/login";
  };

  return { login, logout };
}
