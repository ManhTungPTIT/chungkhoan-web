// Tên gói đang dùng để hiển thị (header MainLayout, ...).
// Quy tắc thống nhất với BE: gói đang dùng = packageRequest ĐÃ được duyệt
// (status === "approved"); pending/rejected/chưa từng yêu cầu → không có gói.
//
// me     — hồ sơ từ API /user/me (nguồn chuẩn).
// stored — user lưu ở auth-storage lúc login (có sẵn packageTitle) — chỉ dùng
//          fallback khi API CHƯA về; API đã về mà không có gói thì không lấy
//          dữ liệu cũ đè lên sự thật mới.
export function activePackageTitle(me, stored) {
  if (me) {
    const req = me.packageRequest;
    return req?.status === "approved" ? req.titles ?? null : null;
  }
  return stored?.packageTitle ?? null;
}
