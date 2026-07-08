import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { subscribeQuote } from "../../untils/quoteStream";
import { useQuoteStream } from "../useQuoteStream";

vi.mock("../../untils/quoteStream", () => ({ subscribeQuote: vi.fn() }));

describe("useQuoteStream", () => {
  let pushQuote; // callback hook đã đăng ký — test bơm quote qua đây
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = vi.fn();
    vi.mocked(subscribeQuote).mockReset().mockImplementation((symbol, cb) => {
      pushQuote = cb;
      return unsubscribe;
    });
  });

  it("đăng ký theo mã, quote đẩy tới → hook trả quote", () => {
    const { result } = renderHook(() => useQuoteStream("FPT"));
    expect(subscribeQuote).toHaveBeenCalledWith("FPT", expect.any(Function));
    expect(result.current).toBeNull(); // chưa có tick

    act(() => pushQuote({ price: 73.2, time: 1783412345 }));
    expect(result.current).toEqual({ price: 73.2, time: 1783412345 });
  });

  it("mất kết nối (callback null) → hook trả null để caller fallback poll", () => {
    const { result } = renderHook(() => useQuoteStream("FPT"));
    act(() => pushQuote({ price: 73.2, time: 1783412345 }));
    act(() => pushQuote(null));
    expect(result.current).toBeNull();
  });

  it("đổi mã → hủy đăng ký mã cũ, reset quote về null ngay", () => {
    const { result, rerender } = renderHook(({ sym }) => useQuoteStream(sym), {
      initialProps: { sym: "FPT" },
    });
    act(() => pushQuote({ price: 73.2, time: 1783412345 }));
    expect(result.current).not.toBeNull();

    rerender({ sym: "VCB" });
    expect(unsubscribe).toHaveBeenCalled();
    expect(subscribeQuote).toHaveBeenLastCalledWith("VCB", expect.any(Function));
    expect(result.current).toBeNull(); // không hiện giá FPT lên chart VCB
  });

  it("symbol rỗng → không đăng ký, trả null", () => {
    const { result } = renderHook(() => useQuoteStream(""));
    expect(subscribeQuote).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
