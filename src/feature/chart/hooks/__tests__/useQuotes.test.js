import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import axios from "axios";
import { fetchQuotes } from "../useQuotes";
import { useLiveCandles } from "../useLiveCandles";

vi.mock("axios");

describe("fetchQuotes", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it("gọi /quotes và trả map symbol (uppercase) → quote đã normalize", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        data: {
          aaa: { price: "10.5", volume: "100", time: 1751856245 },
          BBB: { price: "20", time: 1751856245 },
          BAD: { price: "nan", time: 1751856245 },
        },
      },
    });
    const out = await fetchQuotes();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/quotes"));
    expect(out).toEqual({
      AAA: { price: 10.5, volume: 100, time: 1751856245 },
      BBB: { price: 20, time: 1751856245 },
    });
  });

  it("payload BE thật: time snapshot ở ngoài, item không có time → vẫn nhận đủ", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        time: "2026-07-07T10:30:00+07:00",
        data: {
          AAA: { price: 62.9, volume: 1500000 },
          VNINDEX: { price: 1280.5, volume: 890000000 },
          CHUAKHOP: { price: 0, volume: 0 },
        },
      },
    });
    const snapshotUnix = Date.UTC(2026, 6, 7, 3, 30) / 1000;
    expect(await fetchQuotes()).toEqual({
      AAA: { price: 62.9, volume: 1500000, time: snapshotUnix },
      VNINDEX: { price: 1280.5, volume: 890000000, time: snapshotUnix },
    });
  });

  it("payload thiếu data → map rỗng, không crash", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    expect(await fetchQuotes()).toEqual({});
  });
});

describe("useLiveCandles", () => {
  const T0 = Date.UTC(2026, 6, 7) / 1000; // nến ngày 07/07
  const tick = (price, offsetSec) => ({
    price,
    time: Date.UTC(2026, 6, 7, 3, 0, offsetSec) / 1000,
  });
  const base = [
    { time: T0, open: 100, high: 100, low: 100, close: 100, volume: 0 },
  ];

  it("không có quote → trả nguyên lịch sử", () => {
    const { result } = renderHook(() => useLiveCandles(base, null, "AAA", "1d"));
    expect(result.current).toBe(base);
  });

  it("merge quote vào nến cuối và GIỮ kết quả qua các tick sau", () => {
    const { result, rerender } = renderHook(
      ({ quote }) => useLiveCandles(base, quote, "AAA", "1d"),
      { initialProps: { quote: tick(105, 0) } },
    );
    expect(result.current[0].close).toBe(105);
    expect(result.current[0].high).toBe(105);

    // Tick sau giá tụt: high 105 phải được giữ (tích luỹ, không tính lại từ base)
    rerender({ quote: tick(101, 10) });
    expect(result.current[0].close).toBe(101);
    expect(result.current[0].high).toBe(105);
  });

  it("đổi mã (symbol) → reset về lịch sử mới, bỏ nến đã merge của mã cũ", () => {
    const baseBBB = [
      { time: T0, open: 50, high: 50, low: 50, close: 50, volume: 0 },
    ];
    const { result, rerender } = renderHook(
      ({ candles, quote, sym }) => useLiveCandles(candles, quote, sym, "1d"),
      { initialProps: { candles: base, quote: tick(105, 0), sym: "AAA" } },
    );
    expect(result.current[0].close).toBe(105);

    rerender({ candles: baseBBB, quote: null, sym: "BBB" });
    expect(result.current).toBe(baseBBB);
  });

  it("lịch sử refetch (đổi reference) → lấy lịch sử mới làm gốc", () => {
    const { result, rerender } = renderHook(
      ({ candles, quote }) => useLiveCandles(candles, quote, "AAA", "1d"),
      { initialProps: { candles: base, quote: tick(105, 0) } },
    );
    expect(result.current[0].close).toBe(105);

    const refreshed = [
      { time: T0, open: 100, high: 106, low: 99, close: 106, volume: 0 },
    ];
    rerender({ candles: refreshed, quote: null });
    expect(result.current).toBe(refreshed);
  });

  it("candles undefined (đang tải lần đầu) → mảng rỗng ổn định", () => {
    const { result } = renderHook(() =>
      useLiveCandles(undefined, tick(105, 0), "AAA", "1d"),
    );
    expect(result.current).toEqual([]);
  });
});
