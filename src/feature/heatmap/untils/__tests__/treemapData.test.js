import { describe, it, expect } from "vitest";
import {
  buildTreemapData,
  countBands,
  labelFontSize,
  withLabelFontSize,
  FONT_MIN,
  FONT_MAX,
  MIN_VALUE,
} from "../treemapData";

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
    expect(leaf.itemStyle.color).toBe("#00d31f"); // tăng giá
  });

  it("mã kịch trần → màu tím", () => {
    const vre = buildTreemapData(sample)[0].children[1];
    expect(vre.itemStyle.color).toBe("#C026D3");
  });

  it("_share = value / tổng value TOÀN bản đồ (không phải trong ngành)", () => {
    const out = buildTreemapData(sample);
    const total = 480000 + 90000 + 120000;
    expect(out[0].children[0]._share).toBeCloseTo(480000 / total, 10);
    expect(out[1].children[0]._share).toBeCloseTo(120000 / total, 10);
    const sum = out.flatMap((s) => s.children).reduce((a, l) => a + l._share, 0);
    expect(sum).toBeCloseTo(1, 10);
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
    expect(out[0].children[0].itemStyle.color).toBe("#f6bd51");
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

describe("labelFontSize", () => {
  it("cạnh ô ≈ √(share × diện tích) → chữ = cạnh / 6", () => {
    // share 0.25 của khung 240.000 px² → ô 60.000 px², cạnh 244.9 → 244.9/6 ≈ 41 → clamp FONT_MAX
    expect(labelFontSize(0.25, 240000)).toBe(FONT_MAX);
    // cạnh 60 → chữ 10
    expect(labelFontSize(3600 / 240000, 240000)).toBe(10);
  });

  it("ô càng lớn chữ càng lớn (đơn điệu)", () => {
    const area = 600000;
    const sizes = [0.0005, 0.005, 0.02, 0.08].map((s) => labelFontSize(s, area));
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });

  it("clamp hai đầu, không NaN với đầu vào rác", () => {
    expect(labelFontSize(0, 500000)).toBe(FONT_MIN);
    expect(labelFontSize(-1, 500000)).toBe(FONT_MIN);
    expect(labelFontSize(0.5, 0)).toBe(FONT_MIN);
    expect(labelFontSize(1, 1e9)).toBe(FONT_MAX);
  });
});

describe("withLabelFontSize", () => {
  it("gắn label.fontSize cho từng lá, giữ nguyên cấu trúc/màu", () => {
    // Khung nhỏ (20.000 px²) để 3 mã của `sample` chưa ô nào chạm FONT_MAX —
    // với khung thật (~600.000 px²) chỉ 3 ô thì cả 3 đều clamp, không so được.
    const out = withLabelFontSize(buildTreemapData(sample), 20000);
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe("Bất động sản");
    const vic = out[0].children[0];
    expect(vic.itemStyle.color).toBe("#00d31f");
    expect(vic.label.fontSize).toBe(labelFontSize(vic._share, 20000));
    // VIC lớn hơn SHB → chữ không nhỏ hơn
    expect(vic.label.fontSize).toBeGreaterThan(out[1].children[0].label.fontSize);
  });

  it("input không phải mảng → []", () => {
    expect(withLabelFontSize(null, 600000)).toEqual([]);
  });
});

describe("countBands", () => {
  it("đếm đúng 5 mức", () => {
    // VRE 6.93 >= CEILING → trần; VIC 6.15 và SHB 0.36 vẫn là "tăng giá"
    expect(countBands(sample)).toEqual({ ceiling: 1, up: 2, ref: 0, down: 0, floor: 0 });
  });

  it("gộp mọi ngành, bỏ mã thiếu symbol, change_pct rác → đứng giá", () => {
    const counts = countBands([
      { group: "A", symbols: [{ symbol: "A1", change_pct: 7 }, { change_pct: 7 }] },
      { group: "B", symbols: [{ symbol: "B1" }, { symbol: "B2", change_pct: -9 }] },
      { group: "C", symbols: null },
    ]);
    expect(counts).toEqual({ ceiling: 1, up: 0, ref: 1, down: 0, floor: 1 });
  });

  it("tổng 5 mức = số ô treemap đang vẽ", () => {
    const counts = countBands(sample);
    const leaves = buildTreemapData(sample).flatMap((s) => s.children).length;
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(leaves);
  });

  it("input không phải mảng → mọi mức 0", () => {
    expect(countBands(null)).toEqual({ ceiling: 0, up: 0, ref: 0, down: 0, floor: 0 });
  });
});
