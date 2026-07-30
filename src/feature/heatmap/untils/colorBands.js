// Màu ô treemap theo % thay đổi, kiểu bảng giá VN.
// Ngưỡng trần/sàn xấp xỉ ±6.5% (HOSE ±7%) vì chỉ có change_pct, không có giá tham chiếu.
export const CEILING = 6.5; // kịch trần
export const FLOOR = -6.5; // sàn
export const REF_EPS = 0.05; // |pct| < REF_EPS coi như tham chiếu

const CEILING_COLOR = "#C026D3"; // tím
const FLOOR_COLOR = "#22A7F0"; // xanh dương
const REF_COLOR = "#f6bd51"; // vàng
const UP_COLOR = "#00d31f"; // xanh lá
const DOWN_COLOR = "#ef2f2e"; // đỏ

// 5 mức của bảng giá, THỨ TỰ = thứ tự hiện trên thanh chú giải dưới bản đồ.
// Dùng chung cho ô treemap (colorForChange) và chú giải + bộ đếm (countBands)
// để hai chỗ không bao giờ lệch màu/nhãn.
//
// Trước đây mức tăng/giảm còn chia 3 sắc độ theo biên độ (<1%, 1–3%, ≥3%) nhưng
// cả 3 hằng số đều gán CÙNG một mã màu — phân tầng đã chết từ lâu, chỉ còn lại
// 3 nhánh if không tạo ra khác biệt nào. Đã gộp về một màu mỗi chiều.
export const BANDS = [
  { id: "ceiling", label: "Tăng trần", color: CEILING_COLOR },
  { id: "up", label: "Tăng giá", color: UP_COLOR },
  { id: "ref", label: "Đứng giá", color: REF_COLOR },
  { id: "down", label: "Giảm giá", color: DOWN_COLOR },
  { id: "floor", label: "Giảm sàn", color: FLOOR_COLOR },
];

const COLOR_BY_BAND = Object.fromEntries(BANDS.map((b) => [b.id, b.color]));

// pct: số phần trăm (vd 6.15 = +6.15%). Trả về id mức trong BANDS.
export function bandForChange(pct) {
  if (pct >= CEILING) return "ceiling";
  if (pct <= FLOOR) return "floor";
  if (pct > REF_EPS) return "up";
  if (pct < -REF_EPS) return "down";
  return "ref";
}

// pct: số phần trăm (vd 6.15 = +6.15%). Trả về mã màu hex.
export function colorForChange(pct) {
  return COLOR_BY_BAND[bandForChange(pct)];
}
