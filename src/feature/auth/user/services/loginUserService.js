import loginUserHook from "../hooks/loginUserHook";
import axiosClient from "../../untils/axiosClient";
import { setTokens, clearTokens } from "../../admin/untils/tokenStorage";

export function LoginUserService() {
  const login = async (data) => {
    const response = await loginUserHook(data);
    setTokens({ accessToken: response.data.accessToken });
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
