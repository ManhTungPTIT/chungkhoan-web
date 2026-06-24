import { describe, expect, it } from "vitest";
import { calculateBalanceTilt } from "../SupplyBalanceScene";

describe("calculateBalanceTilt", () => {
  it("tilts the heavier buy side downward", () => {
    expect(calculateBalanceTilt({ buyPercent: 74, sellPercent: 26 })).toBeGreaterThan(0);
  });

  it("tilts the heavier sell side downward", () => {
    expect(calculateBalanceTilt({ buyPercent: 26, sellPercent: 74 })).toBeLessThan(0);
  });

  it("keeps the beam level when both sides are equal", () => {
    expect(calculateBalanceTilt({ buyPercent: 50, sellPercent: 50 })).toBe(0);
  });
});
