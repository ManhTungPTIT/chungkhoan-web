import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../feature/auth/admin/untils/tokenStorage";
import axiosClient from "../feature/auth/untils/axiosClient";

// Gate cho các trang quản trị. Giống PrivateRoute nhưng BẮT BUỘC role === "admin":
//   không có token / token hỏng        → /admin/login
//   token hợp lệ nhưng là user thường   → /admin/login (không đủ quyền)
//   token hợp lệ và là admin            → cho qua
// /api/auth/me trả về { admin: { role, ... } } cho cả user lẫn admin, nên phải
// kiểm tra role để chặn user thường lọt vào dashboard.
export default function AdminPrivateRoute() {
  const [status, setStatus] = useState(() =>
    getAccessToken() ? "checking" : "unauthed",
  );

  useEffect(() => {
    if (status !== "checking") return;
    let active = true;

    axiosClient
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        const role = res.data?.admin?.role;
        setStatus(role === "admin" ? "authed" : "unauthed");
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

  return <Navigate to="/admin/login" replace />;
}
