import axiosUser from "../untils/axiosUser";

// Endpoint đăng nhập người dùng (admin dùng /api/auth/login) — đổi nếu backend khác
export default async function loginUserHook(data) {
  const response = await axiosUser.post("/api/user/login", data);
  return response;
}
