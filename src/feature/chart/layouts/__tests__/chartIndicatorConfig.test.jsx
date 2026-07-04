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
            show: false,
            text: expect.objectContaining({ show: false }),
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
        indicatorConfigs={{ RSI: { paramsVersion: 2, params: [21] } }}
      />,
    );

    const paneOptions = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "RSI",
    )[2];
    expect(chart.createIndicator).toHaveBeenCalledWith(
      { name: "RSI", calcParams: [21] },
      false,
      expect.objectContaining({
        dragEnabled: false,
        height: expect.any(Number),
        minHeight: expect.any(Number),
      }),
    );
    expect(paneOptions.height).toBe(paneOptions.minHeight);
  });

  it("creates VOL without volume MA lines", () => {
    const chart = init();

    render(<TradingChart candles={[]} signals={[]} activeKey="VOL" />);

    const paneOptions = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "VOL",
    )[2];
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
        dragEnabled: false,
        height: expect.any(Number),
        minHeight: expect.any(Number),
      }),
    );
    expect(paneOptions.height).toBe(paneOptions.minHeight);
  });

  it("creates VOL directly below the candle pane before other sub indicators", () => {
    const chart = init();

    render(<TradingChart candles={[]} signals={[]} activeKey="RSI,VOL,MACD" />);

    const createdIndicatorNames = chart.createIndicator.mock.calls.map(
      ([indicator]) =>
        typeof indicator === "string" ? indicator : indicator?.name,
    );
    const volIndex = createdIndicatorNames.indexOf("VOL");

    expect(volIndex).toBeGreaterThan(-1);
    expect(volIndex).toBeLessThan(createdIndicatorNames.indexOf("RSI"));
    expect(volIndex).toBeLessThan(createdIndicatorNames.indexOf("MACD"));
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

  it("draws configured step lines with horizontal and vertical segments", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF0000",
                  size: 2,
                  style: "solid",
                  shape: "step",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "step",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF0000",
        size: 2,
        shape: "step",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }, { tenkan: 30 }],
      },
      visibleRange: { from: 0, to: 3 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.moveTo).toHaveBeenCalledWith(0, 10);
    expect(ctx.lineTo.mock.calls).toEqual([
      [10, 10],
      [10, 20],
      [20, 20],
      [20, 30],
    ]);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws configured diamond-step lines with diamond markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "diamond-step",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "diamond-step",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "diamond-step",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.lineTo.mock.calls).toContainEqual([10, 10]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 20]);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws configured frequency lines with vertical stems and circle markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "frequency",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "frequency",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "frequency",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      bounding: { height: 100 },
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.moveTo.mock.calls).toContainEqual([0, 100]);
    expect(ctx.lineTo.mock.calls).toContainEqual([0, 10]);
    expect(ctx.moveTo.mock.calls).toContainEqual([10, 100]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 20]);
    expect(ctx.arc.mock.calls[0]).toEqual([0, 10, 5, 0, Math.PI * 2]);
    expect(ctx.arc.mock.calls[1]).toEqual([10, 20, 5, 0, Math.PI * 2]);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws configured columns as filled bars from the pane bottom", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "columns",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "columns",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "columns",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillRect: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      bounding: { height: 100 },
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.fillStyle).toBe("#FF3344");
    expect(ctx.fillRect.mock.calls[0]).toEqual([-3.8, 10, 7.6, 90]);
    expect(ctx.fillRect.mock.calls[1]).toEqual([6.2, 20, 7.6, 80]);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("draws configured circles as filled point markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "circles",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "circles",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "circles",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.fillStyle).toBe("#FF3344");
    expect(ctx.arc.mock.calls[0]).toEqual([0, 10, 3, 0, Math.PI * 2]);
    expect(ctx.arc.mock.calls[1]).toEqual([10, 20, 3, 0, Math.PI * 2]);
    expect(ctx.fill).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("draws configured cross lines as plus markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "cross",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "cross",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "cross",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.moveTo.mock.calls).toContainEqual([-4, 10]);
    expect(ctx.lineTo.mock.calls).toContainEqual([4, 10]);
    expect(ctx.moveTo.mock.calls).toContainEqual([0, 6]);
    expect(ctx.lineTo.mock.calls).toContainEqual([0, 14]);
    expect(ctx.moveTo.mock.calls).toContainEqual([6, 20]);
    expect(ctx.lineTo.mock.calls).toContainEqual([14, 20]);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws configured area lines with a filled area and circle markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "solid",
                  shape: "area",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "area",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        shape: "area",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      bounding: { height: 100 },
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.moveTo.mock.calls).toContainEqual([0, 10]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 20]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 100]);
    expect(ctx.lineTo.mock.calls).toContainEqual([0, 100]);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.arc.mock.calls[0]).toEqual([0, 10, 5, 0, Math.PI * 2]);
    expect(ctx.arc.mock.calls[1]).toEqual([10, 20, 5, 0, Math.PI * 2]);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws configured area-break lines without circle markers", () => {
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
                {
                  label: "Tenkan",
                  visible: true,
                  color: "#FF3344",
                  size: 2,
                  style: "dashed",
                  shape: "area-break",
                },
              ],
            },
          },
        }}
      />,
    );

    const createValue = chart.createIndicator.mock.calls.find(
      ([indicator]) => indicator?.name === "ICHIMOKU",
    )[0];
    expect(createValue.styles.lines[0]).toEqual(
      expect.objectContaining({
        color: "rgba(0,0,0,0)",
        size: 0,
        shape: "area-break",
      }),
    );
    expect(createValue.extendData.stepLineStyles[0]).toEqual(
      expect.objectContaining({
        color: "#FF3344",
        size: 2,
        style: "dashed",
        shape: "area-break",
      }),
    );

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    };
    createValue.draw({
      ctx,
      bounding: { height: 100 },
      indicator: {
        extendData: createValue.extendData,
        figures: [{ key: "tenkan", type: "line" }],
        result: [{ tenkan: 10 }, { tenkan: 20 }],
      },
      visibleRange: { from: 0, to: 2 },
      xAxis: { convertToPixel: (index) => index * 10 },
      yAxis: { convertToPixel: (value) => value },
    });

    expect(ctx.moveTo.mock.calls).toContainEqual([0, 10]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 20]);
    expect(ctx.lineTo.mock.calls).toContainEqual([10, 100]);
    expect(ctx.lineTo.mock.calls).toContainEqual([0, 100]);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe("rgba(255, 51, 68, 0.62)");
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
