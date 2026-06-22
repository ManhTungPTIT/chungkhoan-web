// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";
import { emaOf } from "../untils/indicators";

const RSV_SMOOTH = 3; // làm mượt RSV như MCDX gốc

/**
 * RSV (Stochastic) — vị trí của close trong biên độ [LLV, HHV] của `period`
 * nến gần nhất, quy về 0–100. Trả mảng thẳng hàng dataList; null khi chưa đủ
 * nến. Dùng high/low nếu có, không thì fallback về close (tương thích test).
 */
function rsvSeries(dataList, period) {
  const out = new Array(dataList.length).fill(null);
  for (let i = period - 1; i < dataList.length; i++) {
    let hi = -Infinity,
      lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      const c = dataList[j];
      hi = Math.max(hi, c.high ?? c.close);
      lo = Math.min(lo, c.low ?? c.close);
    }
    const close = dataList[i].close;
    out[i] = hi === lo ? 50 : ((close - lo) / (hi - lo)) * 100;
  }
  return out;
}

// SMA giữ nguyên alignment — null cho tới khi đủ `p` phần tử liên tiếp.
function smooth(arr, p) {
  const out = new Array(arr.length).fill(null);
  for (let i = p - 1; i < arr.length; i++) {
    if (arr[i - p + 1] == null) continue;
    let s = 0;
    for (let j = i - p + 1; j <= i; j++) s += arr[j];
    out[i] = s / p;
  }
  return out;
}

/**
 * MCDX (Banker Fund) — thang cố định 0–20:
 *   retail : nền xanh lá cố định 20 (lớp dưới cùng)
 *   hot    : RSV(hotPeriod) — chu kỳ ngắn, cột vàng "núi" nhô lên trên
 *   banker : RSV(bankerPeriod) — chu kỳ dài, cột đỏ làm nền (đè trên vàng),
 *            chuyển CAM khi giảm so với nến trước
 *   shark  : EMA(sharkPeriod) của banker — đường "Cá Mập" xanh dương
 * Mỗi RSV làm mượt SMA(3) rồi quy về 0–20: value / 100 * 20, kẹp 0–20.
 * Dùng RSV (chuẩn hoá theo biên độ) thay vì RSI để cột trải đủ thang như mẫu.
 */
// Calc thuần — export riêng để unit test không cần chart/DOM.
export function calcMCDXValues(
  dataList,
  bankerPeriod = 50,
  hotPeriod = 21,
  sharkPeriod = 10,
) {
  const result = dataList.map(() => ({}));
  const scale = (v) => Math.min(20, Math.max(0, (v / 100) * 20));
  const hot = smooth(rsvSeries(dataList, hotPeriod), RSV_SMOOTH);
  const banker = smooth(rsvSeries(dataList, bankerPeriod), RSV_SMOOTH);

  const bankerValues = [];
  let firstIdx = -1;
  for (let i = 0; i < dataList.length; i++) {
    if (hot[i] == null || banker[i] == null) continue;
    const b = scale(banker[i]);
    result[i] = { retail: 20, hot: scale(hot[i]), banker: b };
    if (firstIdx === -1) firstIdx = i;
    bankerValues.push(b);
  }
  if (firstIdx === -1) return result;

  emaOf(bankerValues, sharkPeriod).forEach((value, j) => {
    result[firstIdx + sharkPeriod - 1 + j].shark = value;
  });

  return result;
}

registerIndicator({
  name: "MCDX",
  shortName: "MCDX",
  precision: 2,
  calcParams: [50, 21, 10],
  minValue: 0,
  maxValue: 20,
  figures: [
    {
      key: "retail",
      title: "Retail: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#19ff19" }),
    },
    {
      key: "hot",
      title: "Hot: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#e8ff02" }),
    },
    {
      key: "banker",
      title: "Banker: ",
      type: "bar",
      baseValue: 0,
      // đỏ khi tăng/đi ngang, cam khi giảm so với nến trước (khớp bản cũ)
      // current.indicatorData cũng có thể undefined khi dataList rỗng
      styles: ({ prev, current }) => ({
        color:
          prev.indicatorData?.banker != null &&
          current.indicatorData?.banker != null &&
          current.indicatorData.banker < prev.indicatorData.banker
            ? "#fd8c73"
            : "#ff0000",
      }),
    },
    {
      key: "shark",
      title: "Shark: ",
      type: "line",
      styles: () => ({ color: "#7E57C2", size: 2 }),
    },
  ],
  calc: (dataList, { calcParams }) =>
    calcMCDXValues(dataList, calcParams[0], calcParams[1], calcParams[2]),
});
