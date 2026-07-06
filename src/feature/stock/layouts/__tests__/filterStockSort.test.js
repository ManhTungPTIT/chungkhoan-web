import { describe, expect, it } from "vitest";
import { sortRowsBySignal } from "../filterStock";

describe("sortRowsBySignal", () => {
  it("groups rows by buy, hold, then sell signal order", () => {
    const rows = [
      { symbol: "SELL1", signal: "sell", signal_sessions: 0 },
      { symbol: "HOLD1", signal: "buy", signal_sessions: 3 },
      { symbol: "BUY1", signal: "buy", signal_sessions: 0 },
      { symbol: "UNKNOWN", signal: null, signal_sessions: null },
      { symbol: "BUY2", signal: "buy", signal_sessions: null },
      { symbol: "SELL2", signal: "sell", signal_sessions: 4 },
      { symbol: "HOLD2", signal: "hold", signal_sessions: 0 },
    ];

    expect(sortRowsBySignal(rows).map((row) => row.symbol)).toEqual([
      "BUY1",
      "BUY2",
      "HOLD2",
      "HOLD1",
      "SELL1",
      "SELL2",
      "UNKNOWN",
    ]);
  });

  it("sorts by signal_sessions ascending within each signal group, nulls last", () => {
    const rows = [
      { symbol: "H3", signal: "hold", signal_sessions: 3 },
      { symbol: "HX", signal: "hold", signal_sessions: null },
      { symbol: "H0", signal: "hold", signal_sessions: 0 },
      { symbol: "H1", signal: "hold", signal_sessions: 1 },
    ];

    expect(sortRowsBySignal(rows).map((row) => row.symbol)).toEqual([
      "H0",
      "H1",
      "H3",
      "HX",
    ]);
  });
});
