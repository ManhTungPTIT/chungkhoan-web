import { describe, it, expect } from "vitest";
import { mapBoardRow, buildPotentialView } from "../potentialData";

describe("mapBoardRow", () => {
  it("đổi đơn vị board (VND) → Tỷ / Nghìn, điểm = change_pct × log10(thanh khoản Tỷ + 1)", () => {
    expect(mapBoardRow({ symbol: "AAA", value: 999e9, price: 400000, change_pct: 10 })).toEqual({
      ma_ck: "AAA",
      gia_tri_khop_lenh: 999,
      gia_hien_tai: 400,
      pct_tang_gia: 10,
      diem: 30, // 10 × log10(1000)
    });
  });

  it("log10 tính theo TỶ, không phải VND — thanh khoản không bị san phẳng", () => {
    // 9 tỷ → hệ số log10(10) = 1 (không phải log10(9e9 + 1) ≈ 9.95).
    expect(mapBoardRow({ symbol: "B", value: 9e9, change_pct: 4 }).diem).toBeCloseTo(4, 10);
  });

  it("field thiếu/hỏng → 0, không NaN", () => {
    const r = mapBoardRow({ symbol: "X" });
    expect(r.gia_tri_khop_lenh).toBe(0);
    expect(r.gia_hien_tai).toBe(0);
    expect(r.pct_tang_gia).toBe(0);
    expect(r.diem).toBe(0);
  });

  it("value rác âm → hệ số log10(1) = 0, không NaN (NaN sẽ làm sort/scale vỡ im lặng)", () => {
    expect(mapBoardRow({ symbol: "X", value: -9e9, change_pct: 4 }).diem).toBe(0);
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
      { symbol: "LOW", value: 9e9, price: 9000, change_pct: 5 },        // 5 × 1 = 5
      { symbol: "HIGH", value: 999e9, price: 400000, change_pct: 10 },  // 10 × 3 = 30
    ];

    const view = buildPotentialView(board);

    expect(view.rows.map((r) => r.ma_ck)).toEqual(["HIGH", "LOW"]);
    expect(view.leftMax).toBe(999);
    expect(view.priceMin).toBe(9);
    expect(view.priceMax).toBe(400);
    expect(view.pctMax).toBe(10); // % thật, không phải điểm
    expect(view.rows[0].valueBarPct).toBe(100);
    expect(view.rows[0].priceLinePct).toBe(100);
    expect(view.rows[1].priceLinePct).toBe(0);
    expect(view.rows[0].pctBarPct).toBe(100); // trục % max = 10
    expect(view.rows[1].pctBarPct).toBe(50);
  });

  it("cắt top N theo điểm", () => {
    const board = [
      { symbol: "A", value: 9e9, price: 1000, change_pct: 1 },
      { symbol: "B", value: 9e9, price: 1000, change_pct: 9 },
      { symbol: "C", value: 9e9, price: 1000, change_pct: 5 },
    ];
    const view = buildPotentialView(board, 2);
    expect(view.rows.map((r) => r.ma_ck)).toEqual(["B", "C"]);
  });

  it("thanh khoản lớn vượt được mã tăng nhiều hơn nhưng thanh khoản mỏng", () => {
    const board = [
      { symbol: "THIN", value: 2e9, price: 1000, change_pct: 6 },     // 6 × log10(3) ≈ 2.86
      { symbol: "THICK", value: 999e9, price: 1000, change_pct: 2 },  // 2 × 3 = 6
    ];
    expect(buildPotentialView(board).rows.map((r) => r.ma_ck)).toEqual(["THICK", "THIN"]);
  });

  it("loại mã thanh khoản ≤ 1 tỷ", () => {
    const board = [
      { symbol: "THIN", value: 1e9, price: 1000, change_pct: 9 },
      { symbol: "OK", value: 1.5e9, price: 1000, change_pct: 1 },
    ];
    expect(buildPotentialView(board).rows.map((r) => r.ma_ck)).toEqual(["OK"]);
  });

  it("loại mã giá không tăng (đứng giá hoặc giảm)", () => {
    const board = [
      { symbol: "DOWN", value: 500e9, price: 1000, change_pct: -3 },
      { symbol: "FLAT", value: 500e9, price: 1000, change_pct: 0 },
      { symbol: "UP", value: 500e9, price: 1000, change_pct: 0.1 },
    ];
    expect(buildPotentialView(board).rows.map((r) => r.ma_ck)).toEqual(["UP"]);
  });

  it("loại dòng thiếu symbol", () => {
    const view = buildPotentialView([{ value: 5e9, price: 1000, change_pct: 5 }]);
    expect(view.rows).toEqual([]);
  });
});
