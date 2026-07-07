import { describe, it, expect } from "vitest";
import { bucketStart, mergeQuoteIntoCandles } from "../liveCandle";

// Nến tối giản: time unix giây, OHLC number (như useIntraday đã normalize)
const candle = (time, close, extra = {}) => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume: 0,
  ...extra,
});

// 2026-07-07 03:04:05 UTC (10:04:05 giờ VN, trong phiên)
const T = Date.UTC(2026, 6, 7, 3, 4, 5) / 1000;

describe("bucketStart", () => {
  it("khung phút/giờ: floor về đầu khung", () => {
    expect(bucketStart(T, "1m")).toBe(Date.UTC(2026, 6, 7, 3, 4) / 1000);
    expect(bucketStart(T, "5m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "15m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "30m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "1h")).toBe(Date.UTC(2026, 6, 7, 3) / 1000);
  });

  it("khung ngày: floor về 00:00 UTC (khớp normalizeCandle của nến 'YYYY-MM-DD')", () => {
    expect(bucketStart(T, "1d")).toBe(Date.UTC(2026, 6, 7) / 1000);
  });

  it("khung tuần: floor về thứ Hai đầu tuần", () => {
    // 2026-07-07 là thứ Ba → tuần bắt đầu thứ Hai 2026-07-06
    expect(bucketStart(T, "1w")).toBe(Date.UTC(2026, 6, 6) / 1000);
    // Chính thứ Hai thì giữ nguyên ngày
    expect(bucketStart(Date.UTC(2026, 6, 6, 5) / 1000, "1w")).toBe(
      Date.UTC(2026, 6, 6) / 1000,
    );
  });

  it("khung tháng: floor về ngày 1 đầu tháng", () => {
    expect(bucketStart(T, "1mth")).toBe(Date.UTC(2026, 6, 1) / 1000);
  });
});

describe("mergeQuoteIntoCandles — cùng khung nến cuối", () => {
  it("cập nhật close, nới high/low, giữ nguyên time và open", () => {
    const last = candle(Date.UTC(2026, 6, 7) / 1000, 100, { open: 98, high: 101, low: 97 });
    const out = mergeQuoteIntoCandles([last], { price: 103, time: T }, "1d");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ time: last.time, open: 98, high: 103, low: 97, close: 103 });
  });

  it("giá giảm sâu → hạ low, giữ high", () => {
    const last = candle(Date.UTC(2026, 6, 7) / 1000, 100, { high: 101, low: 97 });
    const out = mergeQuoteIntoCandles([last], { price: 95, time: T }, "1d");
    expect(out[0]).toMatchObject({ high: 101, low: 95, close: 95 });
  });

  it("nến cuối không stamp đúng đầu khung (vd nến tuần stamp thứ Sáu) vẫn nhận ra cùng khung", () => {
    // Nến tuần stamp thứ Tư 2026-07-08? — dùng thứ Hai tuần đó +2 ngày
    const last = candle(Date.UTC(2026, 6, 8) / 1000, 100);
    const out = mergeQuoteIntoCandles([last], { price: 102, time: T }, "1w");
    expect(out).toHaveLength(1);
    expect(out[0].close).toBe(102);
  });

  it("quote không đổi gì → trả về đúng reference cũ (không re-render thừa)", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    const out = mergeQuoteIntoCandles(candles, { price: 100, time: T }, "1d");
    expect(out).toBe(candles);
  });
});

describe("mergeQuoteIntoCandles — sang khung mới", () => {
  it("append nến mới seed từ giá quote (OHLC = price)", () => {
    const last = candle(Date.UTC(2026, 6, 6) / 1000, 100); // nến ngày hôm qua
    const out = mergeQuoteIntoCandles([last], { price: 104, time: T }, "1d");
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({
      time: Date.UTC(2026, 6, 7) / 1000,
      open: 104,
      high: 104,
      low: 104,
      close: 104,
    });
  });

  it("khung 1m: tick sau 2 phút append nến ở đầu khung phút mới", () => {
    const last = candle(Date.UTC(2026, 6, 7, 3, 2) / 1000, 100);
    const out = mergeQuoteIntoCandles([last], { price: 101, time: T }, "1m");
    expect(out).toHaveLength(2);
    expect(out[1].time).toBe(Date.UTC(2026, 6, 7, 3, 4) / 1000);
  });
});

describe("mergeQuoteIntoCandles — volume", () => {
  it("volume quote (KL cộng dồn trong ngày) chỉ áp vào nến khung 1d", () => {
    const day = candle(Date.UTC(2026, 6, 7) / 1000, 100, { volume: 500 });
    const outDay = mergeQuoteIntoCandles([day], { price: 101, time: T, volume: 900 }, "1d");
    expect(outDay[0].volume).toBe(900);

    const minute = candle(Date.UTC(2026, 6, 7, 3, 4) / 1000, 100, { volume: 50 });
    const outMin = mergeQuoteIntoCandles([minute], { price: 101, time: T, volume: 900 }, "1m");
    expect(outMin[0].volume).toBe(50); // giữ nguyên, không ghi đè KL ngày vào nến phút
  });
});

describe("mergeQuoteIntoCandles — dữ liệu xấu", () => {
  it("quote cũ hơn nến cuối → bỏ qua, trả reference cũ", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    const out = mergeQuoteIntoCandles(
      candles,
      { price: 90, time: Date.UTC(2026, 6, 5, 3) / 1000 },
      "1d",
    );
    expect(out).toBe(candles);
  });

  it("quote thiếu/không hợp lệ → trả nguyên candles", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    expect(mergeQuoteIntoCandles(candles, null, "1d")).toBe(candles);
    expect(mergeQuoteIntoCandles(candles, { price: NaN, time: T }, "1d")).toBe(candles);
    expect(mergeQuoteIntoCandles(candles, { price: 100 }, "1d")).toBe(candles);
  });

  it("seeds a temporary candle from quote when history is empty", () => {
    expect(mergeQuoteIntoCandles([], { price: 100, time: T, volume: 900 }, "1d")).toEqual([
      {
        time: Date.UTC(2026, 6, 7) / 1000,
        open: 100,
        high: 100,
        low: 100,
        close: 100,
        volume: 900,
      },
    ]);
  });
});
