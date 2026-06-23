import loginAdminHook from "../hooks/loginAdminHook";
import axiosClient from "../../untils/axiosClient";
import { setTokens, clearTokens } from "../untils/tokenStorage";

export function LoginAdminService() {
  const login = async (data) => {
    const response = await loginAdminHook(data);
     setTokens({ accessToken: response.data.accessToken });
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {
      // best-effort; clear locally regardless
    }
    clearTokens();
    window.location.href = "/admin/login";
  };

  return { login, logout };
}
