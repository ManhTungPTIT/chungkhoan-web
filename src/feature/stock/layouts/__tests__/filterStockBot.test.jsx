// Trang bộ lọc phải bám BOT đang chọn. Trước thay đổi này bảng LUÔN là Trend:
// FilterStockPage đọc /vn100, mà /vn100 chỉ mang một thuật toán — người dùng
// đang xem BOT T+ bấm sang Bộ lọc vẫn thấy số của Trend, không gì báo.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useVn100 = vi.fn();
const useBotSignals = vi.fn();

vi.mock("../../../chart/hooks/useVn100", () => ({ useVn100: (...a) => useVn100(...a) }));
vi.mock("../../../chart/hooks/useBotSignals", () => ({
  useBotSignals: (...a) => useBotSignals(...a),
}));
vi.mock("../../hooks/useSector", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/useSectorSymbol", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/useAutoPageSize", () => ({ useAutoPageSize: () => 20 }));

import FilterStockPage from "../FilterStockPage";

// Mã đang ở pha "Nắm giữ" theo Trend (buy đã qua ngày báo).
const TREND_ROW = {
  symbol: "AAA",
  price: 55000,
  change_pct: 1.0,
  signal: "buy",
  signal_date: "2026-08-01",
  signal_price: 50,
  signal_sessions: 3,
  signal_hold: true,
  signal_stale: false,
};

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <FilterStockPage />
    </MemoryRouter>,
  );

// Nhãn pha xuất hiện ở HAI chỗ: thẻ thống kê phía trên và badge trong bảng.
// Chỉ badge mới nói lên dòng đó đang ở pha nào — phải trỏ đúng nó.
const badges = () =>
  Array.from(document.querySelectorAll(".badge")).map((el) => el.textContent);

describe("FilterStockPage bám bot đang chọn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useVn100.mockReturnValue({ data: [TREND_ROW], dataUpdatedAt: 0 });
    useBotSignals.mockReturnValue({ data: undefined });
  });

  it("bot=trend → dùng thẳng 6 field phẳng của /vn100, không hỏi lớp phủ", () => {
    renderAt("/chart/filter?bot=trend");

    expect(useBotSignals).toHaveBeenCalledWith("trend");
    expect(badges()).toEqual(["Nắm giữ"]);
  });

  it("bot=t → bảng hiện tín hiệu của LỚP PHỦ, không phải của Trend", () => {
    useBotSignals.mockReturnValue({
      data: {
        AAA: {
          signal: "sell",
          date: "2026-08-01",
          price: 54,
          sessions: 4,
          hold: false,
          stale: false,
        },
      },
    });

    renderAt("/chart/filter?bot=t");

    expect(useBotSignals).toHaveBeenCalledWith("t");
    expect(badges()).toEqual(["Đứng ngoài"]);
  });

  it("bot=t mà lớp phủ chưa có mã → badge '--', KHÔNG mượn số của Trend", () => {
    useBotSignals.mockReturnValue({ data: {} });

    renderAt("/chart/filter?bot=t");

    expect(badges()).toEqual(["--"]);
  });
});
