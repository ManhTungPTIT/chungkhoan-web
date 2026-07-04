// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";
import { wilderRsiSeries } from "../untils/wilderRsi";

// Đăng ký ĐÈ chỉ báo RSI built-in của klinecharts: built-in tính RSI kiểu
// trung bình đơn (Cutler) với 3 chu kỳ [6,12,24]; bản này theo mẫu TradingView:
// MỘT đường RSI Wilder chu kỳ 14 + ba ngưỡng 30/50/70 kẻ đứt + nền tím nhạt
// giữa vùng 30–70.
const DEFAULT_RSI_PERIOD = 14;
const RSI_LINE_COLOR = "#7E57C2";
const LEVEL_LINE_COLOR_70 = "#2acf40";
const LEVEL_LINE_COLOR_30 = "red";
const BAND_FILL_COLOR = "rgba(126, 87, 194, 0.08)";
// Vùng quá mua (RSI > 70) tô xanh, quá bán (RSI < 30) tô đỏ — cùng tông với
// màu hai đường ngưỡng.
const OVERBOUGHT_FILL_COLOR = "rgba(42, 207, 64, 0.6)";
const OVERSOLD_FILL_COLOR = "rgba(255, 82, 82, 0.6)";

function normalizeRsiPeriod(params) {
  const period = Number(params?.[0]);
  return Number.isFinite(period) && period > 0 ? period : DEFAULT_RSI_PERIOD;
}

// Calc thuần — export riêng để unit test không cần chart/DOM.
// Ngưỡng 30/50/70 có ở MỌI nến (kể cả vùng warm-up chưa đủ RSI) để đường
// tham chiếu và nền kẻ suốt chiều ngang như mẫu.
export function calcRSIValues(dataList, params = [DEFAULT_RSI_PERIOD]) {
  const rsi = wilderRsiSeries(dataList, normalizeRsiPeriod(params));
  return dataList.map((_, i) => ({
    level70: 70,
    level50: 50,
    level30: 30,
    ...(rsi[i] == null ? {} : { rsi: rsi[i] }),
  }));
}

// Ngưỡng kẻ đứt — style callback ở figure luôn thắng styles.lines người dùng,
// nên đổi màu đường RSI trong cài đặt không làm mất nét đứt của ngưỡng.
const levelStyle = (color) => () => ({
  style: "dashed",
  smooth: false,
  size: 1,
  dashedValue: [4, 4],
  color,
});

registerIndicator({
  name: "RSI",
  shortName: "RSI",
  precision: 2,
  calcParams: [DEFAULT_RSI_PERIOD],
  // Ngưỡng đứng trước để vẽ dưới, đường RSI vẽ sau đè lên trên.
  figures: [
    {
      key: "level70",
      title: "70: ",
      type: "line",
      styles: levelStyle(LEVEL_LINE_COLOR_70),
    },
    {
      key: "level50",
      title: "50: ",
      type: "line",
      styles: levelStyle("rgba(120, 123, 134, 0.5)"),
    },
    {
      key: "level30",
      title: "30: ",
      type: "line",
      styles: levelStyle(LEVEL_LINE_COLOR_30),
    },
    { key: "rsi", title: "RSI: ", type: "line" },
  ],
  // styles.lines THAY THẾ toàn bộ default (không merge sâu) — phải đủ
  // style/smooth/size/dashedValue, thiếu dashedValue sẽ crash khi zoom.
  styles: {
    lines: [
      {
        style: "solid",
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: RSI_LINE_COLOR,
      },
    ],
  },
  calc: (dataList, { calcParams }) => calcRSIValues(dataList, calcParams),
  // Vẽ nền + vùng quá mua/quá bán; chạy TRƯỚC các figure nên đường RSI và
  // ngưỡng luôn đè lên trên; return false để thư viện vẫn vẽ 4 đường figure.
  draw: drawRsiBackground,
});

export function drawRsiBackground({
  ctx,
  bounding,
  yAxis,
  xAxis,
  visibleRange,
  indicator,
}) {
  const result = indicator.result ?? [];
  if (!result.length) return false;
  try {
    const y70 = yAxis.convertToPixel(70);
    const y30 = yAxis.convertToPixel(30);

    // Gom đường RSI trong vùng nhìn thấy thành các đoạn liên tục
    // (ngắt đoạn tại nến thiếu RSI — vùng warm-up).
    const from = Math.max(0, visibleRange.realFrom ?? visibleRange.from);
    const to = Math.min(
      result.length,
      visibleRange.realTo ?? visibleRange.to,
    );
    const segments = [];
    let points = [];
    for (let i = from; i < to; i++) {
      const rsi = result[i]?.rsi;
      if (rsi == null) {
        if (points.length > 1) segments.push(points);
        points = [];
        continue;
      }
      points.push({
        x: xAxis.convertToPixel(i),
        y: yAxis.convertToPixel(rsi),
      });
    }
    if (points.length > 1) segments.push(points);

    // Tô đa giác giữa đường RSI và ngưỡng, CLIP trong nửa mặt phẳng tương
    // ứng: phần đường nằm ngoài nửa đó bị cắt bỏ nên chỉ đúng vùng vượt
    // ngưỡng được tô (điểm cắt ngưỡng tự khớp, không cần nội suy).
    const fillBeyondLevel = (clipTop, clipHeight, levelY, color) => {
      if (clipHeight <= 0 || segments.length === 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, clipTop, bounding.width, clipHeight);
      ctx.clip();
      ctx.fillStyle = color;
      segments.forEach((seg) => {
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].y);
        for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k].x, seg[k].y);
        ctx.lineTo(seg[seg.length - 1].x, levelY);
        ctx.lineTo(seg[0].x, levelY);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    };
    fillBeyondLevel(0, y70, y70, OVERBOUGHT_FILL_COLOR); // trên ngưỡng 70
    fillBeyondLevel(y30, bounding.height - y30, y30, OVERSOLD_FILL_COLOR); // dưới 30

    // Nền tím nhạt giữa hai ngưỡng 30–70; destination-over đặt sau tất cả.
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = BAND_FILL_COLOR;
    ctx.fillRect(0, Math.min(y70, y30), bounding.width, Math.abs(y30 - y70));
    ctx.restore();
  } catch {
    // Trục chưa sẵn sàng → bỏ qua phần tô, các đường vẫn vẽ bình thường.
  }
  return false;
}
