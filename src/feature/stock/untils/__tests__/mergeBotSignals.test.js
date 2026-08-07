import { describe, expect, it } from "vitest";
import { mergeBotSignals } from "../filterStockData";

const ROW = { symbol: "AAA", price: 55000, change_pct: 1.2, signal: "buy", signal_date: "2026-08-01", signal_price: 50, signal_sessions: 3, signal_hold: true, signal_stale: false };

const OVERLAY = {
  AAA: { signal: "sell", date: "2026-08-03", price: 54.2, sessions: 0, hold: false, stale: true },
};

describe("mergeBotSignals", () => {
  it("trả NGUYÊN rows khi bot là trend — 6 field phẳng của /vn100 đã là Trend", () => {
    const rows = [ROW];
    expect(mergeBotSignals(rows, OVERLAY, "trend")).toBe(rows);
  });

  it("đổi tên khoá của lớp phủ về đúng shape signal_* mà tầng dưới đang nhận", () => {
    const [row] = mergeBotSignals([ROW], OVERLAY, "t");

    expect(row.signal).toBe("sell");
    expect(row.signal_date).toBe("2026-08-03");
    expect(row.signal_price).toBe(54.2);
    expect(row.signal_sessions).toBe(0);
    expect(row.signal_hold).toBe(false);
    expect(row.signal_stale).toBe(true);
  });

  it("giữ nguyên các cột không thuộc tín hiệu", () => {
    const [row] = mergeBotSignals([ROW], OVERLAY, "t");

    expect(row.symbol).toBe("AAA");
    expect(row.price).toBe(55000);
    expect(row.change_pct).toBe(1.2);
  });

  it("mã vắng trong lớp phủ → mọi field tín hiệu về rỗng, KHÔNG giữ lại số của Trend", () => {
    const [row] = mergeBotSignals([ROW], {}, "t");

    expect(row.signal).toBeNull();
    expect(row.signal_date).toBeNull();
    expect(row.signal_price).toBeNull();
    expect(row.signal_sessions).toBeNull();
    expect(row.signal_hold).toBe(false);
    expect(row.signal_stale).toBe(false);
  });

  it("lớp phủ chưa về (undefined) → xử như rỗng, không ném", () => {
    expect(() => mergeBotSignals([ROW], undefined, "t")).not.toThrow();
    expect(mergeBotSignals([ROW], undefined, "t")[0].signal).toBeNull();
  });

  it("không sửa row gốc", () => {
    const row = { ...ROW };
    mergeBotSignals([row], OVERLAY, "t");
    expect(row.signal).toBe("buy");
  });
});
