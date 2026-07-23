// Định dạng cho biểu đồ cột "giá trị + %" (ValueShareBarChart). Tách khỏi
// component để test được mà không phải kéo theo echarts/scss.

// 13877 → "13.877" (dấu phân cách nghìn kiểu VN).
export function fmtTy(ty) {
  return ty.toLocaleString("vi-VN");
}
