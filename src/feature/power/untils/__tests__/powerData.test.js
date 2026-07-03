import { describe, it, expect } from "vitest";
import { buildPowerData, colorForCategory } from "../powerData";

describe("colorForCategory", () => {
  it("trả đúng màu từng nhóm", () => {
    expect(colorForCategory("green")).toBe("#2e9e5b");
    expect(colorForCategory("red")).toBe("#e53935");
    expect(colorForCategory("purple")).toBe("#8e24aa");
    expect(colorForCategory("unknown")).toBe("#2e9e5b");
  });
});

describe("buildPowerData", () => {
  it("chọn đúng topN theo |pct| và loại các mã yếu", () => {
    // 45 mã tăng: pct = 1..45 (mã i có pct = i+1, value nhỏ để không thành tím)
    const board = Array.from({ length: 45 }, (_, i) => ({
      symbol: `S${i}`,
      change_pct: i + 1,
      value: 1,
    }));
    const out = buildPowerData(board, { topN: 40, purpleN: 0 });
    expect(out).toHaveLength(40);
    const syms = new Set(out.map((x) => x.symbol));
    // 5 mã |pct| nhỏ nhất (S0..S4) bị loại
    expect(syms.has("S0")).toBe(false);
    expect(syms.has("S4")).toBe(false);
    expect(syms.has("S44")).toBe(true);
  });

  it("ngày đỏ: chọn cân 2 phe — mã tăng không bị mã giảm sâu chèn hết suất", () => {
    // 5 mã tăng nhẹ + 45 mã giảm sâu. Chọn theo |pct| thuần thì 40 suất đều
    // là mã giảm → xanh biến mất. Chọn cân phe: đủ cả 5 mã tăng + 35 mã giảm.
    const board = [
      ...Array.from({ length: 5 }, (_, i) => ({
        symbol: `G${i}`,
        change_pct: 0.1 + i * 0.1,
        value: 1,
      })),
      ...Array.from({ length: 45 }, (_, i) => ({
        symbol: `R${i}`,
        change_pct: -(i + 1),
        value: 1,
      })),
    ];
    const out = buildPowerData(board, { topN: 40, purpleN: 0 });
    expect(out).toHaveLength(40);
    expect(out.filter((d) => d.category === "green")).toHaveLength(5);
    expect(out.filter((d) => d.category === "red")).toHaveLength(35);
  });

  it("hai phe đều đông → chia đôi suất topN, mỗi phe lấy |pct| lớn nhất", () => {
    const board = [
      ...Array.from({ length: 30 }, (_, i) => ({
        symbol: `G${i}`,
        change_pct: i + 1,
        value: 1,
      })),
      ...Array.from({ length: 30 }, (_, i) => ({
        symbol: `R${i}`,
        change_pct: -(i + 1),
        value: 1,
      })),
    ];
    const out = buildPowerData(board, { topN: 40, purpleN: 0 });
    expect(out).toHaveLength(40);
    expect(out.filter((d) => d.pct > 0)).toHaveLength(20);
    expect(out.filter((d) => d.pct < 0)).toHaveLength(20);
    const syms = new Set(out.map((x) => x.symbol));
    // mỗi phe giữ mã mạnh nhất, loại mã yếu nhất của chính phe đó
    expect(syms.has("G29")).toBe(true);
    expect(syms.has("R29")).toBe(true);
    expect(syms.has("G0")).toBe(false);
    expect(syms.has("R0")).toBe(false);
  });

  it("board < topN → lấy hết", () => {
    const board = [
      { symbol: "A", change_pct: 1, value: 1 },
      { symbol: "B", change_pct: -2, value: 1 },
    ];
    expect(buildPowerData(board, { purpleN: 0 })).toHaveLength(2);
  });

  it("tím = top value trong các mã TĂNG; mã giảm không vào tím dù value lớn", () => {
    const board = [
      { symbol: "UP", change_pct: 5, value: 999 }, // tăng, value lớn nhất → tím
      { symbol: "DOWN", change_pct: -4, value: 888 }, // giảm → đỏ dù value nhì
      { symbol: "X", change_pct: 3, value: 1 },
      { symbol: "Y", change_pct: -3, value: 1 },
    ];
    const out = buildPowerData(board, { topN: 40, purpleN: 1 });
    const bySym = Object.fromEntries(out.map((d) => [d.symbol, d]));
    expect(bySym.UP.category).toBe("purple");
    expect(bySym.DOWN.category).toBe("red");
    expect(bySym.X.category).toBe("green");
    expect(bySym.Y.category).toBe("red");
  });

  it("magnitude = |pct|", () => {
    const board = [
      { symbol: "A", change_pct: -6.2, value: 1 },
      { symbol: "B", change_pct: 2.5, value: 1 },
    ];
    const bySym = Object.fromEntries(
      buildPowerData(board, { purpleN: 0 }).map((d) => [d.symbol, d]),
    );
    expect(bySym.A.magnitude).toBe(6.2);
    expect(bySym.B.magnitude).toBe(2.5);
  });

  it("sắp xếp gom cung green→purple→red, trong nhóm theo magnitude giảm dần", () => {
    const board = [
      { symbol: "G1", change_pct: 2, value: 1 },
      { symbol: "G2", change_pct: 5, value: 1 },
      { symbol: "R1", change_pct: -1, value: 1 },
      { symbol: "R2", change_pct: -6, value: 1 },
      { symbol: "P1", change_pct: 0.5, value: 999 },
    ];
    const out = buildPowerData(board, { topN: 40, purpleN: 1 });
    expect(out.map((d) => d.symbol)).toEqual(["G2", "G1", "P1", "R2", "R1"]);
  });

  it("loại mục thiếu symbol; value thiếu → 0", () => {
    const board = [
      { change_pct: 5, value: 10 }, // thiếu symbol
      { symbol: "A", change_pct: 1 }, // thiếu value
    ];
    const out = buildPowerData(board, { purpleN: 0 });
    expect(out).toHaveLength(1);
    expect(out[0].symbol).toBe("A");
    expect(out[0].value).toBe(0);
  });

  it("input không phải mảng → []", () => {
    expect(buildPowerData(null)).toEqual([]);
    expect(buildPowerData(undefined)).toEqual([]);
  });
});
