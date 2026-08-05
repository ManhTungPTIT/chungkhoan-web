import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../feature/auth/admin/untils/tokenStorage";
import axiosClient from "../feature/auth/untils/axiosClient";
import { useSessionGuard } from "../feature/auth/user/hooks/useSessionGuard";

// Validate the session via the protected /api/auth/me endpoint:
//   access valid                  → 200 → allow
//   access expired, refresh OK     → interceptor refreshes + retries → 200 → allow
//   refresh expired/reused         → interceptor clears + redirects; we also fall
//                                    back to unauthed here
export default function PrivateRoute() {
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "checking" : "unauthed",
  );

  // Nhịp hỏi "phiên còn sống không" đặt Ở ĐÂY chứ không trong component biểu đồ:
  // PrivateRoute bọc cả khu đăng nhập và mount đúng một lần, còn biểu đồ thì
  // mount/unmount liên tục theo điều hướng — mỗi lần mount là một nhịp poll mới.
  // Phải gọi trước mọi nhánh return để không phạm quy tắc hook.
  useSessionGuard(status === "authed");

  useEffect(() => {
    if (status !== "checking") return;
    let active = true;

    axiosClient
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        const role = res.data?.admin?.role;
        
          setStatus("authed");
        
      })
      .catch(() => active && setStatus("unauthed"));

    return () => {
      active = false;
    };
  }, [status]);

  if (status === "checking") {
    return <div style={{ padding: "2rem" }}>Đang kiểm tra phiên đăng nhập…</div>;
  }
  if (status === "authed") return <Outlet />;

  const loginPath = "/login";
  return <Navigate to={loginPath} replace />;
}
