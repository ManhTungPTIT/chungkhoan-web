// Màu ô treemap theo % thay đổi, kiểu bảng giá VN.
// Ngưỡng trần/sàn xấp xỉ ±6.5% (HOSE ±7%) vì chỉ có change_pct, không có giá tham chiếu.
export const CEILING = 6.5; // kịch trần
export const FLOOR = -6.5; // sàn
export const REF_EPS = 0.05; // |pct| < REF_EPS coi như tham chiếu

const CEILING_COLOR = "#C026D3"; // tím
const FLOOR_COLOR = "#22A7F0"; // xanh dương
const REF_COLOR = "#F4D03F"; // vàng

// xanh lá đậm dần theo biên độ tăng
const UP_SMALL = "#26a69a";
const UP_MID = "#1c8a78";
const UP_STRONG = "#0b6e4f";

// đỏ đậm dần theo biên độ giảm
const DOWN_SMALL = "#ef5350";
const DOWN_MID = "#c62828";
const DOWN_STRONG = "#a01818";

// pct: số phần trăm (vd 6.15 = +6.15%). Trả về mã màu hex.
export function colorForChange(pct) {
  if (pct >= CEILING) return CEILING_COLOR;
  if (pct <= FLOOR) return FLOOR_COLOR;
  if (pct > REF_EPS) {
    if (pct < 1) return UP_SMALL;
    if (pct < 3) return UP_MID;
    return UP_STRONG;
  }
  if (pct < -REF_EPS) {
    if (pct > -1) return DOWN_SMALL;
    if (pct > -3) return DOWN_MID;
    return DOWN_STRONG;
  }
  return REF_COLOR;
}
