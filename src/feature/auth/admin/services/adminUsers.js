import axiosAdmin from "../untils/axiosAdmin";

// Toàn bộ user (trừ đã xóa) — dùng cho các tab Danh sách / Khóa / Nâng hạn mức
export async function getUsers() {
  const { data } = await axiosAdmin.get("/user");
  return data;
}

export async function lockUser(id) {
  const { data } = await axiosAdmin.patch(`/user/${id}/lock`);
  return data;
}

export async function unlockUser(id) {
  const { data } = await axiosAdmin.patch(`/user/${id}/unlock`);
  return data;
}

export async function deleteUser(id) {
  const { data } = await axiosAdmin.delete(`/user/${id}`);
  return data;
}

export async function setPackage(id, days) {
  const { data } = await axiosAdmin.patch(`/user/${id}/package`, { days });
  return data;
}

export async function getPackageRequests() {
  const { data } = await axiosAdmin.get("/user/package-request/pending");
  return data;
}

export async function approvePackageRequest(id) {
  const { data } = await axiosAdmin.patch(`/user/package-request/${id}/approve`);
  return data;
}

export async function rejectPackageRequest(id) {
  const { data } = await axiosAdmin.patch(`/user/package-request/${id}/reject`);
  return data;
}
