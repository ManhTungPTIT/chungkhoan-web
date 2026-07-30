import { BANDS, bandForChange, colorForChange } from "./colorBands";

// market_cap thiếu/0/không hợp lệ → gán giá trị tối thiểu để ô vẫn hiện
export const MIN_VALUE = 1;

// Cỡ chữ nhãn ô: chặn hai đầu để ô khổng lồ không có chữ cao bằng nửa ô, và ô
// li ti vẫn còn cỡ chữ hợp lệ cho ECharts truncate thành "…".
export const FONT_MIN = 5;
export const FONT_MAX = 28;

const leafPct = (symbol) => {
  const pct = Number(symbol?.change_pct);
  return Number.isFinite(pct) ? pct : 0;
};

// Chuyển dữ liệu API [{ group, symbols:[{symbol, change_pct, market_cap}] }]
// thành cấu trúc data của ECharts treemap (node ngành → node mã).
// Ngành không có mã hợp lệ bị loại bỏ.
//
// Mỗi lá mang thêm `_share` = value / tổng value toàn bản đồ — dùng để suy ra
// cỡ chữ (xem labelFontSize). Tính ở đây vì chỉ chỗ này thấy được TỔNG của mọi
// ngành; từng ngành riêng lẻ không đủ dữ kiện.
export function buildTreemapData(apiData) {
  if (!Array.isArray(apiData)) return [];

  const sectors = apiData
    .map((sector) => {
      const symbols = Array.isArray(sector?.symbols) ? sector.symbols : [];
      const children = symbols
        .filter((s) => s && s.symbol)
        .map((s) => {
          const safePct = leafPct(s);
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

  const total = sectors.reduce(
    (sum, sector) => sum + sector.children.reduce((s, leaf) => s + leaf.value, 0),
    0,
  );
  for (const sector of sectors) {
    for (const leaf of sector.children) {
      leaf._share = total > 0 ? leaf.value / total : 0;
    }
  }
  return sectors;
}

// Cỡ chữ cho một ô: treemap giữ DIỆN TÍCH ô ∝ value, nên cạnh ô ≈ √(share ×
// diện tích khung). Lấy chữ ~1/6 cạnh vì nhãn có 2 dòng và dòng dài nhất
// ("+2.23%") khoảng 6 ký tự → bề rộng cần ~6× cỡ chữ; tỷ lệ nhỏ hơn sẽ làm ô
// gần vuông bị cắt chữ.
//
// Đây là XẤP XỈ: header tên ngành và các khe gap ăn bớt diện tích thật, nên ô
// thực tế nhỏ hơn tính toán một chút — phần sai số do clamp hai đầu hấp thụ.
export function labelFontSize(share, areaPx) {
  const side = Math.sqrt(Math.max(share, 0) * Math.max(areaPx, 0));
  return Math.round(Math.min(FONT_MAX, Math.max(FONT_MIN, side / 6)));
}

// Gắn label.fontSize cho từng lá theo diện tích khung vẽ hiện tại (px²).
// Tách khỏi buildTreemapData vì cỡ chữ phụ thuộc kích thước container — đổi khi
// resize, còn cấu trúc/màu thì không.
export function withLabelFontSize(data, areaPx) {
  if (!Array.isArray(data)) return [];
  return data.map((sector) => ({
    ...sector,
    children: (sector.children ?? []).map((leaf) => ({
      ...leaf,
      label: { ...leaf.label, fontSize: labelFontSize(leaf._share, areaPx) },
    })),
  }));
}

// Đếm số mã theo 5 mức bảng giá, cho thanh chú giải dưới bản đồ. Đếm trên
// NGUYÊN data API (không phải data treemap đã lọc) nhưng vẫn bỏ mã thiếu
// `symbol` — cùng điều kiện lọc với buildTreemapData nên tổng 5 mức luôn khớp
// số ô đang vẽ.
export function countBands(apiData) {
  const counts = Object.fromEntries(BANDS.map((b) => [b.id, 0]));
  if (!Array.isArray(apiData)) return counts;
  for (const sector of apiData) {
    const symbols = Array.isArray(sector?.symbols) ? sector.symbols : [];
    for (const s of symbols) {
      if (!s || !s.symbol) continue;
      counts[bandForChange(leafPct(s))] += 1;
    }
  }
  return counts;
}
