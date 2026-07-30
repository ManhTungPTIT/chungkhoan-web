import { describe, it, expect } from "vitest";
import { mapBoardRow, buildPotentialView } from "../potentialData";

describe("mapBoardRow", () => {
  it("đổi đơn vị board (VND) → Tỷ / Nghìn, điểm = change_pct + √(thanh khoản Tỷ)", () => {
    expect(mapBoardRow({ symbol: "AAA", value: 100e9, price: 400000, change_pct: 10 })).toEqual({
      ma_ck: "AAA",
      gia_tri_khop_lenh: 100,
      gia_hien_tai: 400,
      pct_tang_gia: 20, // 10 + √100
    });
  });

  it("√ tính theo TỶ, không phải VND — thanh khoản không nhấn chìm phần %", () => {
    // 4 tỷ → bonus 2 (không phải √4e9 ≈ 63.246).
    expect(mapBoardRow({ symbol: "B", value: 4e9, change_pct: -3 }).pct_tang_gia).toBe(-1);
  });

  it("field thiếu/hỏng → 0, không NaN", () => {
    const r = mapBoardRow({ symbol: "X" });
    expect(r.gia_tri_khop_lenh).toBe(0);
    expect(r.gia_hien_tai).toBe(0);
    expect(r.pct_tang_gia).toBe(0);
  });

  it("value rác âm → bonus 0, không NaN (NaN sẽ làm sort/scale vỡ im lặng)", () => {
    expect(mapBoardRow({ symbol: "X", value: -9e9, change_pct: 4 }).pct_tang_gia).toBe(4);
  });
});

describe("buildPotentialView", () => {
  it("board rỗng → mọi max = 0", () => {
    expect(buildPotentialView([])).toEqual({
      rows: [],
      leftMax: 0,
      priceMin: 0,
      priceMax: 0,
      pctMax: 0,
      pctAxisMax: 0,
    });
  });

  it("sắp theo điểm giảm dần, min-max đường giá, bar theo max", () => {
    const board = [
      { symbol: "LOW", value: 25e9, price: 9000, change_pct: 5 },   // 5 + √25 = 10
      { symbol: "HIGH", value: 100e9, price: 400000, change_pct: 10 }, // 10 + √100 = 20
    ];

    const view = buildPotentialView(board);

    expect(view.rows.map((r) => r.ma_ck)).toEqual(["HIGH", "LOW"]);
    expect(view.leftMax).toBe(100);
    expect(view.priceMin).toBe(9);
    expect(view.priceMax).toBe(400);
    expect(view.pctMax).toBe(20);
    expect(view.rows[0].valueBarPct).toBe(100);
    expect(view.rows[1].valueBarPct).toBe(25);
    expect(view.rows[0].priceLinePct).toBe(100);
    expect(view.rows[1].priceLinePct).toBe(0);
    expect(view.rows[0].pctBarPct).toBe(100);
    expect(view.rows[1].pctBarPct).toBe(50);
  });

  it("cắt top N theo điểm", () => {
    const board = [
      { symbol: "A", value: 1e9, price: 1000, change_pct: 1 },
      { symbol: "B", value: 1e9, price: 1000, change_pct: 9 },
      { symbol: "C", value: 1e9, price: 1000, change_pct: 5 },
    ];
    const view = buildPotentialView(board, 2);
    expect(view.rows.map((r) => r.ma_ck)).toEqual(["B", "C"]);
  });

  it("thanh khoản lớn vượt được mã tăng nhiều hơn nhưng thanh khoản mỏng", () => {
    const board = [
      { symbol: "THIN", value: 1e9, price: 1000, change_pct: 9 },    // 9 + 1 = 10
      { symbol: "THICK", value: 400e9, price: 1000, change_pct: 1 }, // 1 + 20 = 21
    ];
    expect(buildPotentialView(board).rows.map((r) => r.ma_ck)).toEqual(["THICK", "THIN"]);
  });

  it("loại dòng thiếu symbol", () => {
    const view = buildPotentialView([{ value: 1e9, price: 1000, change_pct: 5 }]);
    expect(view.rows).toEqual([]);
  });
});
