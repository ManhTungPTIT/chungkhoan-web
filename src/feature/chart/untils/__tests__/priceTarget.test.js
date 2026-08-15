import { describe, it, expect } from "vitest";
import {
  calcSMA,
  calcNwTrend,
  generateSignals,
  generateSignalsT,
  generateSignalsLong,
} from "../indicators";

// Chuỗi phẳng → tăng tăng tốc: cả 3 bot đều vào lệnh rồi ở LONG tới nến cuối
// (không có pha giảm nên không có điểm bán). Đúng trạng thái ô "Chốt lãi / Cắt
// lỗ" đang hiển thị: vị thế còn mở, đường MA trên chart đã chạy tiếp nhiều phiên
// kể từ nến vào lệnh.
function risingCandles(length = 55) {
  const flat = Array(25).fill(100);
  const up = Array.from({ length: 30 }, (_, i) => 100 + (i + 1) * (i + 1) * 0.3);
  return [...flat, ...up].slice(0, length).map((close, i) => candleAt(i, close));
}

// Thêm pha giảm tăng tốc phía sau để cả 3 bot phát được điểm BÁN. Nến pha giảm
// là nến đỏ (open = close + 0.5) — BOT T+ đòi close < open khi bán.
function curvedCandles() {
  const rising = [...risingCandles()].map((c) => c.close);
  const peak = rising[rising.length - 1];
  const down = Array.from({ length: 25 }, (_, i) => peak - (i + 1) * (i + 1) * 0.5);
  return [...rising, ...down].map((close, i) =>
    i < 55 ? candleAt(i, close) : candleAt(i, close, close + 0.5),
  );
}

// Mặc định là nến xanh (open < close): BOT T+ đòi close > open khi mua.
function candleAt(i, close, open = close - 0.5) {
  return {
    time: 1735689600 + i * 86400,
    open,
    close,
    high: Math.max(open, close) + 5,
    low: Math.min(open, close) - 5,
  };
}

/**
 * MA của KLineCharts, chép nguyên thuật toán từ
 * node_modules/klinecharts/dist/index.esm.js (`movingAverage.calc`): tổng lăn
 * `close`, có giá trị từ nến thứ `p - 1` trở đi.
 *
 * Đây là ĐÚNG con số đường MA10/MA20 vẽ trên chart, nên test so `calcSMA` với
 * nó là so thẳng với thứ khách nhìn thấy.
 */
function klinechartsMA(candles, period) {
  let sum = 0;
  return candles.map((candle, i) => {
    sum += candle.close;
    if (i < period - 1) return undefined;
    const value = sum / period;
    sum -= candles[i - (period - 1)].close;
    return value;
  });
}

const BOTS = [
  ["generateSignals (Trend)", generateSignals, 20],
  ["generateSignalsT (T+)", generateSignalsT, 10],
];

describe("calcSMA khớp thuật toán MA của KLineCharts", () => {
  it.each([10, 20])("MA%i trùng từng nến một", (period) => {
    const candles = risingCandles();
    const ours = calcSMA(candles, period);
    const theirs = klinechartsMA(candles, period);

    // calcSMA bắt đầu tại nến period-1, khớp đúng chỗ KLineCharts bắt đầu có giá trị.
    expect(ours).toHaveLength(candles.length - period + 1);
    ours.forEach((point, j) => {
      const i = period - 1 + j;
      expect(point.time).toBe(candles[i].time);
      expect(point.value).toBeCloseTo(theirs[i], 10);
    });
  });
});

describe.each(BOTS)("%s — Chốt lãi / Cắt lỗ", (_name, generate, period) => {
  it.each([
    ["đang GIỮ HÀNG (tín hiệu cuối là mua)", risingCandles, "buy"],
    ["đang ĐỨNG NGOÀI (tín hiệu cuối là bán)", curvedCandles, "sell"],
  ])(
    `%s → = MA${period} tại NẾN MỚI NHẤT, trùng đường MA phiên hiện tại`,
    (_state, makeCandles, expectedType) => {
      const candles = makeCandles();
      const last = generate(candles).at(-1);

      expect(last.type).toBe(expectedType);
      expect(last.priceTarget).toBeCloseTo(
        klinechartsMA(candles, period).at(-1),
        10,
      );
    },
  );

  it("chạy theo từng phiên mới, không đứng yên ở nến signal", () => {
    const candles = risingCandles();
    const shorter = candles.slice(0, candles.length - 5);

    const now = generate(candles).at(-1);
    const before = generate(shorter).at(-1);

    // Cùng một tín hiệu (chưa có signal mới trong 5 nến cuối), chỉ khác số phiên
    // đã trôi qua → mức hiển thị phải chạy theo.
    expect(now.time).toBe(before.time);
    expect(now.priceTarget).not.toBeCloseTo(before.priceTarget, 6);
  });

  it("nến mới nhất còn đang chạy (realtime) thì giá trị cập nhật theo tick", () => {
    const candles = risingCandles();
    const lastIndex = candles.length - 1;
    const ticked = [
      ...candles.slice(0, -1),
      candleAt(lastIndex, candles.at(-1).close + 2),
    ];

    const before = generate(candles).at(-1);
    const after = generate(ticked).at(-1);

    // MA gồm cả close của nến đang chạy → tick làm giá trị nhích lên 2/period.
    expect(after.priceTarget).toBeCloseTo(before.priceTarget + 2 / period, 10);
  });

  it("các tín hiệu CŨ vẫn giữ MA tại nến của chúng — lịch sử không bị viết lại", () => {
    const candles = curvedCandles();
    const chartMA = klinechartsMA(candles, period);
    const signals = generate(candles);
    expect(signals.length).toBeGreaterThan(1);

    signals.slice(0, -1).forEach((signal) => {
      const i = candles.findIndex((c) => c.time === signal.time);
      expect(signal.priceTarget).toBeCloseTo(chartMA[i], 10);
    });
  });
});

describe("generateSignalsLong (Dài hạn)", () => {
  it("mức hiển thị là NW tại nến tín hiệu, KHÔNG còn là giá đóng cửa", () => {
    const candles = curvedCandles();
    const series = calcNwTrend(candles);
    const signals = generateSignalsLong(candles);

    expect(signals.length).toBeGreaterThan(1);
    // Bỏ tín hiệu cuối: nó cố ý được kéo về NW phiên mới nhất (case dưới).
    signals.slice(0, -1).forEach((signal) => {
      const i = candles.findIndex((c) => c.time === signal.time);
      expect(signal.priceTarget).toBeCloseTo(series[i].nw, 10);
      expect(signal.priceTarget).not.toBe(candles[i].close);
    });
  });

  it("tín hiệu CUỐI bám NW của nến mới nhất, không đứng lại ở nến vào lệnh", () => {
    const candles = risingCandles();
    const series = calcNwTrend(candles);
    const last = generateSignalsLong(candles).at(-1);

    expect(last).toBeDefined();
    expect(last.priceTarget).toBeCloseTo(series[series.length - 1].nw, 10);
  });

  it("phát cả mua lẫn bán, xen kẽ", () => {
    const types = generateSignalsLong(curvedCandles()).map((s) => s.type);

    expect(types).toContain("buy");
    expect(types).toContain("sell");
    expect(types[0]).toBe("buy"); // mồi ở trạng thái giảm
    types.forEach((type, i) => {
      if (i > 0) expect(type).not.toBe(types[i - 1]);
    });
  });
});
