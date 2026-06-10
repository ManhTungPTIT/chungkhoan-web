// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { calcBBValues } from "../bbSignalIndicator";

// close = 1..25 — mean và population-sd của 1..20 tính tay được
const candles = Array.from({ length: 25 }, (_, i) => ({ close: i + 1 }));
// population variance của 1..20 = (20² - 1) / 12 = 33.25
const SD = Math.sqrt(33.25);

describe("calcBBValues", () => {
  it("trả mảng cùng độ dài dataList, {} cho nến chưa đủ period", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out).toHaveLength(25);
    expect(out[0]).toEqual({});
    expect(out[18]).toEqual({});
    expect(out[19].upper).toBeDefined();
  });

  it("tính đúng band tại nến thứ 20 (close = 1..20, mean 10.5)", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out[19].upper).toBeCloseTo(10.5 + 2 * SD, 6);
    expect(out[19].lower).toBeCloseTo(10.5 - 2 * SD, 6);
  });

  it("cửa sổ trượt: nến thứ 21 dùng close = 2..21 (mean 11.5, sd không đổi)", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out[20].upper).toBeCloseTo(11.5 + 2 * SD, 6);
    expect(out[20].lower).toBeCloseTo(11.5 - 2 * SD, 6);
  });
});
