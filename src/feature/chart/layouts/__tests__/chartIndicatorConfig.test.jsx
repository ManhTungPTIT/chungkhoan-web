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
  it("hides grid and axes while keeping pane separators draggable", () => {
    const chart = init();

    render(<TradingChart candles={[]} signals={[]} />);

    const styles = chart.setStyles.mock.calls[0][0];

    expect(chart.setStyles).toHaveBeenCalledWith(
      expect.objectContaining({
        grid: expect.objectContaining({
          show: false,
          horizontal: expect.objectContaining({ show: false }),
          vertical: expect.objectContaining({ show: false }),
        }),
        xAxis: expect.objectContaining({
          axisLine: expect.objectContaining({ show: false }),
          tickLine: expect.objectContaining({ show: false }),
        }),
        yAxis: expect.objectContaining({
          axisLine: expect.objectContaining({ show: false }),
          tickLine: expect.objectContaining({ show: false }),
        }),
        indicator: expect.objectContaining({
          lastValueMark: expect.objectContaining({
            show: true,
            text: expect.objectContaining({ show: true }),
          }),
        }),
        separator: expect.objectContaining({
          color: "transparent",
          fill: false,
          activeBackgroundColor: expect.any(String),
        }),
        crosshair: expect.objectContaining({
          show: true,
          horizontal: expect.objectContaining({
            line: expect.objectContaining({ show: true }),
            text: expect.objectContaining({ show: true }),
          }),
          vertical: expect.objectContaining({
            line: expect.objectContaining({ show: true }),
            text: expect.objectContaining({ show: true }),
          }),
        }),
      }),
    );
    expect(styles.separator.size).toBeGreaterThan(0);
  });

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
      expect.objectContaining({
        dragEnabled: true,
        height: expect.any(Number),
        minHeight: expect.any(Number),
      }),
    );
  });

  it("creates VOL without volume MA lines", () => {
    const chart = init();

    render(<TradingChart candles={[]} signals={[]} activeKey="VOL" />);

    expect(chart.createIndicator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "VOL",
        calcParams: [],
        styles: expect.objectContaining({
          tooltip: { showRule: "follow_cross" },
        }),
      }),
      false,
      expect.objectContaining({
        dragEnabled: true,
        height: expect.any(Number),
        minHeight: expect.any(Number),
      }),
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
      expect.objectContaining({
        name: "ICHIMOKU",
        calcParams: [7, 22, 44, 22, 26],
        extendData: {
          cloud: { visible: true, colors: ["#26A69A", "#EF5350"] },
        },
      }),
      true,
      { id: "candle_pane" },
    );
  });

  it("passes configured cloud fill colors to Ichimoku via extendData", () => {
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
              fills: [
                { visible: true, colors: ["#112233", "#445566"] },
              ],
            },
          },
        }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ICHIMOKU",
        extendData: {
          cloud: { visible: true, colors: ["#112233", "#445566"] },
        },
      }),
      true,
      { id: "candle_pane" },
    );
  });

  it("uses a dynamic MA period list when creating MA", () => {
    const chart = init();

    render(
      <TradingChart
        candles={[]}
        signals={[]}
        activeKey="MA"
        indicatorConfigs={{ MA: { params: [5, 10, 20, 50] } }}
      />,
    );

    expect(chart.createIndicator).toHaveBeenCalledWith(
      { name: "MA", calcParams: [5, 10, 20, 50] },
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
