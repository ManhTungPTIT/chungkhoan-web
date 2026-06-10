// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { calcMCDXValues } from "../mcdxIndicator";
import { calcRSI, emaOf } from "../../untils/indicators";

// 80 nến deterministic, đủ vượt start=50 và shark (59)
const candles = Array.from({ length: 80 }, (_, i) => ({
  time: 1700000000 + i * 60,
  close: 100 + 10 * Math.sin(i / 5) + (i % 7),
}));

// Reference: copy verbatim từ calcMCDX cũ (untils/indicators.js trước migration)
function legacyMCDX(candles, bankerPeriod = 50, hotPeriod = 40, sharkPeriod = 10) {
  const start = Math.max(bankerPeriod, hotPeriod);
  if (candles.length <= start)
    return { banker: [], hotMoney: [], retail: [], sharkLine: [] };

  const scale = (rsi) => Math.min(20, Math.max(0, ((rsi - 50) / 50) * 20));
  const bankerRSI = calcRSI(candles, bankerPeriod);
  const hotRSI = calcRSI(candles, hotPeriod);

  const banker = [],
    hotMoney = [],
    retail = [],
    bankerValues = [];
  let prevB = -1;
  for (let i = start; i < candles.length; i++) {
    const b = scale(bankerRSI[i - bankerPeriod].value);
    const h = scale(hotRSI[i - hotPeriod].value);
    const time = candles[i].time;
    retail.push({ time, value: 20, color: "#43A047" });
    hotMoney.push({ time, value: h, color: "#FDD835" });
    banker.push({ time, value: b, color: b >= prevB ? "#E53935" : "#FB8C00" });
    bankerValues.push(b);
    prevB = b;
  }

  const sharkLine = emaOf(bankerValues, sharkPeriod).map((value, j) => ({
    time: candles[start + sharkPeriod - 1 + j].time,
    value,
  }));

  return { banker, hotMoney, retail, sharkLine };
}

describe("calcMCDXValues", () => {
  const out = calcMCDXValues(candles, 50, 40, 10);
  const legacy = legacyMCDX(candles, 50, 40, 10);

  it("thẳng hàng với dataList: {} cho 50 nến đầu", () => {
    expect(out).toHaveLength(80);
    expect(out[0]).toEqual({});
    expect(out[49]).toEqual({});
    expect(out[50].banker).toBeDefined();
  });

  it("banker/hot/retail khớp bản legacy", () => {
    for (let i = 50; i < 80; i++) {
      expect(out[i].retail).toBe(20);
      expect(out[i].banker).toBeCloseTo(legacy.banker[i - 50].value, 10);
      expect(out[i].hot).toBeCloseTo(legacy.hotMoney[i - 50].value, 10);
    }
  });

  it("đường Cá Mập bắt đầu từ nến 59 và khớp legacy", () => {
    expect(out[58].shark).toBeUndefined();
    legacy.sharkLine.forEach((s, j) => {
      expect(out[59 + j].shark).toBeCloseTo(s.value, 10);
    });
  });

  it("trả toàn {} khi không đủ dữ liệu", () => {
    const out2 = calcMCDXValues(candles.slice(0, 50), 50, 40, 10);
    expect(out2).toHaveLength(50);
    expect(out2.every((v) => Object.keys(v).length === 0)).toBe(true);
  });
});
