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

// ─── Tiêu chí "đột biến dòng tiền so với TB20" (surgeData.js) ───────────────
// Mọi test dưới đây chốt thời điểm 14:30 giờ VN → tỉ lệ kỳ vọng 100%, để nền so
// sánh đúng bằng avg_value_20 và số học đọc thẳng ra được.
describe("buildPowerData + đột biến dòng tiền", () => {
  const NOW = new Date(Date.UTC(2026, 7, 4, 14 - 7, 30)); // 14:30 giờ VN

  it("tím chọn theo ĐIỂM đột biến, không theo value thô", () => {
    const board = [
      // value lớn nhất nhưng chỉ chạy nửa nhịp thường ngày
      { symbol: "BIG", change_pct: 2, value: 100e9, avg_value_20: 200e9 },
      // value nhỏ hơn nhưng gấp 3 lần nhịp thường ngày
      { symbol: "SURGE", change_pct: 2, value: 30e9, avg_value_20: 10e9 },
    ];
    const out = buildPowerData(board, { purpleN: 1, now: NOW });
    const bySym = Object.fromEntries(out.map((d) => [d.symbol, d]));
    expect(bySym.SURGE.category).toBe("purple");
    expect(bySym.BIG.category).toBe("green"); // công thức cũ sẽ cho BIG tím
  });

  it("gắn % đột biến vào từng dòng cho tooltip", () => {
    const board = [
      { symbol: "A", change_pct: 1, value: 30e9, avg_value_20: 10e9 },
    ];
    expect(buildPowerData(board, { purpleN: 0, now: NOW })[0].surge).toBe(300);
  });

  it("xếp trong cung theo điểm đột biến, không theo |pct|", () => {
    const board = [
      { symbol: "A", change_pct: 5, value: 50e9, avg_value_20: 25e9 }, // ratio 2
      { symbol: "B", change_pct: 9, value: 10e9, avg_value_20: 20e9 }, // ratio 0.5
    ];
    const out = buildPowerData(board, { purpleN: 0, now: NOW });
    // B biên độ lớn hơn nhưng dòng tiền hụt → xếp sau
    expect(out.map((d) => d.symbol)).toEqual(["A", "B"]);
  });

  it("áp đồng nhất cả cung ĐỎ: mã giảm kèm tiền đột biến xếp trước mã giảm sâu", () => {
    const board = [
      { symbol: "R1", change_pct: -2, value: 60e9, avg_value_20: 20e9 }, // ratio 3
      { symbol: "R2", change_pct: -8, value: 5e9, avg_value_20: 5e9 }, // ratio 1
    ];
    const out = buildPowerData(board, { purpleN: 0, now: NOW });
    expect(out.map((d) => d.category)).toEqual(["red", "red"]);
    expect(out.map((d) => d.symbol)).toEqual(["R1", "R2"]);
  });

  it("mã thiếu avg_value_20 xếp cuối cung dù |pct| lớn hơn", () => {
    const board = [
      { symbol: "OK", change_pct: 1, value: 50e9, avg_value_20: 25e9 },
      { symbol: "NOAVG", change_pct: 9, value: 90e9 }, // |pct| và value đều lớn hơn
    ];
    // purpleN 0 để cả hai cùng cung xanh — đo đúng thứ tự TRONG cung, không bị
    // thứ tự cung (xanh trước tím) lấn át.
    const out = buildPowerData(board, { purpleN: 0, now: NOW });
    expect(out.map((d) => d.symbol)).toEqual(["OK", "NOAVG"]);
    expect(out[1].surge).toBe(null);
  });

  it("mã thiếu avg_value_20 không vào tím", () => {
    const board = [
      { symbol: "OK", change_pct: 1, value: 50e9, avg_value_20: 25e9 },
      { symbol: "NOAVG", change_pct: 9, value: 90e9 },
    ];
    const bySym = Object.fromEntries(
      buildPowerData(board, { purpleN: 1, now: NOW }).map((d) => [d.symbol, d]),
    );
    expect(bySym.OK.category).toBe("purple");
    expect(bySym.NOAVG.category).toBe("green");
  });

  it("nền dưới sàn 1 tỷ bị bỏ qua — penny không cướp suất tím", () => {
    const board = [
      { symbol: "THIN", change_pct: 1, value: 5e9, avg_value_20: 5e8 }, // ratio 10 nhưng nền 0,5 tỷ
      { symbol: "REAL", change_pct: 1, value: 20e9, avg_value_20: 10e9 },
    ];
    const out = buildPowerData(board, { purpleN: 1, now: NOW });
    const bySym = Object.fromEntries(out.map((d) => [d.symbol, d]));
    expect(bySym.REAL.category).toBe("purple");
    expect(bySym.THIN.surge).toBe(null);
  });

  // Hai test degrade dưới đây là lý do tiêu chí mới an toàn để bật mặc định.
  it("không mã nào có avg (BE chưa warm nến) → trùng khít công thức cũ", () => {
    const board = [
      { symbol: "A", change_pct: 2, value: 10e9 },
      { symbol: "B", change_pct: 5, value: 90e9 },
      { symbol: "C", change_pct: -3, value: 50e9 },
    ];
    expect(buildPowerData(board, { purpleN: 1, now: NOW })).toEqual(
      buildPowerData(board, { purpleN: 1, now: NOW, useSurge: false }),
    );
  });

  it("useSurge: false → bỏ qua avg, quay về xếp theo |pct| và value", () => {
    const board = [
      { symbol: "A", change_pct: 5, value: 50e9, avg_value_20: 25e9 },
      { symbol: "B", change_pct: 9, value: 10e9, avg_value_20: 20e9 },
    ];
    const out = buildPowerData(board, {
      purpleN: 0,
      now: NOW,
      useSurge: false,
    });
    expect(out.map((d) => d.symbol)).toEqual(["B", "A"]); // |pct| giảm dần
    expect(out[0].surge).toBe(null);
  });
});
