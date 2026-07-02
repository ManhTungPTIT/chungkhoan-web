import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../feature/auth/admin/untils/tokenStorage";
import axiosClient from "../feature/auth/untils/axiosClient";

// Cổng cho các trang chỉ dành cho khách (chưa đăng nhập): /login, /register.
// Nếu phiên còn hợp lệ → đá về trang chủ, không cho vào lại 2 trang này.
// Logic soi phiên đối xứng với PrivateRoute:
//   không có token            → khách → cho vào
//   token còn hạn / refresh OK → đã đăng nhập → chuyển về "/"
//   token/refresh hết hạn      → khách → cho vào
export default function GuestRoute() {
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "checking" : "guest",
  );

  useEffect(() => {
    if (status !== "checking") return;
    let active = true;

    axiosClient
      .get("/auth/me")
      .then(() => active && setStatus("authed"))
      .catch(() => active && setStatus("guest"));

    return () => {
      active = false;
    };
  }, [status]);

  if (status === "checking") {
    return <div style={{ padding: "2rem" }}>Đang kiểm tra phiên đăng nhập…</div>;
  }
  if (status === "authed") return <Navigate to="/" replace />;

  return <Outlet />;
}
