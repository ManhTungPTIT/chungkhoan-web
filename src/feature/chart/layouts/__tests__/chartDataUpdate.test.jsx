import { describe, expect, it, vi } from "vitest";
import { updateChartData } from "../chart.jsx";

describe("updateChartData", () => {
  it("updates the live candle incrementally without reloading the chart data", () => {
    const currentData = [
      { timestamp: 1000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
      { timestamp: 2000, open: 11, high: 13, low: 10, close: 12, volume: 120 },
    ];
    const chart = {
      getDataList: vi.fn(() => currentData),
      updateData: vi.fn(),
      applyNewData: vi.fn(),
      getDrawPaneById: vi.fn(),
      adjustPaneViewport: vi.fn(),
    };

    updateChartData(
      chart,
      [
        { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        { time: 2, open: 11, high: 14, low: 10, close: 13, volume: 130 },
      ],
      ["candle_pane"],
    );

    expect(chart.updateData).toHaveBeenCalledTimes(1);
    expect(chart.updateData).toHaveBeenCalledWith({
      timestamp: 2000,
      open: 11,
      high: 14,
      low: 10,
      close: 13,
      volume: 130,
    });
    expect(chart.applyNewData).not.toHaveBeenCalled();
  });

  it("appends new live candles incrementally without reloading the chart data", () => {
    const chart = {
      getDataList: vi.fn(() => [
        { timestamp: 1000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        { timestamp: 2000, open: 11, high: 13, low: 10, close: 12, volume: 120 },
      ]),
      updateData: vi.fn(),
      applyNewData: vi.fn(),
      getDrawPaneById: vi.fn(),
      adjustPaneViewport: vi.fn(),
    };

    updateChartData(
      chart,
      [
        { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        { time: 2, open: 11, high: 14, low: 10, close: 13, volume: 130 },
        { time: 3, open: 13, high: 15, low: 12, close: 14, volume: 90 },
      ],
      ["candle_pane"],
    );

    expect(chart.updateData).toHaveBeenCalledTimes(2);
    expect(chart.updateData).toHaveBeenNthCalledWith(1, {
      timestamp: 2000,
      open: 11,
      high: 14,
      low: 10,
      close: 13,
      volume: 130,
    });
    expect(chart.updateData).toHaveBeenNthCalledWith(2, {
      timestamp: 3000,
      open: 13,
      high: 15,
      low: 12,
      close: 14,
      volume: 90,
    });
    expect(chart.applyNewData).not.toHaveBeenCalled();
  });

  // Đổi mã: hai chuỗi nến NGÀY của hai mã khác nhau (VNINDEX → ACB) trùng
  // KHÍT timestamp theo từng index (cùng lịch phiên) và cùng độ dài, chỉ khác
  // GIÁ. Không được nhận nhầm là "cùng stream tick" rồi chỉ update nến cuối —
  // phải applyNewData thay toàn bộ, nếu không nến mã cũ còn vẽ đè lên mã mới.
  it("replaces the whole dataset when switching symbols (same timestamps, different prices)", () => {
    const chart = {
      getDataList: vi.fn(() => [
        { timestamp: 1000, open: 1269, high: 1275, low: 1260, close: 1270, volume: 1 },
        { timestamp: 2000, open: 1270, high: 1280, low: 1265, close: 1278, volume: 1 },
        { timestamp: 3000, open: 1278, high: 1290, low: 1276, close: 1288, volume: 1 },
      ]),
      updateData: vi.fn(),
      applyNewData: vi.fn(),
      resize: vi.fn(),
      getDrawPaneById: vi.fn(),
      adjustPaneViewport: vi.fn(),
    };

    updateChartData(
      chart,
      [
        { time: 1, open: 18.4, high: 18.5, low: 18.2, close: 18.4, volume: 1 },
        { time: 2, open: 18.4, high: 18.6, low: 18.1, close: 18.0, volume: 1 },
        { time: 3, open: 18.0, high: 18.2, low: 17.8, close: 17.9, volume: 1 },
      ],
      ["candle_pane"],
    );

    expect(chart.applyNewData).toHaveBeenCalledTimes(1);
    expect(chart.updateData).not.toHaveBeenCalled();
  });
});
