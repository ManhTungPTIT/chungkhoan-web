// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";

const NEUTRAL_FILL = "rgba(180,180,220,0.08)"; // trước signal đầu tiên
const BUY_FILL = "rgba(38,166,154,0.18)"; // từ signal MUA
const SELL_FILL = "rgba(239,83,80,0.18)"; // từ signal BÁN

// Calc thuần — export riêng để unit test không cần chart/DOM.
// Trả mảng thẳng hàng với dataList: {} khi chưa đủ period, ngược lại { upper, lower }.
export function calcBBValues(dataList, period = 20, multiplier = 2) {
  return dataList.map((_, i) => {
    if (i < period - 1) return {};
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += dataList[j].close;
    const avg = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++)
      variance += (dataList[j].close - avg) ** 2;
    const sd = Math.sqrt(variance / period);
    return { upper: avg + multiplier * sd, lower: avg - multiplier * sd };
  });
}

// Màu fill tại 1 nến = theo signal gần nhất tại-hoặc-trước nến đó
// (signals đã sort tăng theo time; time unix giây, timestamp ms)
function fillColorAt(timestamp, signals) {
  let color = NEUTRAL_FILL;
  for (const s of signals) {
    if (s.time * 1000 > timestamp) break;
    color = s.type === "buy" ? BUY_FILL : SELL_FILL;
  }
  return color;
}

registerIndicator({
  name: "BBS",
  shortName: "BOLL",
  precision: 2,
  calcParams: [20, 2],
  figures: [
    { key: "upper", title: "UP: ", type: "line" },
    { key: "lower", title: "DN: ", type: "line" },
  ],
  // styles.lines THAY THẾ toàn bộ default (không merge sâu) — phải đủ
  // style/smooth/size/dashedValue, thiếu dashedValue sẽ crash khi zoom
  styles: {
    lines: [
      {
        style: "solid",
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: "rgba(255,255,255,0.7)",
      },
      {
        style: "solid",
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: "rgba(255,255,255,0.7)",
      },
    ],
  },
  calc: (dataList, { calcParams }) =>
    calcBBValues(dataList, calcParams[0], calcParams[1]),
  // Vẽ fill giữa 2 band, chia màu theo đoạn tín hiệu.
  // return false để thư viện vẽ tiếp 2 đường band (figures) đè lên fill.
  draw: ({ ctx, kLineDataList, indicator, visibleRange, xAxis, yAxis }) => {
    const signals = [...(indicator.extendData ?? [])].sort(
      (a, b) => a.time - b.time,
    );
    const result = indicator.result;

    // Gom các nến visible liên tiếp cùng màu thành 1 polygon
    let seg = [];
    let segColor = null;
    const flush = () => {
      if (seg.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].yUp);
        for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k].x, seg[k].yUp);
        for (let k = seg.length - 1; k >= 0; k--)
          ctx.lineTo(seg[k].x, seg[k].yLow);
        ctx.closePath();
        ctx.fillStyle = segColor;
        ctx.fill();
      }
      seg = [];
    };

    // Dùng realFrom/realTo (kẹp biên) để fill phủ cả nến chỉ hiển thị một phần ở mép,
    // khớp với phạm vi thư viện vẽ 2 đường band
    const from = Math.max(0, visibleRange.realFrom ?? visibleRange.from);
    const to = Math.min(result.length, visibleRange.realTo ?? visibleRange.to);
    for (let i = from; i < to; i++) {
      const data = result[i];
      const kline = kLineDataList[i];
      if (!data || data.upper == null || !kline) {
        flush();
        segColor = null;
        continue;
      }
      const color = fillColorAt(kline.timestamp, signals);
      const point = {
        x: xAxis.convertToPixel(i),
        yUp: yAxis.convertToPixel(data.upper),
        yLow: yAxis.convertToPixel(data.lower),
      };
      if (segColor !== null && color !== segColor) {
        seg.push(point); // điểm nối: khép đoạn cũ ngay tại nến chuyển màu
        flush();
      }
      segColor = color;
      seg.push(point);
    }
    flush();

    return false;
  },
});
