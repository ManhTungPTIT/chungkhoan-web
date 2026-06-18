import loginUserHook from "../hooks/loginUserHook";
import { setTokens, clearTokens } from "../../admin/untils/tokenStorage";

export function LoginUserService() {
  const login = async (data) => {
    const response = await loginUserHook(data);
    setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
  };

  const logout = () => {
    clearTokens();
    window.location.href = "/login";
  };

  return { login, logout };
}
