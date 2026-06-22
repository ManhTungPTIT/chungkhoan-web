// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";

const CLOUD_UP = "rgba(38,166,154,0.20)"; // Senkou A ≥ B → mây xanh
const CLOUD_DOWN = "rgba(239,83,80,0.20)"; // Senkou A < B → mây đỏ

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
//   tenkan, kijun (không dịch), spanA/spanB (dịch +disp tới), chikou (dịch −disp lùi).
export function calcIchimoku(dataList, params = [9, 26, 52, 26]) {
  const [tenkanP, kijunP, spanBP, disp] = params;
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
    if (i - disp >= 0) {
      if (spanARaw[i - disp] != null) out.spanA = spanARaw[i - disp];
      if (spanBRaw[i - disp] != null) out.spanB = spanBRaw[i - disp];
    }
    if (i + disp < n) out.chikou = dataList[i + disp].close;
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
  calcParams: [9, 26, 52, 26],
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
      const color = data.spanA >= data.spanB ? CLOUD_UP : CLOUD_DOWN;
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
