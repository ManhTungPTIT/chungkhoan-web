// Màu 3 series khớp legend hình mẫu: T+2 vàng, T+3 xanh lá, T+5 tím.
export const SERIES_META = [
  { key: "t2", name: "Tăng cao nhất T+2", color: "#F2B600" },
  { key: "t3", name: "Tăng cao nhất T+3", color: "#1E8B3B" },
  { key: "t5", name: "Tăng cao nhất T+5", color: "#7B1FA2" },
];

// Tâm + bán kính radar. Dùng CHUNG cho cả radar và lưới vuông overlay để trùng khít.
// ECharts radar: bán kính % tính theo min(width,height)/2.
export const CENTER_X_RATIO = 0.5;
export const CENTER_Y_RATIO = 0.56;
export const RADAR_RADIUS_RATIO = 0.78;
export const GRID_SPLIT_NUMBER = 8; // số hình vuông đồng tâm

const fmtPct = (v) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;

/**
 * Thang trục dùng CHUNG cho mọi mã (so sánh được). min hạ dưới 0 nếu có mã tăng
 * âm ở cửa sổ ngắn (giá rớt rồi mới hồi). max làm tròn lên bội 10.
 */
export function computeAxisBounds(payload) {
  const series = payload?.series ?? {};
  const all = SERIES_META.flatMap((m) => series[m.key] ?? []);
  const dataMax = all.length ? Math.max(...all) : 1;
  const dataMin = all.length ? Math.min(...all) : 0;
  const step = dataMax > 100 ? 100 : 10;
  const axisMax = Math.max(step, Math.ceil(dataMax / step) * step);
  const axisMin = dataMin < 0 ? Math.floor(dataMin / step) * step : 0;
  return { axisMin, axisMax };
}

/**
 * Option ECharts radar. splitLine/splitArea đa giác bị TẮT (lưới vuông vẽ riêng
 * bằng graphic overlay), chỉ giữ nan hoa (axisLine) + nhãn mã. axisLabel số tắt
 * vì nhãn thang do lưới vuông tự vẽ.
 */
export function buildRadarOption(payload) {
  const symbols = payload?.symbols ?? [];
  const series = payload?.series ?? {};
  const { axisMin, axisMax } = computeAxisBounds(payload);

  return {
    color: SERIES_META.map((m) => m.color),
    title: {
      text: "CÁC MÃ ĐANG CÓ SÓNG TĂNG T+",
      left: "center",
      top: 8,
      textStyle: { fontSize: 20, color: "#222", fontWeight: "bold" },
    },
    legend: {
      data: SERIES_META.map((m) => m.name),
      top: 42,
      itemWidth: 28,
      itemHeight: 10,
      itemGap: 18,
      textStyle: { fontSize: 11, color: "#555" },
    },
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const values = Array.isArray(p.value) ? p.value : [];
        const rows = symbols
          .map((s, i) => `${s}: ${fmtPct(values[i] ?? 0)}`)
          .join("<br/>");
        return `<b>${p.name}</b><br/>${rows}`;
      },
    },
    radar: {
      shape: "polygon",
      radius: `${RADAR_RADIUS_RATIO * 100}%`,
      center: [`${CENTER_X_RATIO * 100}%`, `${CENTER_Y_RATIO * 100}%`],
      indicator: symbols.map((s) => ({ name: s, max: axisMax, min: axisMin })),
      axisName: { fontSize: 10, color: "#666" },
      axisLine: { show: true, lineStyle: { color: "#d9d9d9" } }, // nan hoa
      splitLine: { show: false }, // lưới đa giác tắt — thay bằng hình vuông overlay
      splitArea: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: "radar",
        z: 10, // vẽ trên lưới vuông (graphic z:0)
        data: SERIES_META.map((m) => ({
          name: m.name,
          value: series[m.key] ?? [],
          symbolSize: 5,
          lineStyle: { color: m.color, width: 2 },
          itemStyle: { color: m.color },
          areaStyle: { color: m.color, opacity: 0 },
        })),
      },
    ],
  };
}

/**
 * Các hình vuông đồng tâm + nhãn thang, dạng graphic elements (pixel tuyệt đối).
 * Cần width/height thật của chart → gọi lại mỗi lần resize. Căn theo cùng tâm và
 * bán kính với radar nên trùng khít; nan hoa radar cắt qua các cạnh vuông giống mẫu.
 */
export function buildSquareGridGraphic(width, height, bounds, splitNumber = GRID_SPLIT_NUMBER) {
  if (!width || !height) return [];
  const { axisMin = 0, axisMax = 1 } = bounds ?? {};
  const cx = width * CENTER_X_RATIO;
  const cy = height * CENTER_Y_RATIO;
  const R = (Math.min(width, height) / 2) * RADAR_RADIUS_RATIO;

  const els = [];
  for (let i = 1; i <= splitNumber; i++) {
    const half = (R * i) / splitNumber;
    els.push({
      type: "rect",
      z: 0,
      silent: true,
      shape: { x: cx - half, y: cy - half, width: half * 2, height: half * 2 },
      style: {
        fill: "transparent",
        stroke: "#e0e0e0",
        lineWidth: 1,
      },
    });
    const value = axisMin + ((axisMax - axisMin) * i) / splitNumber;
    els.push({
      type: "text",
      z: 1,
      silent: true,
      x: cx,
      y: cy - half,
      style: {
        text: `${Math.round(value)}`,
        fill: "#444",
        fontSize: 10,
        align: "center",
        verticalAlign: "bottom",
      },
    });
  }
  return els;
}
