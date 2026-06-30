import { useMutation } from "@tanstack/react-query";
import axiosClient from "../../untils/axiosClient";

// Đổi mật khẩu người dùng đang đăng nhập. Danh tính lấy từ access token
// (interceptor của axiosClient tự gắn Authorization) — KHÔNG gửi token trong body.
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await axiosClient.patch("/user/changePassword", {
        currentPassword,
        newPassword,
      });
      return data?.data ?? data;
    },
  });
}
