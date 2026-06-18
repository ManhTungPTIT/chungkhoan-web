import axiosAdmin from "../untils/axiosAdmin";

export default async function loginAdminHook(data) {
  const response = await axiosAdmin.post("/api/auth/login", data);
  return response;
}
