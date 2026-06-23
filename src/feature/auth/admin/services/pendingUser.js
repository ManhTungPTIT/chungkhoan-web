import axiosAdmin from "../untils/axiosAdmin";

// Danh sách tài khoản đang chờ duyệt
export async function getPendingUsers() {
  const { data } = await axiosAdmin.get("/user/pending");
  return data;
}

export async function approveUser(id) {
  const { data } = await axiosAdmin.patch(`/user/${id}/approve`);
  return data;
}

export async function rejectUser(id) {
  const { data } = await axiosAdmin.patch(`/user/${id}/reject`);
  return data;
}
