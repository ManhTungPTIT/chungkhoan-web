import { useMutation } from "@tanstack/react-query";
import axiosClient from "../../untils/axiosClient";

// Đổi mật khẩu người dùng đang đăng nhập.
// Đổi path/đặt tên field nếu backend khác /user/change-password.
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await axiosClient.post("/user/change-password", {
        currentPassword,
        newPassword,
      });
      return data?.data ?? data;
    },
  });
}
