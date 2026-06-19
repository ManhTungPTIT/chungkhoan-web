import axiosAdmin from "../untils/axiosAdmin";

// Danh sách tài khoản đang chờ duyệt
export async function getPendingUsers() {
  const { data } = await axiosAdmin.get("/api/user/pending");
  return data;
}

export async function approveUser(id) {
  const { data } = await axiosAdmin.patch(`/api/user/${id}/approve`);
  return data;
}

export async function rejectUser(id) {
  const { data } = await axiosAdmin.patch(`/api/user/${id}/reject`);
  return data;
}
