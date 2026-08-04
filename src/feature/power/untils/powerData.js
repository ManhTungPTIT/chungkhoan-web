import { baselineFactor, surgeMetrics } from "./surgeData";

// Cờ tắt tiêu chí "đột biến dòng tiền so với TB20" (xem surgeData.js). Đặt
// false → nhóm tím quay về chọn theo `value` thô và tia quay về xếp theo
// |pct|, tức NGUYÊN công thức trước 2026-08-04. Không có nút bật/tắt trên
// giao diện: đây là quyết định về cách chấm điểm, không phải tuỳ chọn xem.
const USE_SURGE = true;

// Màu 3 nhóm của "Vòng tròn quyền lực".
const CATEGORY_COLORS = {
  green: "#2e9e5b", // tăng tích cực
  red: "#e53935", // giảm tiêu cực
  purple: "#8e24aa", // dòng tiền vào mạnh
};

export function colorForCategory(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.green;
}

// Mã chưa chấm được đột biến (score null) xếp CUỐI, không so điểm với nhau —
// trả 0 để caller rơi xuống tie-break kế tiếp. Nhờ vậy khi KHÔNG mã nào chấm
// được (BE chưa trả avg_value_20, hoặc USE_SURGE tắt) mọi so sánh đều hoà và
// pipeline tự về đúng công thức cũ.
function byScoreDesc(a, b) {
  if (a.score === null && b.score === null) return 0;
  if (a.score === null) return 1;
  if (b.score === null) return -1;
  return b.score - a.score;
}

// Dựng dữ liệu radar từ board VN100.
// - Chọn topN mã CÂN 2 PHE: nửa suất cho mã tăng, nửa cho mã giảm/đứng giá
//   (mỗi phe theo |change_pct| lớn nhất); phe thiếu người thì nhường suất cho
//   phe kia. Ngày thị trường đỏ mã giảm sâu không chèn hết suất của phe tăng
//   (và ngược lại) — bảo đảm nhóm xanh/đỏ luôn hiện khi thị trường có mã.
//   Tầng này KHÔNG xét đột biến: đổi nó là phá luật cân phe.
// - Trong các mã TĂNG đã chọn, purpleN mã điểm đột biến cao nhất → nhóm tím
//   (ưu tiên trước). Tắt USE_SURGE / chưa mã nào chấm được → theo 'value' thô.
// - Còn lại: tăng → xanh, giảm → đỏ (0 coi như xanh).
// - magnitude = |change_pct| (độ dài tia) — đột biến KHÔNG đổi độ dài tia.
// - Sắp xếp quanh vòng tròn gom theo cung: green → purple → red, trong mỗi
//   nhóm theo điểm đột biến giảm dần (áp đồng nhất cả 3 cung), hoà thì theo
//   magnitude giảm dần.
export function buildPowerData(
  board,
  { topN = 40, purpleN = 10, now, useSurge = USE_SURGE } = {},
) {
  if (!Array.isArray(board)) return [];

  const factor = useSurge ? baselineFactor(now) : null;

  const items = board
    .filter((b) => b && b.symbol)
    .map((b) => {
      const pct = Number(b.change_pct);
      const value = Number(b.value);
      const { surge, score } = useSurge
        ? surgeMetrics(b, factor)
        : { surge: null, score: null };
      return {
        symbol: b.symbol,
        pct: Number.isFinite(pct) ? pct : 0,
        value: Number.isFinite(value) ? value : 0,
        surge,
        score,
      };
    });

  const byAbsPct = (a, b) => Math.abs(b.pct) - Math.abs(a.pct);
  const gainers = items.filter((x) => x.pct > 0).sort(byAbsPct);
  const decliners = items.filter((x) => x.pct <= 0).sort(byAbsPct);
  const half = Math.floor(topN / 2);
  const nGainers = Math.min(gainers.length, Math.max(half, topN - decliners.length));
  const nDecliners = Math.min(decliners.length, topN - nGainers);
  const selected = [
    ...gainers.slice(0, nGainers),
    ...decliners.slice(0, nDecliners),
  ];

  // chỉ mã trên giá tham chiếu mới vào dòng tiền mạnh
  const selectedGainers = selected.filter((x) => x.pct > 0);
  // Không mã tăng nào chấm được đột biến → xếp tím theo 'value' thô như cũ,
  // thay vì để byScoreDesc hoà hết rồi lấy nhầm theo thứ tự |pct|.
  const rankPurple = selectedGainers.some((x) => x.score !== null)
    ? byScoreDesc
    : (a, b) => b.value - a.value;
  const purpleSymbols = new Set(
    [...selectedGainers]
      .sort(rankPurple)
      .slice(0, purpleN)
      .map((x) => x.symbol),
  );

  const enriched = selected.map((x) => {
    let category;
    if (purpleSymbols.has(x.symbol)) category = "purple";
    else if (x.pct < 0) category = "red";
    else category = "green";
    return {
      symbol: x.symbol,
      pct: x.pct,
      value: x.value,
      surge: x.surge,
      score: x.score,
      magnitude: Math.abs(x.pct),
      category,
    };
  });

  const order = { green: 0, purple: 1, red: 2 };
  return enriched.sort((a, b) => {
    if (order[a.category] !== order[b.category]) {
      return order[a.category] - order[b.category];
    }
    const byScore = byScoreDesc(a, b);
    if (byScore !== 0) return byScore;
    return b.magnitude - a.magnitude;
  });
}
