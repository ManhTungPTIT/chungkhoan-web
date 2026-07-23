import { assignSectorColors, labelInk, UNCLASSIFIED } from "../../../untils/sectorColors";

// Ô nhỏ hơn ngưỡng này thì bỏ nhãn, chỉ còn tooltip — chữ không đủ chỗ.
export const LABEL_MIN_PCT = 1.5;

/**
 * Dựng dữ liệu treemap tỷ trọng dòng tiền khớp lệnh theo ngành.
 *
 * Input là payload của GET /api/python/sectors:
 *   [{ group, icb_code, total_value, symbol_count }]
 * trong đó total_value = luỹ kế giá trị KHỚP LỆNH (match.accumulated_value),
 * không gồm thoả thuận.
 *
 * Diện tích ô dùng total_value THÔ, không dùng pct đã làm tròn — làm tròn chỉ
 * phục vụ hiển thị, đưa vào diện tích sẽ tích luỹ sai số.
 */
export function buildMoneyFlow(sectors, dark = false) {
  if (!Array.isArray(sectors)) return { items: [], total: 0 };

  const valid = sectors
    .filter((s) => s && Number.isFinite(Number(s.total_value)) && Number(s.total_value) > 0)
    .map((s) => ({
      name: s.group || UNCLASSIFIED,
      icb_code: String(s.icb_code ?? ""),
      value: Number(s.total_value),
      symbolCount: Number(s.symbol_count) || 0,
    }))
    // Squarified của ECharts cần input đã sort để ô lớn nằm góc trên trái.
    .sort((a, b) => b.value - a.value);

  const total = valid.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return { items: [], total: 0 };

  const colors = assignSectorColors(valid, dark);

  const items = valid.map((s) => {
    const color = colors.get(s.icb_code || s.name);
    return {
      ...s,
      pct: Math.round((s.value / total) * 1000) / 10,
      color,
      ink: labelInk(color),
    };
  });

  return { items, total };
}

// Chuyển sang mảng data của ECharts treemap (1 cấp, không có node con).
export function toEchartsData(items) {
  return items.map((s) => ({
    name: s.name,
    value: s.value,
    _pct: s.pct,
    _count: s.symbolCount,
    itemStyle: { color: s.color },
    label: { color: s.ink },
  }));
}

// Giá trị VND → chuỗi "1.234 tỷ" cho tooltip/bảng.
export function fmtTyDong(value) {
  return `${(value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
}
