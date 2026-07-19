import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { subscribeConnectionStatus } from "../../untils/quoteStream";
import { useQuoteConnectionStatus } from "../useQuoteConnectionStatus";

vi.mock("../../untils/quoteStream", () => ({ subscribeConnectionStatus: vi.fn() }));

describe("useQuoteConnectionStatus", () => {
  let pushStatus;
  let unsubscribe;

  beforeEach(() => {
    vi.useFakeTimers();
    unsubscribe = vi.fn();
    vi.mocked(subscribeConnectionStatus).mockReset().mockImplementation((cb) => {
      pushStatus = cb;
      return unsubscribe;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mặc định false (chưa báo lỗi) dù trạng thái ban đầu là false", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    expect(result.current).toBe(false); // chưa đủ 5s
  });

  it("mất kết nối ĐỦ 5s liên tục → true", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(true);
  });

  it("nối lại TRƯỚC 5s → không bao giờ báo lỗi", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(3000));
    act(() => pushStatus(true));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(false);
  });

  it("đã báo lỗi rồi, nối lại → reset về false ngay", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(true);

    act(() => pushStatus(true));
    expect(result.current).toBe(false);
  });

  it("unmount → hủy đăng ký", () => {
    const { unmount } = renderHook(() => useQuoteConnectionStatus());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
