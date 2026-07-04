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
      "HOLD1",
      "HOLD2",
      "SELL1",
      "SELL2",
      "UNKNOWN",
    ]);
  });
});
