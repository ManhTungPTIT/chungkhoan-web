// Màu ô treemap kiểu bảng giá VN.
//
// Luật CHÍNH là bandForRow (so giá với trần/sàn thật, khớp market_status_service
// ở BE). Bộ ngưỡng ±6.5% dưới đây chỉ còn là ĐƯỜNG LÙI cho payload cũ chưa mang
// giá tham chiếu — xấp xỉ theo HOSE (±7%) nên sai với HNX (±10%) và UPCOM (±15%).
export const CEILING = 6.5; // kịch trần
export const FLOOR = -6.5; // sàn
export const REF_EPS = 0.05; // |pct| < REF_EPS coi như tham chiếu

const CEILING_COLOR = "#C026D3"; // tím
const FLOOR_COLOR = "#22A7F0"; // xanh dương
const REF_COLOR = "#f6bd51"; // vàng
const UP_COLOR = "#00d31f"; // xanh lá
const DOWN_COLOR = "#ef2f2e"; // đỏ

// 5 mức của bảng giá, THỨ TỰ = thứ tự hiện trên thanh chú giải dưới bản đồ.
// Dùng chung cho ô treemap (colorForRow) và chú giải + bộ đếm (countBands)
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

const num = (value) => {
  const out = Number(value);
  return Number.isFinite(out) ? out : 0;
};

// Phân loại một mã theo GIÁ THẬT — bản sao từng nhánh của
// market_status_service.classify_row (BE), để bản đồ nhiệt và chart "Bức tranh
// thị trường" không bao giờ đếm lệch nhau.
//
// Phải kiểm tra trần/sàn TRƯỚC khi so tăng/giảm, và phải so giá chứ không so %:
// biên độ khác nhau theo sàn (HOSE ±7%, HNX ±10%, UPCOM ±15%) nên ngưỡng cứng
// ±6.5% của bandForChange tô nhầm mọi mã HNX/UPCOM tăng >6.5% thành kịch trần
// (vd LLM +13.45% khi trần còn cách 400đ).
//
// Thiếu `ref` (payload cũ chỉ có change_pct — fallback board_vn100, cache đĩa cũ)
// → rơi về ngưỡng ±6.5%: kém chính xác nhưng còn hơn tô cả bản đồ thành vàng.
export function bandForRow(row) {
  const ref = num(row?.ref);
  if (!ref) return bandForChange(num(row?.change_pct));
  const price = num(row?.price);
  const ceiling = num(row?.ceiling);
  const floor = num(row?.floor);
  if (ceiling && price === ceiling) return "ceiling";
  if (floor && price === floor) return "floor";
  if (!price || price === ref) return "ref";
  return price > ref ? "up" : "down";
}

// row: một mã trong payload /heatmap. Trả về mã màu hex.
export function colorForRow(row) {
  return COLOR_BY_BAND[bandForRow(row)];
}
