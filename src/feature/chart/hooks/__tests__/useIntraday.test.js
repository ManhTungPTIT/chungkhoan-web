import { describe, it, expect } from "vitest";
import { normalizeCandle } from "../useIntraday";

// Hồi quy cho bug chart trắng: API trả time dạng chuỗi "YYYY-MM-DD"
// trong khi chart.jsx chỉ nhận time kiểu number (unix giây).
describe("normalizeCandle", () => {
  it("chuyển time chuỗi 'YYYY-MM-DD' thành unix giây", () => {
    const out = normalizeCandle({
      time: "2024-11-28",
      open: "1246.37",
      high: "1250.46",
      low: "1240.91",
      close: "1242.11",
    });
    expect(out.time).toBe(Math.floor(Date.UTC(2024, 10, 28) / 1000));
    expect(typeof out.time).toBe("number");
  });

  it("giữ nguyên time đã là unix giây (number)", () => {
    const out = normalizeCandle({ time: 1732752000, close: "1" });
    expect(out.time).toBe(1732752000);
  });

  it("ép OHLC chuỗi thành number", () => {
    const out = normalizeCandle({
      time: "2024-11-28",
      open: "1246.37",
      high: "1250.46",
      low: "1240.91",
      close: "1242.11",
    });
    expect(out.open).toBe(1246.37);
    expect(out.high).toBe(1250.46);
    expect(out.low).toBe(1240.91);
    expect(out.close).toBe(1242.11);
  });
});
