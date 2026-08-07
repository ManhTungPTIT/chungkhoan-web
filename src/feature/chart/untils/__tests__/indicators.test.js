import { describe, it, expect } from "vitest";
import { generateSignals, generateSignalsT, generateSignalsLong } from "../indicators";

// Chuỗi giá cong (cùng dạng _curved_closes của test BE signal_service): phẳng →
// tăng tăng tốc → giảm tăng tốc, đủ làm MACD cắt Signal dứt khoát ở cả 2 chiều
// (chuỗi tuyến tính làm MACD == Signal ở trạng thái dừng → không kích tín hiệu).
function curvedCloses() {
  const flat = Array(25).fill(100);
  const up = Array.from({ length: 30 }, (_, i) => 100 + (i + 1) * (i + 1) * 0.3);
  const peak = up[up.length - 1];
  const down = Array.from({ length: 25 }, (_, i) => peak - (i + 1) * (i + 1) * 0.5);
  return [...flat, ...up, ...down];
}

// Nến có râu DÀI hai phía (±5 quanh thân) để phân biệt rõ thân vs râu. Pha
// tăng là nến xanh (open = close - 0.5), pha giảm là nến đỏ (open = close +
// 0.5) — BOT T+ đòi close > open khi mua và close < open khi bán nên phải đổi
// màu nến theo pha thì cả 3 bot mới phát đủ buy lẫn sell trên cùng một chuỗi.
function candlesWithWicks() {
  return curvedCloses().map((close, i) => {
    const open = i < 55 ? close - 0.5 : close + 0.5; // 25 flat + 30 up = xanh
    return {
      time: 1735689600 + i * 86400,
      open,
      close,
      high: Math.max(open, close) + 5, // râu trên dài
      low: Math.min(open, close) - 5, // râu dưới dài
    };
  });
}

describe.each([
  ["generateSignals (Trend)", generateSignals],
  ["generateSignalsT (T+)", generateSignalsT],
  ["generateSignalsLong (Dài hạn)", generateSignalsLong],
])("%s", (_name, generate) => {
  it("giá hiển thị neo theo THÂN nến: buy = min(open, close), sell = max(open, close)", () => {
    const candles = candlesWithWicks();
    const signals = generate(candles);

    const buy = signals.find((s) => s.type === "buy");
    expect(buy).toBeDefined();
    const buyCandle = candles.find((c) => c.time === buy.time);
    expect(buy.price).toBe(Math.min(buyCandle.open, buyCandle.close));
    expect(buy.price).toBeGreaterThan(buyCandle.low); // râu dưới bị bỏ

    const sell = signals.find((s) => s.type === "sell");
    expect(sell).toBeDefined();
    const sellCandle = candles.find((c) => c.time === sell.time);
    expect(sell.price).toBe(Math.max(sellCandle.open, sellCandle.close));
    expect(sell.price).toBeLessThan(sellCandle.high); // râu trên bị bỏ
  });
});
