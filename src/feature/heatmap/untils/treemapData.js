import { colorForChange } from "./colorBands";

// market_cap thiếu/0/không hợp lệ → gán giá trị tối thiểu để ô vẫn hiện
export const MIN_VALUE = 1;

// Chuyển dữ liệu API [{ group, symbols:[{symbol, change_pct, market_cap}] }]
// thành cấu trúc data của ECharts treemap (node ngành → node mã).
// Ngành không có mã hợp lệ bị loại bỏ.
export function buildTreemapData(apiData) {
  if (!Array.isArray(apiData)) return [];

  return apiData
    .map((sector) => {
      const symbols = Array.isArray(sector?.symbols) ? sector.symbols : [];
      const children = symbols
        .filter((s) => s && s.symbol)
        .map((s) => {
          const pct = Number(s.change_pct);
          const safePct = Number.isFinite(pct) ? pct : 0;
          const cap = Number(s.market_cap);
          return {
            name: s.symbol,
            value: Number.isFinite(cap) && cap > 0 ? cap : MIN_VALUE,
            _pct: safePct,
            itemStyle: { color: colorForChange(safePct) },
          };
        });
      return { name: sector?.group ?? "", children };
    })
    .filter((node) => node.children.length > 0);
}
