// Bảng màu vùng theo THỨ TỰ cửa sổ tăng dần (T+ nhỏ → lớn). 3 màu đầu khớp mẫu:
// T+ nhỏ nhất vàng, giữa xanh lá, lớn nhất tím; thêm màu cho trường hợp >3 cửa sổ.
export const ZONE_COLORS = [ "#F2B600", "#1E8B3B", "#7B1FA2", "#1565C0", "#D81B60", "#00838F"];

/** Meta series cho danh sách cửa sổ (sort tăng dần), gán màu theo thứ tự. */
export function metaForWindows(windows) {
  const sorted = [...new Set((windows ?? []).map(Number).filter((n) => n > 0))].sort(
    (a, b) => a - b,
  );
  return sorted.map((w, i) => ({
    key: `t${w}`,
    window: w,
    name: `Tăng cao nhất T+${w}`,
    color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));
}

// Meta mặc định (T+2/T+3/T+5) — dùng khi payload chưa nói rõ windows.
export const SERIES_META = metaForWindows([2, 3, 5]);

/** Suy ra danh sách cửa sổ (tăng dần) từ payload: ưu tiên payload.windows, rồi
 * key của zones/series (dạng 't<n>'); rỗng → [2,3,5]. */
export function windowsFromPayload(payload) {
  if (Array.isArray(payload?.windows) && payload.windows.length) {
    return [...payload.windows].map(Number).sort((a, b) => a - b);
  }
  const keys = Object.keys(payload?.zones ?? payload?.series ?? {});
  const ws = keys
    .map((k) => Number(String(k).replace(/^t/, "")))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  return ws.length ? ws : [2, 3, 5];
}

const metaOf = (payload) => metaForWindows(windowsFromPayload(payload));

// Tâm + bán kính radar. Dùng CHUNG cho cả radar và lưới vuông overlay để trùng khít.
export const CENTER_X_RATIO = 0.5;
export const CENTER_Y_RATIO = 0.56;
export const RADAR_RADIUS_RATIO = 0.78;
export const GRID_SPLIT_NUMBER = 8; // số hình vuông đồng tâm

const fmtPct = (v) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;

/**
 * Ghép payload `zones` (mỗi cửa sổ T+ có top mã RIÊNG) thành 1 bộ trục radar
 * chia vùng góc: symbols nối theo THỨ TỰ VÙNG (cửa sổ LỚN → NHỎ, để cửa sổ lớn
 * nằm trên-trái như mẫu); mỗi series chỉ mang giá trị tại các trục THUỘC VÙNG
 * mình (ngoài vùng = 0); axisColors tô nhãn mã theo màu vùng. Không có zones
 * (BE cũ) → null để caller fallback shape cũ.
 */
export function buildZonedPayload(payload) {
  const zones = payload?.zones;
  if (!zones) return null;

  const meta = metaForWindows(windowsFromPayload(payload));
  const colorOf = Object.fromEntries(meta.map((m) => [m.key, m.color]));
  const zoneOrder = [...meta].reverse(); // cửa sổ lớn trước (trên-trái)

  const symbols = [];
  const axisColors = [];
  const spans = [];
  for (const m of zoneOrder) {
    const zoneSymbols = zones[m.key]?.symbols ?? [];
    spans.push({ key: m.key, start: symbols.length });
    symbols.push(...zoneSymbols);
    axisColors.push(...zoneSymbols.map(() => colorOf[m.key]));
  }

  const series = {};
  for (const m of meta) series[m.key] = symbols.map(() => 0);
  for (const { key, start } of spans) {
    (zones[key]?.values ?? []).forEach((v, i) => {
      series[key][start + i] = v;
    });
  }

  return { symbols, series, axisColors, windows: meta.map((m) => m.window) };
}

/**
 * Thang trục dùng CHUNG cho mọi mã. min hạ dưới 0 nếu có mã tăng âm; max làm
 * tròn lên bội 10 (hoặc 100 khi lớn).
 */
export function computeAxisBounds(payload) {
  const series = payload?.series ?? {};
  const meta = metaOf(payload);
  const all = meta.flatMap((m) => series[m.key] ?? []);
  const dataMax = all.length ? Math.max(...all) : 1;
  const dataMin = all.length ? Math.min(...all) : 0;
  const step = dataMax > 100 ? 100 : 10;
  const axisMax = Math.max(step, Math.ceil(dataMax / step) * step);
  const axisMin = dataMin < 0 ? Math.floor(dataMin / step) * step : 0;
  return { axisMin, axisMax };
}

/**
 * Option ECharts radar. splitLine/splitArea đa giác TẮT (lưới vuông vẽ riêng),
 * chỉ giữ nan hoa + nhãn mã. Đường polygon nối vòng bị ẩn — giá trị thể hiện
 * bằng TIA MÀU (buildSeriesRayGraphic). Nhãn mã tô màu vùng qua axisColors.
 */
export function buildRadarOption(payload) {
  const symbols = payload?.symbols ?? [];
  const series = payload?.series ?? {};
  const axisColors = payload?.axisColors ?? [];
  const meta = metaOf(payload);
  const { axisMin, axisMax } = computeAxisBounds(payload);

  return {
    color: meta.map((m) => m.color),
    title: {
      text: "CÁC MÃ ĐANG CÓ SÓNG TĂNG T+",
      left: "center",
      top: 8,
      textStyle: { fontSize: 20, color: "#222", fontWeight: "bold" },
    },
    legend: {
      data: meta.map((m) => m.name),
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
          .map((s, i) => ({ s, v: values[i] ?? 0 }))
          .filter(({ v }) => v > 0)
          .map(({ s, v }) => `${s}: ${fmtPct(v)}`)
          .join("<br/>");
        return `<b>${p.name}</b><br/>${rows}`;
      },
    },
    radar: {
      shape: "polygon",
      radius: `${RADAR_RADIUS_RATIO * 100}%`,
      center: [`${CENTER_X_RATIO * 100}%`, `${CENTER_Y_RATIO * 100}%`],
      indicator: symbols.map((s, i) => ({
        name: s,
        max: axisMax,
        min: axisMin,
        ...(axisColors[i] ? { color: axisColors[i] } : {}),
      })),
      axisName: { fontSize: 10, color: "#666" },
      axisLine: { show: true, lineStyle: { color: "#b0b0b0", width: 1 } }, // nan hoa
      splitLine: { show: false },
      splitArea: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: "radar",
        z: 10,
        data: meta.map((m) => ({
          name: m.name,
          value: series[m.key] ?? [],
          symbolSize: 5,
          lineStyle: { color: m.color, width: 2, opacity: 0 }, // ẩn polygon nối vòng
          itemStyle: { color: m.color },
          areaStyle: { color: m.color, opacity: 0 },
        })),
      },
    ],
  };
}

/**
 * Các hình vuông đồng tâm + nhãn thang, dạng graphic elements (pixel tuyệt đối).
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
      style: { fill: "transparent", stroke: "#e0e0e0", lineWidth: 1 },
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

/**
 * Tia màu theo series: đường thẳng từ TÂM tới điểm giá trị trên trục của từng
 * mã. Góc trục TRÙNG công thức echarts radar (clockwise=false, startAngle=90):
 * góc_i = 90° + i·360°/n; điểm = (cx + r·cosθ, cy − r·sinθ). Giá trị 0/null → bỏ.
 */
export function buildSeriesRayGraphic(width, height, bounds, payload) {
  if (!width || !height) return [];
  const { axisMin = 0, axisMax = 1 } = bounds ?? {};
  const span = axisMax - axisMin;
  if (span <= 0) return [];
  const symbols = payload?.symbols ?? [];
  const series = payload?.series ?? {};
  const meta = metaOf(payload);
  const n = symbols.length;
  if (!n) return [];

  const cx = width * CENTER_X_RATIO;
  const cy = height * CENTER_Y_RATIO;
  const R = (Math.min(width, height) / 2) * RADAR_RADIUS_RATIO;

  const els = [];
  for (const m of meta) {
    const values = series[m.key] ?? [];
    for (let i = 0; i < n; i++) {
      const v = Number(values[i]);
      if (!Number.isFinite(v) || v <= 0) continue;
      const r = (R * (v - axisMin)) / span;
      const angle = (Math.PI / 180) * (90 + (i * 360) / n);
      els.push({
        type: "line",
        z: 5,
        silent: true,
        shape: { x1: cx, y1: cy, x2: cx + r * Math.cos(angle), y2: cy - r * Math.sin(angle) },
        style: { stroke: m.color, lineWidth: 2 },
      });
    }
  }
  return els;
}
