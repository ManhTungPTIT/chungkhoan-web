// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";

const CLOUD_ALPHA = 0.2; // độ trong của mây (color picker chỉ cho hex, alpha cố định)
const CLOUD_UP = "rgba(38,166,154,0.20)"; // Senkou A ≥ B → mây xanh (mặc định)
const CLOUD_DOWN = "rgba(239,83,80,0.20)"; // Senkou A < B → mây đỏ (mặc định)

// Hex #rrggbb → rgba(...) với alpha cho mây. Hex sai → null để dùng màu mặc định.
function hexToRgba(hex, alpha) {
  if (!/^#[0-9a-f]{6}$/i.test(String(hex))) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// (HH + LL) / 2 trên cửa sổ `period` nến kết thúc tại i. Dùng high/low, fallback
// close (tương thích dữ liệu thiếu high/low như các test khác trong repo).
function midpoint(dataList, i, period) {
  if (i < period - 1) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (let j = i - period + 1; j <= i; j++) {
    const c = dataList[j];
    hi = Math.max(hi, c.high ?? c.close);
    lo = Math.min(lo, c.low ?? c.close);
  }
  return (hi + lo) / 2;
}

// Calc thuần — export riêng để unit test không cần chart/DOM. Trả mảng thẳng
// hàng dataList; mỗi phần tử chỉ chứa key đã đủ dữ liệu:
//   tenkan, kijun (không dịch), spanA/spanB (dịch tiến +lead), chikou (dịch lùi +lag).
// params: [Tenkan, Kijun, SpanB, lag (Lagging Span/Chikou), lead (dịch mây tiến)].
// Tương thích cấu hình cũ 4 tham số: thiếu 'lead' thì dùng chung 'lag'.
export function calcIchimoku(dataList, params = [9, 26, 52, 26, 26]) {
  const [tenkanP, kijunP, spanBP, lag, lead] = params;
  const leadShift = lead ?? lag;
  const n = dataList.length;

  const tenkanRaw = new Array(n);
  const kijunRaw = new Array(n);
  const spanARaw = new Array(n);
  const spanBRaw = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = midpoint(dataList, i, tenkanP);
    const k = midpoint(dataList, i, kijunP);
    tenkanRaw[i] = t;
    kijunRaw[i] = k;
    spanARaw[i] = t != null && k != null ? (t + k) / 2 : null;
    spanBRaw[i] = midpoint(dataList, i, spanBP);
  }

  return dataList.map((_, i) => {
    const out = {};
    if (tenkanRaw[i] != null) out.tenkan = tenkanRaw[i];
    if (kijunRaw[i] != null) out.kijun = kijunRaw[i];
    if (i - leadShift >= 0) {
      if (spanARaw[i - leadShift] != null) out.spanA = spanARaw[i - leadShift];
      if (spanBRaw[i - leadShift] != null) out.spanB = spanBRaw[i - leadShift];
    }
    if (i + lag < n) out.chikou = dataList[i + lag].close;
    return out;
  });
}

const lineStyle = (color) => ({
  style: "solid",
  smooth: false,
  size: 1,
  dashedValue: [2, 2],
  color,
});

registerIndicator({
  name: "ICHIMOKU",
  shortName: "Ichimoku",
  precision: 2,
  calcParams: [9, 26, 52, 26, 26],
  figures: [
    { key: "tenkan", title: "Tenkan: ", type: "line" },
    { key: "kijun", title: "Kijun: ", type: "line" },
    { key: "spanA", title: "SpanA: ", type: "line" },
    { key: "spanB", title: "SpanB: ", type: "line" },
    { key: "chikou", title: "Chikou: ", type: "line" },
  ],
  // styles.lines THAY THẾ toàn bộ default (không merge sâu) — phải đủ
  // style/smooth/size/dashedValue, thiếu dashedValue sẽ crash khi zoom.
  styles: {
    lines: [
      lineStyle("#2962FF"), // Tenkan — xanh dương
      lineStyle("#B71C1C"), // Kijun — đỏ
      lineStyle("#26A69A"), // Senkou A — xanh lá
      lineStyle("#EF5350"), // Senkou B — đỏ nhạt
      lineStyle("#9C27B0"), // Chikou — tím
    ],
  },
  calc: (dataList, { calcParams }) => calcIchimoku(dataList, calcParams),
  // Tô mây Kumo giữa Senkou A & B, chia màu theo dấu (A≥B xanh / A<B đỏ).
  // destination-over đặt mây sau nến; return false để thư viện vẽ 5 đường đè lên.
  draw: ({ ctx, indicator, visibleRange, xAxis, yAxis }) => {
    // Màu nền (mây) lấy từ config truyền qua extendData; thiếu → màu mặc định.
    const cloud = indicator.extendData?.cloud;
    if (cloud?.visible === false) return false; // ẩn mây, vẫn để thư viện vẽ 5 đường
    const cloudUp = hexToRgba(cloud?.colors?.[0], CLOUD_ALPHA) ?? CLOUD_UP;
    const cloudDown = hexToRgba(cloud?.colors?.[1], CLOUD_ALPHA) ?? CLOUD_DOWN;

    const result = indicator.result;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";

    let seg = [];
    let segColor = null;
    const flush = () => {
      if (seg.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].yA);
        for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k].x, seg[k].yA);
        for (let k = seg.length - 1; k >= 0; k--) ctx.lineTo(seg[k].x, seg[k].yB);
        ctx.closePath();
        ctx.fillStyle = segColor;
        ctx.fill();
      }
      seg = [];
    };

    const from = Math.max(0, visibleRange.realFrom ?? visibleRange.from);
    const to = Math.min(result.length, visibleRange.realTo ?? visibleRange.to);
    for (let i = from; i < to; i++) {
      const data = result[i];
      if (!data || data.spanA == null || data.spanB == null) {
        flush();
        segColor = null;
        continue;
      }
      const color = data.spanA >= data.spanB ? cloudUp : cloudDown;
      const point = {
        x: xAxis.convertToPixel(i),
        yA: yAxis.convertToPixel(data.spanA),
        yB: yAxis.convertToPixel(data.spanB),
      };
      if (segColor !== null && color !== segColor) {
        seg.push(point); // điểm nối: khép đoạn cũ tại nến chuyển màu
        flush();
      }
      segColor = color;
      seg.push(point);
    }
    flush();

    ctx.restore();
    return false;
  },
});
