import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { normalizeCandle, fetchIntraday } from "../useIntraday";

vi.mock("axios");

describe("fetchIntraday", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } });
  });

  it("gửi cả symbol và interval lên API", async () => {
    await fetchIntraday("TCB", "1h");
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/intraday"),
      { params: { symbol: "TCB", interval: "1h" } },
    );
  });

  it("mặc định interval là 1d", async () => {
    await fetchIntraday("VNINDEX");
    expect(axios.get).toHaveBeenCalledWith(expect.any(String), {
      params: { symbol: "VNINDEX", interval: "1d" },
    });
  });

  // Hồi quy: vnstock pad nến giờ nghỉ/lễ bằng "nan" → Number("nan")=NaN.
  // Một nến NaN làm hỏng thang giá klinecharts → chart trắng. Phải lọc bỏ.
  it("loại nến có OHLC không hợp lệ (nan)", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        data: [
          { time: "2026-06-15", open: "1", high: "1.1", low: "0.9", close: "1" },
          { time: "2026-06-15 11:30:00", open: "nan", high: "nan", low: "nan", close: "nan" },
          { time: "2026-06-16", open: "2", high: "2.2", low: "1.8", close: "2.1" },
        ],
      },
    });
    const out = await fetchIntraday("TCB", "5m");
    expect(out).toHaveLength(2);
    expect(out.every((c) => Number.isFinite(c.open) && Number.isFinite(c.high) &&
      Number.isFinite(c.low) && Number.isFinite(c.close))).toBe(true);
  });
});

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

  it("ép volume chuỗi thành number (cho biểu đồ Volume)", () => {
    const out = normalizeCandle({ time: "2024-11-28", close: "1", volume: "12345" });
    expect(out.volume).toBe(12345);
  });

  it("volume thiếu/'nan' → 0 (không vẽ cột rác)", () => {
    expect(normalizeCandle({ time: "2024-11-28", close: "1", volume: "nan" }).volume).toBe(0);
    expect(normalizeCandle({ time: "2024-11-28", close: "1" }).volume).toBe(0);
  });
});
