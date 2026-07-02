import { describe, expect, it, vi } from "vitest";

vi.mock("klinecharts/dist/index.esm.js", () => ({
  registerIndicator: vi.fn(),
}));

const { registerIndicator } = await import("klinecharts/dist/index.esm.js");
const { calcRSIValues } = await import("../rsiIndicator");

const closesToCandles = (closes) =>
  closes.map((close) => ({ open: close, high: close, low: close, close }));

describe("calcRSIValues", () => {
  it("tính RSI theo Wilder (không phải trung bình đơn của klinecharts)", () => {
    // closes [1,2,3,4,3,4] → diff +1,+1,+1,−1,+1; RSI(3) Wilder:
    //   i=3: avgGain=1, avgLoss=0        → RSI = 100
    //   i=4: avgGain=2/3, avgLoss=1/3    → RSI = 66.6667
    //   i=5: avgGain=7/9, avgLoss=2/9    → RSI = 77.7778
    const values = calcRSIValues(closesToCandles([1, 2, 3, 4, 3, 4]), [3]);

    expect(values[2].rsi).toBeUndefined();
    expect(values[3].rsi).toBe(100);
    expect(values[4].rsi).toBeCloseTo(66.6667, 3);
    expect(values.at(-1).rsi).toBeCloseTo(77.7778, 3);
  });

  it("kèm ba ngưỡng 30/50/70 phủ TOÀN BỘ trục ngang, kể cả vùng warm-up", () => {
    const values = calcRSIValues(closesToCandles([1, 2, 3, 4, 3, 4]), [3]);

    // Như mẫu: ngưỡng kẻ suốt chiều ngang từ nến đầu tiên, không đợi đủ RSI
    values.forEach((row) => {
      expect(row.level70).toBe(70);
      expect(row.level50).toBe(50);
      expect(row.level30).toBe(30);
    });
  });

  it("mặc định chu kỳ 14 và chịu được tham số hỏng", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const byDefault = calcRSIValues(closesToCandles(closes));
    const byBadParam = calcRSIValues(closesToCandles(closes), ["bad"]);

    // Nến tăng liên tục → RSI = 100 từ index = period (14) trở đi
    expect(byDefault[13].rsi).toBeUndefined();
    expect(byDefault[14].rsi).toBe(100);
    expect(byBadParam[14].rsi).toBe(100);
  });
});

describe("RSI indicator registration", () => {
  const getRegistration = () =>
    registerIndicator.mock.calls.find(
      ([indicator]) => indicator.name === "RSI",
    )?.[0];

  it("đăng ký đè chỉ báo RSI built-in với một đường + ba ngưỡng", () => {
    const registration = getRegistration();

    expect(registration).toBeDefined();
    expect(registration.calcParams).toEqual([14]);
    expect(registration.figures.map((figure) => figure.key)).toEqual([
      "level70",
      "level50",
      "level30",
      "rsi",
    ]);
  });

  it("tô xanh vùng RSI vượt ngưỡng 70 và đỏ vùng dưới ngưỡng 30", () => {
    const registration = getRegistration();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
    };
    const fillStyles = [];
    Object.defineProperty(ctx, "fillStyle", {
      set: (value) => fillStyles.push(value),
    });
    const result = [80, 75, 50, 20, 25].map((rsi) => ({
      rsi,
      level70: 70,
      level50: 50,
      level30: 30,
    }));

    registration.draw({
      ctx,
      bounding: { width: 500, height: 100 },
      // Trục tuyến tính đơn giản: value v → pixel 100 − v; nến i → x = i×10
      yAxis: { convertToPixel: (value) => 100 - value },
      xAxis: { convertToPixel: (index) => index * 10 },
      visibleRange: { from: 0, to: result.length },
      indicator: { result },
    });

    // Vùng clip nửa TRÊN ngưỡng 70 (y 0→30) và nửa DƯỚI ngưỡng 30 (y 70→100)
    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 500, 30);
    expect(ctx.rect).toHaveBeenCalledWith(0, 70, 500, 30);
    expect(ctx.clip).toHaveBeenCalledTimes(2);
    // Có tô ít nhất 2 vùng (đa giác giữa đường RSI và mỗi ngưỡng)
    expect(ctx.fill.mock.calls.length).toBeGreaterThanOrEqual(2);
    // Một màu xanh cho quá mua, một màu đỏ cho quá bán
    expect(fillStyles.some((style) => /42, 207, 64|#2acf40/i.test(style))).toBe(
      true,
    );
    expect(fillStyles.some((style) => /255, 82, 82|red/i.test(style))).toBe(
      true,
    );
  });
});
