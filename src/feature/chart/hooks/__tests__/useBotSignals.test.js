import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { fetchBotSignals, useBotSignals } from "../useBotSignals";

vi.mock("axios");

const wrapper = ({ children }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
};

describe("fetchBotSignals", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { bot: "t", generated_at: 1, data: { AAA: { signal: "buy" } } },
    });
  });

  it("gửi bot lên /signals", async () => {
    await fetchBotSignals("t");
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/signals"), {
      params: { bot: "t" },
    });
  });

  it("trả thẳng khối data khoá theo mã, không bọc thêm tầng nào", async () => {
    expect(await fetchBotSignals("t")).toEqual({ AAA: { signal: "buy" } });
  });

  it("payload thiếu data → {} chứ không undefined (merge phía sau không phải chắn null)", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    expect(await fetchBotSignals("t")).toEqual({});
  });
});

describe("useBotSignals", () => {
  beforeEach(() => {
    // Số lần gọi cộng dồn qua các test nếu không dọn — hai ca dưới đều ĐẾM nên
    // thiếu dòng này là chúng đọc nhầm request của describe phía trên.
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({
      data: { bot: "long", generated_at: 1, data: { BBB: { signal: "sell" } } },
    });
  });

  it("KHÔNG gọi mạng khi bot là trend — /vn100 đã mang sẵn tín hiệu Trend", async () => {
    const { result } = renderHook(() => useBotSignals("trend"), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("gọi mạng cho bot khác trend", async () => {
    const { result } = renderHook(() => useBotSignals("long"), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ BBB: { signal: "sell" } }));
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
