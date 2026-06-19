import axiosAdmin from "../untils/axiosAdmin";

// Toàn bộ user (trừ đã xóa) — dùng cho các tab Danh sách / Khóa / Nâng hạn mức
export async function getUsers() {
  const { data } = await axiosAdmin.get("/api/user");
  return data;
}

export async function lockUser(id) {
  const { data } = await axiosAdmin.patch(`/api/user/${id}/lock`);
  return data;
}

export async function unlockUser(id) {
  const { data } = await axiosAdmin.patch(`/api/user/${id}/unlock`);
  return data;
}

export async function deleteUser(id) {
  const { data } = await axiosAdmin.delete(`/api/user/${id}`);
  return data;
}

export async function setPackage(id, days) {
  const { data } = await axiosAdmin.patch(`/api/user/${id}/package`, { days });
  return data;
}
