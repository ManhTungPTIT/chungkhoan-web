// Màu 3 nhóm của "Vòng tròn quyền lực".
const CATEGORY_COLORS = {
  green: "#2e9e5b", // tăng tích cực
  red: "#e53935", // giảm tiêu cực
  purple: "#8e24aa", // dòng tiền vào mạnh
};

export function colorForCategory(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.green;
}

// Dựng dữ liệu radar từ board VN100.
// - Chọn topN mã theo |change_pct| lớn nhất.
// - Trong đó, purpleN mã có 'value' lớn nhất → nhóm tím (ưu tiên trước).
// - Còn lại: tăng → xanh, giảm → đỏ (0 coi như xanh).
// - magnitude = |change_pct| (độ dài tia).
// - Sắp xếp quanh vòng tròn gom theo cung: green → purple → red,
//   trong mỗi nhóm theo magnitude giảm dần.
export function buildPowerData(board, { topN = 40, purpleN = 10 } = {}) {
  if (!Array.isArray(board)) return [];

  const items = board
    .filter((b) => b && b.symbol)
    .map((b) => {
      const pct = Number(b.change_pct);
      const value = Number(b.value);
      return {
        symbol: b.symbol,
        pct: Number.isFinite(pct) ? pct : 0,
        value: Number.isFinite(value) ? value : 0,
      };
    });

  const selected = [...items]
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, topN);

  const purpleSymbols = new Set(
    [...selected]
      .filter((x) => x.pct > 0) // chỉ mã trên giá tham chiếu mới vào dòng tiền mạnh
      .sort((a, b) => b.value - a.value)
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
      magnitude: Math.abs(x.pct),
      category,
    };
  });

  const order = { green: 0, purple: 1, red: 2 };
  return enriched.sort((a, b) => {
    if (order[a.category] !== order[b.category]) {
      return order[a.category] - order[b.category];
    }
    return b.magnitude - a.magnitude;
  });
}
