import { describe, expect, it, vi } from "vitest";

vi.mock("klinecharts/dist/index.esm.js", () => ({
  registerIndicator: vi.fn(),
}));

const { registerIndicator } = await import("klinecharts/dist/index.esm.js");
const { calcBBValues } = await import("../bbSignalIndicator");

const getRegistration = () =>
  registerIndicator.mock.calls.find(([indicator]) => indicator.name === "BBS")
    ?.[0];

const createCtx = () => {
  const fillStyles = [];
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    globalCompositeOperation: "source-over",
  };

  Object.defineProperty(ctx, "fillStyle", {
    set: (value) => fillStyles.push(value),
  });

  return { ctx, fillStyles };
};

describe("calcBBValues", () => {
  it("returns empty rows before period and upper/lower bands after warm-up", () => {
    const data = [1, 2, 3].map((close) => ({ close }));

    const values = calcBBValues(data, 2, 2);

    expect(values[0]).toEqual({});
    expect(values[1].upper).toBeCloseTo(2.5);
    expect(values[1].lower).toBeCloseTo(0.5);
    expect(values[2].upper).toBeCloseTo(3.5);
    expect(values[2].lower).toBeCloseTo(1.5);
  });
});

describe("BBS indicator fill", () => {
  it("draws the signal-colored cloud when the newest candle is a signal", () => {
    const registration = getRegistration();
    const { ctx, fillStyles } = createCtx();
    const timestamps = [1000, 2000, 3000];
    const result = [
      { upper: 12, lower: 8 },
      { upper: 13, lower: 9 },
      { upper: 14, lower: 10 },
    ];

    registration.draw({
      ctx,
      kLineDataList: timestamps.map((timestamp) => ({ timestamp })),
      indicator: {
        result,
        extendData: [{ time: 3, type: "buy" }],
      },
      visibleRange: { from: 0, to: result.length },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(fillStyles).toContain("rgba(154, 250, 152,0.7)");
    expect(ctx.fill).toHaveBeenCalledTimes(2);
  });
});
