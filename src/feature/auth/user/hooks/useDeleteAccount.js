import { useMutation } from "@tanstack/react-query";
import axiosClient from "../../untils/axiosClient";

// Người dùng tự xóa tài khoản mình. Danh tính lấy từ access token (interceptor của
// axiosClient tự gắn Authorization) — body chỉ có mật khẩu để xác nhận.
//
// CẨN THẬN: `axios.delete` KHÔNG nhận body ở tham số thứ hai như `post`/`patch` —
// phải bọc trong `{ data }`. Viết như post thì password lặng lẽ mất và BE luôn 400.
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async ({ password }) => {
      const { data } = await axiosClient.delete("/user/me", {
        data: { password },
      });
      return data?.data ?? data;
    },
  });
}
