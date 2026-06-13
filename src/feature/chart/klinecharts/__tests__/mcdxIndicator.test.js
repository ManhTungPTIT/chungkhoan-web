// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { calcMCDXValues } from "../mcdxIndicator";

// Dữ liệu dao động mạnh (sóng + nhiễu) — giống chỉ số thật, đủ để RSV
// chạm cả hai biên 0 và 100. 320 nến: vượt warmup banker(50)+smooth(3).
const candles = Array.from({ length: 320 }, (_, i) => {
  const close = 1700 + Math.sin(i / 18) * 120 + Math.sin(i / 6) * 30 + (i % 5);
  return { time: 1700000000 + i * 60, high: close + 7, low: close - 7, close };
});

// Reference RSV(stochastic) + SMA(3), quy về thang 0..20 — khớp công thức mới.
function refScaled(period, smooth = 3) {
  const rsv = candles.map((c, i) => {
    if (i < period - 1) return null;
    let h = -Infinity,
      l = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      h = Math.max(h, candles[j].high);
      l = Math.min(l, candles[j].low);
    }
    return h === l ? 50 : ((c.close - l) / (h - l)) * 100;
  });
  return rsv.map((_, i) => {
    if (i < period - 1 + (smooth - 1)) return null;
    let s = 0;
    for (let j = i - smooth + 1; j <= i; j++) s += rsv[j];
    return Math.min(20, Math.max(0, s / smooth / 5));
  });
}

describe("calcMCDXValues (RSV-based)", () => {
  const out = calcMCDXValues(candles, 50, 21, 10);

  it("thẳng hàng với dataList: {} trước khi đủ dữ liệu", () => {
    expect(out).toHaveLength(320);
    expect(out[0]).toEqual({});
    // banker=50 + smooth(3) → giá trị đầu tiên ở index 51
    expect(out[50]).toEqual({});
    expect(out[51].banker).toBeDefined();
  });

  it("retail luôn = 20 (nền xanh cố định)", () => {
    out.forEach((r) => {
      if (r.retail != null) expect(r.retail).toBe(20);
    });
  });

  it("mọi giá trị nằm trong thang 0..20", () => {
    out.forEach((r) => {
      ["hot", "banker", "shark"].forEach((k) => {
        if (r[k] != null) {
          expect(r[k]).toBeGreaterThanOrEqual(0);
          expect(r[k]).toBeLessThanOrEqual(20);
        }
      });
    });
  });

  it("hot/banker khớp công thức RSV tham chiếu", () => {
    const hotRef = refScaled(21);
    const bankRef = refScaled(50);
    for (let i = 51; i < 320; i++) {
      expect(out[i].hot).toBeCloseTo(hotRef[i], 10);
      expect(out[i].banker).toBeCloseTo(bankRef[i], 10);
    }
  });

  // Regression: bug cũ (Wilder RSI - 50) nén hot xuống dải ~0..9 và ~60%
  // số cột gần 0 nên nền xanh phủ kín. RSV phải trải đủ tới gần 20.
  it("hot trải đủ thang — đỉnh vượt 14 (không bị nén như bug cũ)", () => {
    const hot = out.map((r) => r.hot).filter((v) => v != null);
    expect(Math.max(...hot)).toBeGreaterThan(14);
    const nearZero = hot.filter((v) => v < 2).length / hot.length;
    expect(nearZero).toBeLessThan(0.4);
  });

  it("đường Cá Mập = EMA(banker) bắt đầu sau warmup banker", () => {
    // banker bắt đầu ở 51, EMA(10) → shark đầu tiên ở 51 + 10 - 1 = 60
    expect(out[59].shark).toBeUndefined();
    expect(out[60].shark).toBeDefined();
  });

  it("trả toàn {} khi không đủ dữ liệu", () => {
    const out2 = calcMCDXValues(candles.slice(0, 50), 50, 21, 10);
    expect(out2.every((v) => Object.keys(v).length === 0)).toBe(true);
  });
});
