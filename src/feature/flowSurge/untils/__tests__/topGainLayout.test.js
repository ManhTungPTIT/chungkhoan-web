import { describe, it, expect } from "vitest";
import { buildTopGainView } from "../topGainLayout";

describe("buildTopGainView", () => {
  it("mảng rỗng → mọi max = 0, rows rỗng", () => {
    expect(buildTopGainView([])).toEqual({
      rows: [],
      leftMax: 0,
      priceMin: 0,
      priceMax: 0,
      pctMax: 0,
      pctAxisMax: 0,
    });
  });

  it("tính bar tím, đường giá min-max, bar % theo max", () => {
    const rows = [
      { symbol: "HIGH", gia_tri_khop_lenh: 200, gia_hien_tai: 400, pct_tang: 10 },
      { symbol: "LOW", gia_tri_khop_lenh: 50, gia_hien_tai: 9, pct_tang: 5 },
    ];

    const view = buildTopGainView(rows);

    expect(view.leftMax).toBe(200);
    expect(view.priceMin).toBe(9);
    expect(view.priceMax).toBe(400);
    expect(view.pctMax).toBe(10);
    expect(view.pctAxisMax).toBe(10);

    // cột tím theo max 200
    expect(view.rows[0].valueBarPct).toBe(100);
    expect(view.rows[1].valueBarPct).toBe(25);
    // đường giá min-max: 400→100, 9→0
    expect(view.rows[0].priceLinePct).toBe(100);
    expect(view.rows[1].priceLinePct).toBe(0);
    // cột % theo max 10
    expect(view.rows[0].pctBarPct).toBe(100);
    expect(view.rows[1].pctBarPct).toBe(50);
  });

  it("trục % dòng tiền làm tròn 1/2/5 (9,250% → 10,000), bar khớp trục", () => {
    const view = buildTopGainView([
      { symbol: "A", gia_tri_khop_lenh: 1, gia_hien_tai: 20, pct_tang: 9250 },
      { symbol: "B", gia_tri_khop_lenh: 1, gia_hien_tai: 20, pct_tang: 100 },
    ]);
    expect(view.pctAxisMax).toBe(10000);
    expect(view.rows[0].pctBarPct).toBeCloseTo(92.5);
    expect(view.rows[1].pctBarPct).toBe(1);
  });

  it("mọi mã cùng giá → điểm đường giá ở giữa (50)", () => {
    const view = buildTopGainView([
      { symbol: "A", gia_tri_khop_lenh: 1, gia_hien_tai: 20, pct_tang: 1 },
      { symbol: "B", gia_tri_khop_lenh: 1, gia_hien_tai: 20, pct_tang: 1 },
    ]);
    expect(view.rows[0].priceLinePct).toBe(50);
    expect(view.rows[1].priceLinePct).toBe(50);
  });

  it("dữ liệu hỏng/thiếu → coi như 0, không NaN", () => {
    const view = buildTopGainView([
      { symbol: "X", gia_tri_khop_lenh: null, gia_hien_tai: undefined, pct_tang: "abc" },
    ]);
    expect(view.rows).toEqual([]);
  });
});
