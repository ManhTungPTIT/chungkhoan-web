// Chuẩn hoá payload /index-overview thành dữ liệu series cho echarts cột nhóm.
// Màu ĐIỀU KIỆN: cột điểm/% xanh khi ≥0, đỏ khi <0 (value luôn tím).

export const VALUE_COLOR = "#6b1f9c";   // tím — giá trị khớp lệnh
export const DIEM_POS_COLOR = "#4caf50"; // xanh nhạt — điểm tăng
export const PCT_POS_COLOR = "#1b7a3a";  // xanh đậm — % tăng
export const NEG_COLOR = "#e23b3b";      // đỏ — giảm

export function signColor(value, positiveColor) {
  if (value === null || value === undefined) return "transparent";
  return value >= 0 ? positiveColor : NEG_COLOR;
}

const bar = (value, color) =>
  value === null || value === undefined
    ? { value: null }
    : { value, itemStyle: { color } };

// indices: [{ten_san, diem_hien_tai, diem_dong_cua_phien_truoc, gia_tri_khop_lenh, diem_tang_giam, pct}]
export function buildBarSeries(indices) {
  const rows = Array.isArray(indices) ? indices : [];
  return {
    categories: rows.map((r) => r.ten_san),
    valueData: rows.map((r) => bar(r.gia_tri_khop_lenh, VALUE_COLOR)),
    diemData: rows.map((r) => bar(r.diem_tang_giam, signColor(r.diem_tang_giam, DIEM_POS_COLOR))),
    pctData: rows.map((r) => bar(r.pct, signColor(r.pct, PCT_POS_COLOR))),
  };
}
