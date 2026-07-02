// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";
import { wilderRsiSeries } from "../untils/wilderRsi";

// [bankerPeriod, bankerBase, bankerFactor, hotPeriod, hotBase, hotFactor,
//  retailPeriod, retailBase] — bộ tham số MCDX chuẩn (Banker Fund).
const DEFAULT_MCDX_PARAMS = [50, 50, 1.5, 40, 30, 0.7, 20, 10];
const SHARK_SMA_PERIOD = 10;

// SMA có warm-up: chưa đủ `period` giá trị thì lấy trung bình phần đã có,
// để đường Shark hiện cùng lúc với cột banker thay vì trễ thêm 10 nến.
function smaSeries(arr, period) {
  const out = new Array(arr.length).fill(null);
  const window = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    if (value == null) continue;
    window.push(value);
    sum += value;
    if (window.length > period) sum -= window.shift();
    out[i] = sum / window.length;
  }
  return out;
}

function normalizeMCDXParams(paramsOrBankerPeriod, hotPeriod, sharkPeriod) {
  if (Array.isArray(paramsOrBankerPeriod)) {
    const params = [...paramsOrBankerPeriod];
    if (params.length <= 3) {
      return [
        params[0] ?? DEFAULT_MCDX_PARAMS[0],
        DEFAULT_MCDX_PARAMS[1],
        DEFAULT_MCDX_PARAMS[2],
        params[1] ?? DEFAULT_MCDX_PARAMS[3],
        DEFAULT_MCDX_PARAMS[4],
        DEFAULT_MCDX_PARAMS[5],
        DEFAULT_MCDX_PARAMS[6],
        params[2] ?? DEFAULT_MCDX_PARAMS[7],
      ];
    }
    return DEFAULT_MCDX_PARAMS.map((fallback, index) => {
      const value = Number(params[index]);
      return Number.isFinite(value) && value > 0 ? value : fallback;
    });
  }

  return normalizeMCDXParams([
    paramsOrBankerPeriod,
    hotPeriod,
    sharkPeriod,
  ]);
}

/**
 * MCDX (Banker Fund) chuẩn — thang cố định 0–20, mỗi nhóm dòng tiền là
 * sức mạnh RSI vượt ngưỡng: clamp((RSI(period) − baseline) × sensitivity, 0, 20)
 *   banker : RSI(50), ngưỡng 50, hệ số 1.5 — cột đỏ, chỉ hiện khi RSI(50) > 50,
 *            chuyển CAM khi giảm so với nến trước
 *   hot    : RSI(40), ngưỡng 30, hệ số 0.7 — cột vàng vẽ chồng lên đỉnh cột đỏ
 *   retail : RSI(20), ngưỡng 10, hệ số 1  — nền xanh lá (gần như luôn kịch 20)
 *   shark  : SMA(banker, 10) — đường "Cá Mập" tím bám theo cụm cột đỏ
 */
// Calc thuần — export riêng để unit test không cần chart/DOM.
export function calcMCDXValues(
  dataList,
  paramsOrBankerPeriod = DEFAULT_MCDX_PARAMS,
  hotPeriod,
  sharkPeriod,
) {
  const result = dataList.map(() => ({}));
  const [
    bankerPeriod,
    bankerBase,
    bankerFactor,
    hotRsiPeriod,
    hotBase,
    hotFactor,
    retailPeriod,
    retailBase,
  ] = normalizeMCDXParams(paramsOrBankerPeriod, hotPeriod, sharkPeriod);
  const strength = (rsi, base, factor) =>
    rsi == null ? null : Math.min(20, Math.max(0, (rsi - base) * factor));
  const banker = wilderRsiSeries(dataList, bankerPeriod).map((rsi) =>
    strength(rsi, bankerBase, bankerFactor),
  );
  const hot = wilderRsiSeries(dataList, hotRsiPeriod).map((rsi) =>
    strength(rsi, hotBase, hotFactor),
  );
  const retail = wilderRsiSeries(dataList, retailPeriod).map((rsi) =>
    strength(rsi, retailBase, 1),
  );
  const shark = smaSeries(banker, SHARK_SMA_PERIOD);

  for (let i = 0; i < dataList.length; i++) {
    if (
      hot[i] == null ||
      banker[i] == null ||
      retail[i] == null ||
      shark[i] == null
    ) {
      continue;
    }
    result[i] = {
      retail: retail[i],
      hot: Math.min(20, banker[i] + hot[i]),
      hotRaw: hot[i],
      banker: banker[i],
      shark: shark[i],
      level5: 5,
      level10: 10,
      level15: 15,
    };
  }

  return result;
}

registerIndicator({
  name: "MCDX",
  shortName: "MCDX",
  precision: 2,
  calcParams: DEFAULT_MCDX_PARAMS,
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
    {
      key: "level5",
      title: "5: ",
      type: "line",
      styles: () => ({ color: "#111827", size: 1 }),
    },
    {
      key: "level10",
      title: "10: ",
      type: "line",
      styles: () => ({ color: "#111827", size: 1 }),
    },
    {
      key: "level15",
      title: "15: ",
      type: "line",
      styles: () => ({ color: "#111827", size: 1 }),
    },
  ],
  calc: (dataList, { calcParams }) =>
    calcMCDXValues(dataList, calcParams),
});
