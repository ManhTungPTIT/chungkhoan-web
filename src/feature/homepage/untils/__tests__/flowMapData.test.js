import { describe, expect, it } from "vitest";
import { buildFlowMap } from "../flowMapData";

const sampleRows = [
  { symbol: "SHB", volume: 38_938_800, trend: "buy" },
  { symbol: "VIX", volume: 30_549_000, trend: "sell" },
  { symbol: "NVL", volume: 27_152_700, trend: "sell" },
  { symbol: "STB", volume: 12_300, trend: "buy" },
  { symbol: "FPT", volume: 900, trend: null },
  { symbol: "HPG", volume: 500, trend: "sell" },
];

describe("buildFlowMap", () => {
  it("produces the object shape FlowMap expects", () => {
    const fm = buildFlowMap(sampleRows);
    expect(fm).toHaveProperty("title");
    expect(fm).toHaveProperty("legends");
    expect(fm).toHaveProperty("center");
    expect(fm).toHaveProperty("points");
    expect(fm).toHaveProperty("influence");
    expect(fm.points).toHaveLength(sampleRows.length);
  });

  it("maps buy → positive and sell/null → negative", () => {
    const fm = buildFlowMap(sampleRows);
    const bySymbol = Object.fromEntries(fm.points.map((p) => [p.symbol, p]));
    expect(bySymbol.SHB.tone).toBe("positive");
    expect(bySymbol.VIX.tone).toBe("negative");
    expect(bySymbol.FPT.tone).toBe("negative"); // trend null → negative
  });

  it("ranks strength by volume order (top third = strong, bottom = weak)", () => {
    const fm = buildFlowMap(sampleRows);
    expect(fm.points[0].strength).toBe("strong"); // SHB, hạng cao nhất
    expect(fm.points[fm.points.length - 1].strength).toBe("weak"); // HPG, cuối
  });

  it("formats volume with sign and M/K units", () => {
    const fm = buildFlowMap(sampleRows);
    const bySymbol = Object.fromEntries(fm.points.map((p) => [p.symbol, p]));
    expect(bySymbol.SHB.value).toBe("+38.9M");
    expect(bySymbol.STB.value).toBe("+12K");
    expect(bySymbol.HPG.value).toBe("-500");
  });

  it("distributes points around the compass", () => {
    const fm = buildFlowMap(sampleRows);
    expect(fm.points[0].angle).toBe(0);
    const angles = fm.points.map((p) => p.angle);
    expect(new Set(angles).size).toBe(sampleRows.length); // không trùng góc
  });

  it("sums total volume into the center label", () => {
    const fm = buildFlowMap(sampleRows);
    // 38_938_800 + 30_549_000 + 27_152_700 + 12_300 + 900 + 500 = 96_654_200
    expect(fm.center.value).toBe("96.7M");
  });
});
