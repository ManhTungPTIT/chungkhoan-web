import { describe, it, expect } from "vitest";
import { colorForChange, CEILING, FLOOR } from "../colorBands";

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
    expect(colorForChange(0)).toBe("#F4D03F");
    expect(colorForChange(0.04)).toBe("#F4D03F");
    expect(colorForChange(-0.04)).toBe("#F4D03F");
  });

  it("tăng: xanh lá đậm dần theo biên độ", () => {
    expect(colorForChange(0.1)).toBe("#26a69a"); // < 1
    expect(colorForChange(1)).toBe("#1c8a78"); // 1–3
    expect(colorForChange(3)).toBe("#0b6e4f"); // >= 3
    expect(colorForChange(6)).toBe("#0b6e4f");
  });

  it("giảm: đỏ đậm dần theo biên độ", () => {
    expect(colorForChange(-0.1)).toBe("#ef5350"); // > -1
    expect(colorForChange(-1)).toBe("#c62828"); // -3..-1
    expect(colorForChange(-3)).toBe("#a01818"); // <= -3
    expect(colorForChange(-6)).toBe("#a01818");
  });

  it("hằng số ngưỡng đúng", () => {
    expect(CEILING).toBe(6.5);
    expect(FLOOR).toBe(-6.5);
  });
});
