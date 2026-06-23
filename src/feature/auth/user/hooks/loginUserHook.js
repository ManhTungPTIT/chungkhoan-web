import axiosClient from "../../untils/axiosClient";

// Endpoint đăng nhập người dùng (admin dùng /api/auth/login) — đổi nếu backend khác
export default async function loginUserHook(data) {
  const response = await axiosClient.post("/user/login", data);
  return response;
}
