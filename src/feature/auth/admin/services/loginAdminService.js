import loginAdminHook from "../hooks/loginAdminHook";
import { setTokens, clearTokens } from "../untils/tokenStorage";

export function LoginAdminService() {
  const login = async (data) => {
    const response = await loginAdminHook(data);
    setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
  };

  const logout = () => {
    clearTokens();
    window.location.href = "/admin/login";
  };

  return { login, logout };
}
