import { describe, it, expect } from "vitest";
import { normalizeQuote } from "../normalizeQuote";

describe("normalizeQuote", () => {
  it("ép price/volume chuỗi thành number, giữ time unix", () => {
    const out = normalizeQuote({ price: "12.34", volume: "5000", time: 1751856245 });
    expect(out).toEqual({ price: 12.34, volume: 5000, time: 1751856245 });
  });

  it("time chuỗi ngày giờ → unix giây", () => {
    const out = normalizeQuote({ price: "1", time: "2026-07-07" });
    expect(out.time).toBe(Date.UTC(2026, 6, 7) / 1000);
  });

  it("item thiếu time → dùng fallbackTime của snapshot (ISO có timezone)", () => {
    const out = normalizeQuote({ price: "12" }, "2026-07-07T10:30:00+07:00");
    expect(out.time).toBe(Date.UTC(2026, 6, 7, 3, 30) / 1000);
  });

  it("item có time riêng → thắng fallbackTime", () => {
    const out = normalizeQuote(
      { price: "12", time: 1751856245 },
      "2026-07-07T10:30:00+07:00",
    );
    expect(out.time).toBe(1751856245);
  });

  it("price/time không hợp lệ → null (loại khỏi snapshot)", () => {
    expect(normalizeQuote({ price: "nan", time: 1751856245 })).toBeNull();
    expect(normalizeQuote({ price: "12" })).toBeNull();
    expect(normalizeQuote(null)).toBeNull();
  });

  it("price <= 0 (mã chưa khớp lệnh) → null, không merge low=0 vào nến", () => {
    expect(normalizeQuote({ price: 0, time: 1751856245 })).toBeNull();
    expect(normalizeQuote({ price: "-1", time: 1751856245 })).toBeNull();
  });

  it("volume thiếu/'nan' → bỏ field, không thành NaN", () => {
    const out = normalizeQuote({ price: "12", time: 1751856245, volume: "nan" });
    expect(out).toEqual({ price: 12, time: 1751856245 });
  });
});
