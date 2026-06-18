import axiosUser from "../untils/axiosUser";

// Endpoint đăng ký người dùng — đổi nếu backend khác
export default async function registerUserHook(data) {
  const response = await axiosUser.post("/api/user/register", data);
  return response;
}
