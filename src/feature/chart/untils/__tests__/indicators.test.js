import { describe, it, expect } from "vitest";
import { generateSignals, calcEMA, calcMACD } from "../indicators";

// generateSignals chỉ dùng `time` và `close`. Helper dựng nến tối thiểu.
const mk = (closes, startTime = 1700000000, stepSec = 86400) =>
  closes.map((close, i) => ({
    time: startTime + i * stepSec,
    open: close,
    high: close + 2,
    low: close - 2,
    close,
  }));

// Chuỗi dao động mạnh, 300 nến — sinh nhiều lần vào/ra để kiểm bất biến.
const oscillating = mk(
  Array.from(
    { length: 300 },
    (_, i) => 100 + Math.sin(i / 15) * 20 + Math.sin(i / 5) * 6 + (i % 3),
  ),
);

describe("generateSignals", () => {
  it("trả về mảng rỗng khi chưa đủ 35 nến", () => {
    const candles = mk(Array.from({ length: 30 }, (_, i) => 100 + i));
    expect(generateSignals(candles)).toEqual([]);
  });

  it("tín hiệu luôn xen kẽ và lệnh đầu tiên là buy", () => {
    const signals = generateSignals(oscillating);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].type).toBe("buy");
    for (let i = 1; i < signals.length; i++) {
      expect(signals[i].type).not.toBe(signals[i - 1].type);
    }
  });

  it("luật logic dùng close; price hiển thị là low (buy) / high (sell)", () => {
    const signals = generateSignals(oscillating);

    // Map time -> nến và -> giá trị MA20 / MACD / Signal (do chính helper sản xuất).
    const candleByTime = new Map(oscillating.map((c) => [c.time, c]));
    const maMap = new Map(calcEMA(oscillating, 20).map((p) => [p.time, p.value]));
    const { macdLine, signal } = calcMACD(oscillating);
    const macdMap = new Map(macdLine.map((p) => [p.time, p.value]));
    const sigMap = new Map(signal.map((p) => [p.time, p.value]));

    for (const s of signals) {
      const candle = candleByTime.get(s.time);
      const ma = maMap.get(s.time);
      if (s.type === "buy") {
        // Logic (dùng close): giá đóng cửa trên MA20 VÀ MACD > Signal
        expect(candle.close).toBeGreaterThan(ma);
        expect(macdMap.get(s.time)).toBeGreaterThan(sigMap.get(s.time));
        // Hiển thị: price là giá thấp nhất của nến
        expect(s.price).toBe(candle.low);
      } else {
        // Logic (dùng close): giá đóng cửa thủng MA20
        expect(candle.close).toBeLessThan(ma);
        // Hiển thị: price là giá cao nhất của nến
        expect(s.price).toBe(candle.high);
      }
    }
  });

  it("đang giữ lệnh, giá thủng MA20 thì phát sell (uptrend rồi sập)", () => {
    // 35 nến đi ngang ~100 (warmup, không tín hiệu),
    // 25 nến tăng đều -> buy, rồi 20 nến rơi mạnh -> sell.
    const closes = [
      ...Array.from({ length: 35 }, () => 100),
      ...Array.from({ length: 25 }, (_, i) => 100 + (i + 1) * 3),
      ...Array.from({ length: 20 }, (_, i) => 172 - (i + 1) * 6),
    ];
    const signals = generateSignals(mk(closes));
    const types = signals.map((s) => s.type);

    expect(types).toContain("buy");
    expect(types).toContain("sell");
    // Có một sell xuất hiện sau buy đầu tiên
    expect(types.indexOf("sell")).toBeGreaterThan(types.indexOf("buy"));
    // Kết thúc bằng sell (đã thoát sau cú sập)
    expect(types[types.length - 1]).toBe("sell");
  });
});
