import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../feature/auth/untils/axiosClient";
import {
  getAccessToken,
  clearTokens,
} from "../feature/auth/admin/untils/tokenStorage";

// "admin" cho mọi path /admin*, "user" cho phần còn lại của app.
const areaOf = (pathname) =>
  pathname.startsWith("/admin") ? "admin" : "user";

// Vùng đang đứng trước đó — lưu sessionStorage để nhận biết cả khi đổi link bằng
// điều hướng SPA lẫn gõ thẳng URL (full reload, mất state trong bộ nhớ).
const LAST_AREA_KEY = "auth.lastArea";

// Bảo mật: khi người dùng đổi link giữa vùng ADMIN (/admin*) và vùng USER (mọi
// path còn lại) — theo cả hai chiều — tự thực hiện THÊM 1 BƯỚC LOGOUT: thu hồi
// phiên ở backend (best-effort) rồi xoá token cục bộ và đưa về trang đăng nhập
// của vùng mới. Admin/user dùng chung accessToken nên không được mang phiên cũ
// sang vùng kia. Chỉ ép logout/redirect khi đang có phiên (có token).
//
// NGOẠI LỆ: tài khoản admin có quyền xem cả hai vùng — admin mở URL trang user
// (hoặc quay lại admin) thì vào bình thường, KHÔNG bị ép logout. Chỉ user thường
// mang token sang vùng khác mới bị dọn phiên.
export function useLogoutOnAreaSwitch() {
  const { pathname } = useLocation();

  useEffect(() => {
    const area = areaOf(pathname);

    let prevArea = null;
    try {
      prevArea = sessionStorage.getItem(LAST_AREA_KEY);
      sessionStorage.setItem(LAST_AREA_KEY, area);
    } catch {
      // sessionStorage có thể bị chặn (private mode) — bỏ qua.
    }

    // Lần đầu mở app (chưa có vùng cũ) hoặc vẫn cùng vùng → không làm gì.
    if (!prevArea || prevArea === area) return;

    // Chưa đăng nhập: chỉ dọn cho chắc, không chặn điều hướng.
    if (!getAccessToken()) {
      void clearTokens();
      return;
    }

    (async () => {
      // Admin được phép ở cả hai vùng → không ép logout khi đổi vùng.
      // Không xác định được vai trò (API lỗi) thì cứ logout cho an toàn.
      try {
        const res = await axiosClient.get("/auth/me");
        if (res.data?.admin?.role === "admin") return;
      } catch {
        // bỏ qua — coi như phiên không xác thực được, tiếp tục dọn phiên.
      }

      try {
        await axiosClient.post("/auth/logout");
      } catch {
        // best-effort — vẫn xoá token cục bộ dù API lỗi.
      }
      await clearTokens();
      // Reload sang login của vùng MỚI để reset sạch state/cache, tránh race với
      // guard (PrivateRoute/AdminPrivateRoute đọc token ngay lúc mount).
      window.location.href = area === "admin" ? "/admin/login" : "/login";
    })();
  }, [pathname]);
}
