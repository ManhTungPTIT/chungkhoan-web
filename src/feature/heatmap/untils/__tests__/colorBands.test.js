import { describe, it, expect } from "vitest";
import { colorForChange, bandForChange, BANDS, CEILING, FLOOR } from "../colorBands";

describe("colorForChange", () => {
  it("trần: pct >= 6.5 → tím", () => {
    expect(colorForChange(6.5)).toBe("#C026D3");
    expect(colorForChange(7)).toBe("#C026D3");
  });

  it("sàn: pct <= -6.5 → xanh dương", () => {
    expect(colorForChange(-6.5)).toBe("#22A7F0");
    expect(colorForChange(-7)).toBe("#22A7F0");
  });

  it("tham chiếu: |pct| < 0.05 → vàng", () => {
    expect(colorForChange(0)).toBe("#f6bd51");
    expect(colorForChange(0.04)).toBe("#f6bd51");
    expect(colorForChange(-0.04)).toBe("#f6bd51");
  });

  it("tăng: một màu xanh lá cho mọi biên độ dưới trần", () => {
    expect(colorForChange(0.1)).toBe("#00d31f");
    expect(colorForChange(1)).toBe("#00d31f");
    expect(colorForChange(6)).toBe("#00d31f");
  });

  it("giảm: một màu đỏ cho mọi biên độ trên sàn", () => {
    expect(colorForChange(-0.1)).toBe("#ef2f2e");
    expect(colorForChange(-1)).toBe("#ef2f2e");
    expect(colorForChange(-6)).toBe("#ef2f2e");
  });

  it("hằng số ngưỡng đúng", () => {
    expect(CEILING).toBe(6.5);
    expect(FLOOR).toBe(-6.5);
  });
});

describe("bandForChange", () => {
  it("phân đúng 5 mức", () => {
    expect(bandForChange(7)).toBe("ceiling");
    expect(bandForChange(2)).toBe("up");
    expect(bandForChange(0)).toBe("ref");
    expect(bandForChange(-2)).toBe("down");
    expect(bandForChange(-7)).toBe("floor");
  });
});

describe("BANDS", () => {
  it("đúng thứ tự hiện trên chú giải và khớp màu với colorForChange", () => {
    expect(BANDS.map((b) => b.id)).toEqual(["ceiling", "up", "ref", "down", "floor"]);
    expect(BANDS.map((b) => b.label)).toEqual([
      "Tăng trần",
      "Tăng giá",
      "Đứng giá",
      "Giảm giá",
      "Giảm sàn",
    ]);
    // chú giải và ô treemap không được lệch màu
    for (const [pct, id] of [[7, "ceiling"], [2, "up"], [0, "ref"], [-2, "down"], [-7, "floor"]]) {
      expect(BANDS.find((b) => b.id === id).color).toBe(colorForChange(pct));
    }
  });
});
