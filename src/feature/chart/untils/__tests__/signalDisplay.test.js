import { describe, it, expect } from "vitest";
import { signalDisplay } from "../signalDisplay";

describe("signalDisplay", () => {
  it('"buy" → Mua / hold', () => {
    expect(signalDisplay("buy")).toEqual({ label: "Mua", className: "hold" });
  });

  it('"sell" → Bán / sell', () => {
    expect(signalDisplay("sell")).toEqual({ label: "Bán", className: "sell" });
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
