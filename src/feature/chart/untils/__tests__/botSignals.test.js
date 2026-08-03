import { describe, expect, it } from "vitest";
import {
  generateSignals,
  generateSignalsT,
  generateSignalsLong,
} from "../indicators";
import { signalGeneratorForBot, usesBackendPanelSignal } from "../botSignals";

describe("signalGeneratorForBot", () => {
  it("ánh xạ đúng ba BOT trên sidebar", () => {
    expect(signalGeneratorForBot("trend")).toBe(generateSignals);
    expect(signalGeneratorForBot("t")).toBe(generateSignalsT);
    expect(signalGeneratorForBot("long")).toBe(generateSignalsLong);
  });

  it("thiếu bot hoặc bot lạ → BOT Trend", () => {
    expect(signalGeneratorForBot(null)).toBe(generateSignals);
    expect(signalGeneratorForBot(undefined)).toBe(generateSignals);
    expect(signalGeneratorForBot("")).toBe(generateSignals);
    expect(signalGeneratorForBot("khong-ton-tai")).toBe(generateSignals);
  });
});

describe("usesBackendPanelSignal", () => {
  // /vn100 chỉ có tín hiệu của MỘT thuật toán (SMA20 + MACD cross = BOT Trend),
  // payload không có trường bot. Tin nó khi đang xem BOT khác thì đổi bot xong
  // panel đứng yên — đúng lỗi đang sửa.
  it("BOT Trend (kể cả khi thiếu bot / bot lạ) thì dùng panel backend", () => {
    expect(usesBackendPanelSignal("trend")).toBe(true);
    expect(usesBackendPanelSignal(null)).toBe(true);
    expect(usesBackendPanelSignal("")).toBe(true);
    expect(usesBackendPanelSignal("khong-ton-tai")).toBe(true);
  });

  it("BOT T+ và Dài hạn thì KHÔNG dùng panel backend", () => {
    expect(usesBackendPanelSignal("t")).toBe(false);
    expect(usesBackendPanelSignal("long")).toBe(false);
  });

  it("khớp đúng với hàm sinh tín hiệu đang dùng — không có bảng thứ hai để lệch", () => {
    for (const bot of ["trend", "t", "long", null, "", "la-hoac"]) {
      expect(usesBackendPanelSignal(bot)).toBe(
        signalGeneratorForBot(bot) === generateSignals,
      );
    }
  });
});
