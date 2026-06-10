// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";
import { calcRSI, emaOf } from "../untils/indicators";

/**
 * MCDX (Banker Fund) — thang cố định 0–20, cột luôn đầy tới 20:
 *   retail : nền xanh lá cố định 20 (lớp dưới cùng)
 *   hot    : RSI(hotPeriod) quy về 0–20 — cột vàng, đè lên nền
 *   banker : RSI(bankerPeriod) quy về 0–20 — cột đỏ trên cùng,
 *            chuyển CAM khi giảm so với nến trước
 *   shark  : EMA(sharkPeriod) của banker — đường "Cá Mập" xanh dương
 * Mỗi RSI chỉ tính phần vượt trên 50: (rsi - 50) / 50 * 20, kẹp 0–20.
 */
// Calc thuần — export riêng để unit test không cần chart/DOM.
export function calcMCDXValues(
  dataList,
  bankerPeriod = 50,
  hotPeriod = 40,
  sharkPeriod = 10,
) {
  const start = Math.max(bankerPeriod, hotPeriod);
  const result = dataList.map(() => ({}));
  if (dataList.length <= start) return result;

  const scale = (rsi) => Math.min(20, Math.max(0, ((rsi - 50) / 50) * 20));
  const bankerRSI = calcRSI(dataList, bankerPeriod);
  const hotRSI = calcRSI(dataList, hotPeriod);

  const bankerValues = [];
  for (let i = start; i < dataList.length; i++) {
    const banker = scale(bankerRSI[i - bankerPeriod].value);
    result[i] = {
      retail: 20,
      hot: scale(hotRSI[i - hotPeriod].value),
      banker,
    };
    bankerValues.push(banker);
  }

  emaOf(bankerValues, sharkPeriod).forEach((value, j) => {
    result[start + sharkPeriod - 1 + j].shark = value;
  });

  return result;
}

registerIndicator({
  name: "MCDX",
  shortName: "MCDX",
  precision: 2,
  calcParams: [50, 40, 10],
  minValue: 0,
  maxValue: 20,
  figures: [
    {
      key: "retail",
      title: "Retail: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#43A047" }),
    },
    {
      key: "hot",
      title: "Hot: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#FDD835" }),
    },
    {
      key: "banker",
      title: "Banker: ",
      type: "bar",
      baseValue: 0,
      // đỏ khi tăng/đi ngang, cam khi giảm so với nến trước (khớp bản cũ)
      styles: ({ prev, current }) => ({
        color:
          prev.indicatorData?.banker != null &&
          current.indicatorData.banker < prev.indicatorData.banker
            ? "#FB8C00"
            : "#E53935",
      }),
    },
    {
      key: "shark",
      title: "Shark: ",
      type: "line",
      styles: () => ({ color: "#1E88E5", size: 2 }),
    },
  ],
  calc: (dataList, { calcParams }) =>
    calcMCDXValues(dataList, calcParams[0], calcParams[1], calcParams[2]),
});
