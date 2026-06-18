import { describe, it, expect } from "vitest";
import { buildTreemapData, MIN_VALUE } from "../treemapData";

const sample = [
  {
    group: "Bất động sản",
    symbols: [
      { symbol: "VIC", change_pct: 6.15, market_cap: 480000 },
      { symbol: "VRE", change_pct: 6.93, market_cap: 90000 },
    ],
  },
  {
    group: "Ngân hàng",
    symbols: [{ symbol: "SHB", change_pct: 0.36, market_cap: 120000 }],
  },
];

describe("buildTreemapData", () => {
  it("gom đúng ngành và số mã", () => {
    const out = buildTreemapData(sample);
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe("Bất động sản");
    expect(out[0].children).toHaveLength(2);
    expect(out[1].name).toBe("Ngân hàng");
  });

  it("lá có value=market_cap, _pct, và màu khớp colorForChange", () => {
    const leaf = buildTreemapData(sample)[0].children[0];
    expect(leaf.name).toBe("VIC");
    expect(leaf.value).toBe(480000);
    expect(leaf._pct).toBe(6.15);
    expect(leaf.itemStyle.color).toBe("#0b6e4f"); // tăng mạnh
  });

  it("mã kịch trần → màu tím", () => {
    const vre = buildTreemapData(sample)[0].children[1];
    expect(vre.itemStyle.color).toBe("#C026D3");
  });

  it("market_cap thiếu/0 → MIN_VALUE", () => {
    const out = buildTreemapData([
      { group: "X", symbols: [{ symbol: "AAA", change_pct: 1 }] },
      { group: "Y", symbols: [{ symbol: "BBB", change_pct: 1, market_cap: 0 }] },
    ]);
    expect(out[0].children[0].value).toBe(MIN_VALUE);
    expect(out[1].children[0].value).toBe(MIN_VALUE);
  });

  it("change_pct không hợp lệ → coi như 0 (vàng)", () => {
    const out = buildTreemapData([
      { group: "X", symbols: [{ symbol: "AAA", market_cap: 100 }] },
    ]);
    expect(out[0].children[0]._pct).toBe(0);
    expect(out[0].children[0].itemStyle.color).toBe("#F4D03F");
  });

  it("ngành không có mã hợp lệ bị loại", () => {
    const out = buildTreemapData([
      { group: "Rỗng", symbols: [] },
      { group: "Có", symbols: [{ symbol: "AAA", change_pct: 1, market_cap: 100 }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Có");
  });

  it("input không phải mảng → []", () => {
    expect(buildTreemapData(null)).toEqual([]);
    expect(buildTreemapData(undefined)).toEqual([]);
  });
});
