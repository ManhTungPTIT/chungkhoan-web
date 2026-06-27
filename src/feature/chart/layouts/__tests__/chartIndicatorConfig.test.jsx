import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TradingChart from "../chart";
import { init } from "klinecharts/dist/index.esm.js";

vi.mock("klinecharts/dist/index.esm.js", () => {
  const chart = {
    setStyles: vi.fn(),
    applyNewData: vi.fn(),
    createIndicator: vi.fn(),
    createOverlay: vi.fn(),
    resize: vi.fn(),
    getDom: vi.fn(),
  };

  return {
    DomPosition: { YAxis: "yAxis" },
    dispose: vi.fn(),
    init: vi.fn(() => chart),
    registerIndicator: vi.fn(),
    registerOverlay: vi.fn(),
  };
});

global.ResizeObserver = class {
  observe = vi.fn();
  disconnect = vi.fn();
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TradingChart indicator config", () => {
  it("uses configured params when creating EMA", () => {
    const chart = init();

    render(
      <TradingChart
        candles={[]}
        signals={[]}
        activeKey="EMA"
        indicatorConfigs={{ EMA: { params: [5, 13] } }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "EMA",
        calcParams: [5, 13],
      }),
      true,
      { id: "candle_pane" },
    );
  });

  it("uses configured params when creating a built-in indicator", () => {
    const chart = init();

    render(
      <TradingChart
        candles={[]}
        signals={[]}
        activeKey="RSI"
        indicatorConfigs={{ RSI: { params: [21] } }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      { name: "RSI", calcParams: [21, 12, 24] },
      false,
    );
  });

  it("uses configured params when creating Ichimoku on the candle pane", () => {
    const chart = init();

    render(
      <TradingChart
        candles={[]}
        signals={[]}
        activeKey="ICHIMOKU"
        indicatorConfigs={{ ICHIMOKU: { params: [7, 22, 44, 22] } }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      { name: "ICHIMOKU", calcParams: [7, 22, 44, 22] },
      true,
      { id: "candle_pane" },
    );
  });

  it("passes configured line styles when creating an indicator", () => {
    const chart = init();

    render(
      <TradingChart
        candles={[]}
        signals={[]}
        activeKey="ICHIMOKU"
        indicatorConfigs={{
          ICHIMOKU: {
            params: [9, 26, 52, 26],
            styles: {
              lines: [
                { visible: false, color: "#2962FF", size: 1, style: "solid" },
                { visible: true, color: "#B71C1C", size: 2, style: "dashed" },
              ],
            },
          },
        }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ICHIMOKU",
        styles: expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({
              color: "rgba(0,0,0,0)",
              size: 0,
              style: "solid",
            }),
            expect.objectContaining({
              color: "#B71C1C",
              size: 2,
              style: "dashed",
            }),
          ]),
        }),
      }),
      true,
      { id: "candle_pane" },
    );
  });
});
