import { describe, it, expect } from "vitest";
import { signalDisplay, isHolding, formatTPlus } from "../signalDisplay";

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

describe("isHolding", () => {
  it("buy + signal_hold=true → true (pha nắm giữ)", () => {
    expect(isHolding({ signal: "buy", signal_hold: true })).toBe(true);
  });

  it("buy + signal_hold=false → false (đúng ngày báo = BUY)", () => {
    expect(isHolding({ signal: "buy", signal_hold: false })).toBe(false);
  });

  it("buy thiếu cờ signal_hold → false", () => {
    expect(isHolding({ signal: "buy" })).toBe(false);
  });

  it("sell dù có signal_hold → false (không phải nắm giữ)", () => {
    expect(isHolding({ signal: "sell", signal_hold: true })).toBe(false);
  });

  it("null / undefined item → false", () => {
    expect(isHolding(null)).toBe(false);
    expect(isHolding(undefined)).toBe(false);
  });
});

describe("formatTPlus", () => {
  it("0 → '-' (chưa có phiên mở sau ngày báo)", () => {
    expect(formatTPlus(0)).toBe("-");
  });

  it("null / undefined → '-'", () => {
    expect(formatTPlus(null)).toBe("-");
    expect(formatTPlus(undefined)).toBe("-");
  });

  it(">=1 → 'T+n'", () => {
    expect(formatTPlus(1)).toBe("T+1");
    expect(formatTPlus(3)).toBe("T+3");
  });

  it("chuỗi số vẫn quy đổi", () => {
    expect(formatTPlus("2")).toBe("T+2");
  });
});
