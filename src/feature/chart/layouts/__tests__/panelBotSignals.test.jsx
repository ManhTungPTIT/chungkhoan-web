// Panel bên màn biểu đồ có cùng khiếm khuyết mà trang bộ lọc vừa sửa: nó đọc
// `dataPanel` từ /vn100, mà /vn100 chỉ mang tín hiệu của BOT Trend. Đổi sang
// BOT T+ thì cột TÍN HIỆU / GIÁ BÁO / T+ của MỌI mã vẫn là số của Trend.
//
// Test đặt ở tầng TradingView chứ không phải tầng Panel: Panel vốn đã hiển thị
// đúng thứ nó được đưa: chỗ hỏng là index.jsx đưa cho nó mảng chưa đắp lớp phủ.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// jsdom không có ResizeObserver; TradingView dùng nó để đo chiều cao khối info.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const useVn100 = vi.fn();
const useBotSignals = vi.fn();

vi.mock("../../hooks/useVn100", () => ({ useVn100: (...a) => useVn100(...a) }));
vi.mock("../../hooks/useBotSignals", () => ({
  useBotSignals: (...a) => useBotSignals(...a),
}));
vi.mock("../../hooks/useIntraday", () => ({
  useIntraday: () => ({ data: [], isFetching: false, isPlaceholderData: false, isError: false }),
}));
vi.mock("../../hooks/useQuoteStream", () => ({ useQuoteStream: () => null }));
vi.mock("../../hooks/useLiveCandles", () => ({ useLiveCandles: () => [] }));
vi.mock("../../hooks/useQuoteConnectionStatus", () => ({
  useQuoteConnectionStatus: () => false,
}));
// Biểu đồ thật kéo theo klinecharts + canvas — không liên quan việc này.
vi.mock("../chart", () => ({ default: () => <div /> }));
vi.mock("../TimelineStock", () => ({ default: () => <div /> }));
vi.mock("../IndicatorPicker", () => ({ default: () => <div /> }));
vi.mock("../DataStatusBanner", () => ({ default: () => <div /> }));

import TradingView from "../../index";

const ROW = {
  symbol: "AAA",
  price: 55000,
  change_pct: 1,
  signal: "buy",
  signal_date: "2026-08-01",
  signal_price: 50,
  signal_sessions: 3,
  signal_hold: true,
};

const cells = () =>
  Array.from(document.querySelectorAll("tbody tr td")).map((td) => td.textContent);

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <TradingView />
    </MemoryRouter>,
  );

describe("Panel bám bot đang chọn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useVn100.mockReturnValue({ data: [ROW] });
    useBotSignals.mockReturnValue({ data: undefined });
  });

  it("trend → giữ nguyên số của /vn100, không hỏi lớp phủ", () => {
    renderAt("/?bot=trend");

    expect(useBotSignals).toHaveBeenCalledWith("trend");
    expect(cells()).toContain("50");
    expect(cells()).toContain("T+3");
  });

  it("bot=t → panel lấy giá báo và số phiên của LỚP PHỦ", () => {
    useBotSignals.mockReturnValue({
      data: {
        AAA: { signal: "sell", date: "2026-08-03", price: 54.2, sessions: 0, hold: false, stale: false },
      },
    });

    renderAt("/?bot=t");

    expect(useBotSignals).toHaveBeenCalledWith("t");
    expect(cells()).toContain("54.2");
    expect(cells()).toContain("T+0");
    expect(cells()).not.toContain("50");
  });

  it("bot=t mà lớp phủ chưa có mã → không mượn số của Trend", () => {
    useBotSignals.mockReturnValue({ data: {} });

    renderAt("/?bot=t");

    expect(cells()).not.toContain("50");
    expect(cells()).not.toContain("T+3");
  });
});
