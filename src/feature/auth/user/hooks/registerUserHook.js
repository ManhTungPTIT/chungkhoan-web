import axiosClient from "../../untils/axiosClient";

// Endpoint đăng ký người dùng — đổi nếu backend khác
export default async function registerUserHook(data) {
  const response = await axiosClient.post("/api/user/register", data);
  return response;
}
