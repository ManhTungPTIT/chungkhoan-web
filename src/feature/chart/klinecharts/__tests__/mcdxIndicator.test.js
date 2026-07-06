import { describe, expect, it, vi } from "vitest";

vi.mock("klinecharts/dist/index.esm.js", () => ({
  registerIndicator: vi.fn(),
}));

const { registerIndicator } = await import("klinecharts/dist/index.esm.js");
const { calcMCDXValues } = await import("../mcdxIndicator");
const registration = registerIndicator.mock.calls[0][0];

const closesToCandles = (closes) =>
  closes.map((close) => ({ open: close, high: close, low: close, close }));

function makeCandles(length) {
  return Array.from({ length }, (_, index) => {
    const close = 100 + Math.sin(index / 5) * 8 + index * 0.25;
    return {
      open: close - 1,
      high: close + 3,
      low: close - 4,
      close,
    };
  });
}

describe("calcMCDXValues", () => {
  it("tính banker theo RSI Wilder: (RSI − baseline) × sensitivity, kẹp 0–20", () => {
    // closes [1,2,3,4,3,4] → diff +1,+1,+1,−1,+1; RSI(3) Wilder:
    //   i=3: avgGain=1, avgLoss=0        → RSI = 100
    //   i=4: avgGain=2/3, avgLoss=1/3    → RSI = 66.6667
    //   i=5: avgGain=7/9, avgLoss=2/9    → RSI = 77.7778
    const values = calcMCDXValues(
      closesToCandles([1, 2, 3, 4, 3, 4]),
      [3, 50, 0.1, 3, 30, 0.7, 3, 10],
    );
    const last = values.at(-1);

    // banker = (77.7778 − 50) × 0.1
    expect(last.banker).toBeCloseTo(2.7778, 3);
    // hotRaw = (77.7778 − 30) × 0.7 = 33.4 → kẹp 20; cột vàng vẽ chồng lên đỏ
    expect(last.hotRaw).toBe(20);
    expect(last.hot).toBe(20);
    // retail = (77.7778 − 10) × 1 → kẹp 20
    expect(last.retail).toBe(20);
    // shark = SMA(banker, 10) có warm-up: mean(5, 1.6667, 2.7778)
    expect(last.shark).toBeCloseTo(3.1481, 3);
    expect(last.level5).toBe(5);
    expect(last.level10).toBe(10);
    expect(last.level15).toBe(15);
  });

  it("banker về 0 khi thị trường đi ngang (RSI quanh 50)", () => {
    // Giá dao động ±1 quanh 100; nến cuối là nến giảm → RSI(50) < 50 → đỏ = 0.
    const closes = Array.from(
      { length: 120 },
      (_, i) => 100 + (i % 2 === 0 ? 1 : -1),
    );
    const values = calcMCDXValues(closesToCandles(closes));
    const last = values.at(-1);

    expect(last.banker).toBe(0);
    // Vàng vẫn hiện (RSI(40) ≈ 50 > baseline 30) nhưng không chạm trần
    expect(last.hotRaw).toBeGreaterThan(5);
    expect(last.hotRaw).toBeLessThan(20);
    expect(last.hot).toBe(Math.min(20, last.banker + last.hotRaw));
    expect(last.retail).toBe(20);
  });

  it("kẹp trần 20 khi xu hướng tăng mạnh và về 0 khi giảm mạnh", () => {
    const rising = calcMCDXValues(
      closesToCandles(Array.from({ length: 120 }, (_, i) => 100 + i)),
    ).at(-1);
    expect(rising.banker).toBe(20);
    expect(rising.hot).toBe(20);
    expect(rising.retail).toBe(20);

    const falling = calcMCDXValues(
      closesToCandles(Array.from({ length: 120 }, (_, i) => 300 - i)),
    ).at(-1);
    expect(falling.banker).toBe(0);
    expect(falling.hotRaw).toBe(0);
    expect(falling.retail).toBe(0);
  });

  it("cột vàng luôn vẽ chồng từ đỉnh cột đỏ (hot ≥ banker)", () => {
    const values = calcMCDXValues(makeCandles(120));
    const computed = values.filter(
      (value) => value.hot != null && value.banker != null,
    );
    expect(computed.length).toBeGreaterThan(0);
    computed.forEach((value) => {
      expect(value.hot).toBeGreaterThanOrEqual(value.banker);
      expect(value.hot).toBe(Math.min(20, value.banker + value.hotRaw));
      expect(value.shark).toBeGreaterThanOrEqual(0);
      expect(value.shark).toBeLessThanOrEqual(20);
    });
  });

  it("accepts the legacy three-parameter config without breaking", () => {
    const values = calcMCDXValues(makeCandles(80), [50, 21, 10]);
    const last = values.at(-1);

    expect(last.retail).toBeGreaterThanOrEqual(0);
    expect(last.banker).toBeGreaterThanOrEqual(0);
    expect(last.hot).toBeGreaterThanOrEqual(0);
    expect(last.shark).toBeGreaterThanOrEqual(0);
  });
});

describe("MCDX indicator drawing", () => {
  it("draws inside the fixed pane bounds while following zoomed axes", () => {
    const rects = [];
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn((x, y, width, height) => {
        rects.push({ x, y, width, height });
      }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      set fillStyle(value) {
        this._fillStyle = value;
      },
      set strokeStyle(value) {
        this._strokeStyle = value;
      },
      set lineWidth(value) {
        this._lineWidth = value;
      },
    };

    const isCover = registration.draw({
      ctx,
      bounding: { width: 300, height: 120 },
      barSpace: { bar: 14, halfGapBar: 6 },
      visibleRange: { realFrom: 0, realTo: 2 },
      xAxis: { convertToPixel: (index) => 20 + index * 12 },
      yAxis: { convertToPixel: (value) => 120 - value * 8 },
      indicator: {
        result: [
          { retail: 20, hot: 20, banker: 18, shark: 17, level5: 5, level10: 10, level15: 15 },
          { retail: 20, hot: 19, banker: 6, shark: 10, level5: 5, level10: 10, level15: 15 },
        ],
      },
    });

    expect(isCover).toBe(true);
    expect(ctx.clip).toHaveBeenCalled();
    expect(rects.length).toBeGreaterThan(0);
    rects.forEach((rect) => {
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.y + rect.height).toBeLessThanOrEqual(120);
      expect(rect.width).toBeCloseTo(12.88);
    });
  });
});
