import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../feature/auth/admin/untils/tokenStorage";
import axiosClient from "../feature/auth/untils/axiosClient";

// Validate the session via the protected /api/auth/me endpoint:
//   access valid                  → 200 → allow
//   access expired, refresh OK     → interceptor refreshes + retries → 200 → allow
//   refresh expired/reused         → interceptor clears + redirects; we also fall
//                                    back to unauthed here
export default function PrivateRoute({ requiredRole }) {
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "checking" : "unauthed",
  );

  useEffect(() => {
    if (status !== "checking") return;
    let active = true;

    axiosClient
      .get("/api/auth/me")
      .then((res) => {
        if (!active) return;
        const role = res.data?.admin?.role;
        if (requiredRole && role !== requiredRole) {
          setStatus("forbidden");
        } else {
          setStatus("authed");
        }
      })
      .catch(() => active && setStatus("unauthed"));

    return () => {
      active = false;
    };
  }, [status, requiredRole]);

  if (status === "checking") {
    return <div style={{ padding: "2rem" }}>Đang kiểm tra phiên đăng nhập…</div>;
  }
  if (status === "authed") return <Outlet />;

  const loginPath = requiredRole === "admin" ? "/admin/login" : "/login";
  return <Navigate to={loginPath} replace />;
}
