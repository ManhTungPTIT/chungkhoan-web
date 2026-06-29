import { describe, it, expect } from "vitest";
import { signalDisplay } from "../signalDisplay";

describe("signalDisplay", () => {
  it('"buy" → BUY / hold', () => {
    expect(signalDisplay("buy")).toEqual({ label: "BUY", className: "hold" });
  });

  it('"sell" → SELL / sell', () => {
    expect(signalDisplay("sell")).toEqual({ label: "SELL", className: "sell" });
  });

  it("null → trung tính (— / neutral), không đoán", () => {
    expect(signalDisplay(null)).toEqual({ label: "—", className: "neutral" });
  });

  it("undefined → trung tính", () => {
    expect(signalDisplay(undefined)).toEqual({ label: "—", className: "neutral" });
  });

  it("chuỗi lạ → trung tính (không nhận nhầm)", () => {
    expect(signalDisplay("hold")).toEqual({ label: "—", className: "neutral" });
  });
});
