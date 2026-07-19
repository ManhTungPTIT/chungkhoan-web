import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLiveCandles } from "../useLiveCandles";
import { bucketStart } from "../../untils/liveCandle";

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

  it("undefined → mảng rỗng ổn định; sau đó candles = [] (tải xong) → seed nến từ quote", () => {
    const quoteTick = tick(105, 0);
    const { result, rerender } = renderHook(
      ({ candles, quote }) => useLiveCandles(candles, quote, "AAA", "1d"),
      { initialProps: { candles: undefined, quote: quoteTick } },
    );
    // Phase 1: candles undefined (đang tải) → mảng rỗng ổn định, quote không được merge
    expect(result.current).toEqual([]);

    // Phase 2: candles = [] (tải xong, genuinely rỗng) → quote được merge, tạo nến mới
    rerender({ candles: [], quote: quoteTick });
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      open: 105,
      high: 105,
      low: 105,
      close: 105,
      volume: 0,
    });
    // Verify time using bucketStart
    expect(result.current[0].time).toBe(bucketStart(quoteTick.time, "1d"));
  });
});
