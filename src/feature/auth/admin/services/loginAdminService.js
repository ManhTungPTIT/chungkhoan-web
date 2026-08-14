import loginAdminHook from "../hooks/loginAdminHook";
import axiosClient from "../../untils/axiosClient";
import { clearTokens, getRefreshToken, setTokens } from "../untils/tokenStorage";
import { refreshRequestConfig } from "../../untils/appClient";

export function LoginAdminService() {
  const login = async (data) => {
    const response = await loginAdminHook(data);
    await setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
  };

  const logout = async () => {
    try {
      const { body } = refreshRequestConfig(await getRefreshToken());
      await axiosClient.post("/auth/logout", body);
    } catch {
      // best-effort; clear locally regardless
    }
    await clearTokens();
    window.location.href = "/admin/login";
  };

  return { login, logout };
}
