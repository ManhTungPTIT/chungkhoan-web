import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TradingChart from "../chart";
import { DomPosition, init } from "klinecharts/dist/index.esm.js";

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
    DomPosition: {
      Main: "main",
      YAxis: "yAxis",
    },
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
  vi.useRealTimers();
  cleanup();
  vi.clearAllMocks();
});

describe("TradingChart mobile Y-axis zoom", () => {
  it("enables touch handling on the candle pane price axis", () => {
    const chart = init();
    const yAxisElement = document.createElement("div");
    const addEventListenerSpy = vi.spyOn(yAxisElement, "addEventListener");
    chart.getDom.mockImplementation((paneId, position) => {
      if (paneId === "candle_pane" && position === DomPosition.YAxis) {
        return yAxisElement;
      }
      return null;
    });

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="" />,
    );

    expect(chart.getDom).toHaveBeenCalledWith("candle_pane", DomPosition.YAxis);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      expect.objectContaining({ passive: false }),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
      expect.objectContaining({ passive: false }),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
    );
  });

  it("enables touch handling on an indicator pane price axis", () => {
    const chart = init();
    chart.createIndicator.mockImplementation((indicator) => {
      if (indicator?.name === "VOL") return "vol_pane";
      return "candle_pane";
    });
    const yAxisElements = {
      candle_pane: document.createElement("div"),
      vol_pane: document.createElement("div"),
    };
    const volAddEventListenerSpy = vi.spyOn(
      yAxisElements.vol_pane,
      "addEventListener",
    );
    chart.getDom.mockImplementation((paneId, position) => {
      if (position === DomPosition.YAxis) return yAxisElements[paneId] ?? null;
      return null;
    });

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="VOL" />,
    );

    expect(chart.getDom).toHaveBeenCalledWith("vol_pane", DomPosition.YAxis);
    expect(volAddEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      expect.objectContaining({ passive: false }),
    );
    expect(volAddEventListenerSpy).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
      expect.objectContaining({ passive: false }),
    );
    expect(volAddEventListenerSpy).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
    );
  });

  it("marks translated mouse events as non-touch generated", () => {
    const chart = init();
    const yAxisElement = document.createElement("div");
    const addEventListenerSpy = vi.spyOn(yAxisElement, "addEventListener");
    chart.getDom.mockImplementation((paneId, position) => {
      if (paneId === "candle_pane" && position === DomPosition.YAxis) {
        return yAxisElement;
      }
      return null;
    });
    const mouseDownSpy = vi.fn();
    yAxisElement.addEventListener("mousedown", mouseDownSpy);

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="" />,
    );

    const touchStartHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchstart",
    )[1];
    const touch = {
      identifier: 1,
      clientX: 30,
      clientY: 120,
      screenX: 30,
      screenY: 120,
    };
    touchStartHandler({
      touches: [touch],
      changedTouches: [touch],
      preventDefault: vi.fn(),
    });

    expect(mouseDownSpy).toHaveBeenCalledTimes(1);
    expect(mouseDownSpy.mock.calls[0][0].sourceCapabilities).toEqual({
      firesTouchEvents: false,
    });
  });

  it("zooms an indicator pane vertically with a two-finger pinch", () => {
    const chart = init();
    chart.createIndicator.mockImplementation((indicator) => {
      if (indicator?.name === "VOL") return "vol_pane";
      return "candle_pane";
    });

    const mainElements = {
      candle_pane: document.createElement("div"),
      vol_pane: document.createElement("div"),
    };
    Object.defineProperty(mainElements.vol_pane, "clientHeight", {
      value: 200,
    });

    const addEventListenerSpy = vi.spyOn(
      mainElements.vol_pane,
      "addEventListener",
    );
    const setRange = vi.fn();
    const axis = {
      getRange: vi.fn(() => ({
        from: 0,
        to: 100,
        range: 100,
        realFrom: 0,
        realTo: 100,
      })),
      convertToRealValue: vi.fn((value) => value),
      setRange,
    };

    chart.getDom.mockImplementation((paneId, position) => {
      if (position === DomPosition.Main) return mainElements[paneId] ?? null;
      if (position === DomPosition.YAxis) return document.createElement("div");
      return null;
    });
    chart.getDrawPaneById = vi.fn(() => ({
      getAxisComponent: () => axis,
    }));
    chart.adjustPaneViewport = vi.fn();

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="VOL" />,
    );

    const touchStartHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchstart",
    )[1];
    const touchMoveHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchmove",
    )[1];

    touchStartHandler({
      touches: [
        { identifier: 1, clientX: 20, clientY: 50 },
        { identifier: 2, clientX: 20, clientY: 150 },
      ],
      changedTouches: [],
      preventDefault: vi.fn(),
    });
    touchMoveHandler({
      touches: [
        { identifier: 1, clientX: 20, clientY: 25 },
        { identifier: 2, clientX: 20, clientY: 175 },
      ],
      changedTouches: [],
      preventDefault: vi.fn(),
    });

    expect(setRange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(Number),
        to: expect.any(Number),
        range: expect.any(Number),
      }),
    );
    expect(chart.adjustPaneViewport).toHaveBeenCalledWith(
      false,
      true,
      true,
      true,
    );
  });

  it("zooms an indicator pane vertically with a one-finger drag", () => {
    const chart = init();
    chart.createIndicator.mockImplementation((indicator) => {
      if (indicator?.name === "VOL") return "vol_pane";
      return "candle_pane";
    });

    const volMain = document.createElement("div");
    Object.defineProperty(volMain, "clientHeight", { value: 200 });
    const addEventListenerSpy = vi.spyOn(volMain, "addEventListener");
    const setRange = vi.fn();
    const axis = {
      getRange: vi.fn(() => ({
        from: 0,
        to: 100,
        range: 100,
        realFrom: 0,
        realTo: 100,
      })),
      convertToRealValue: vi.fn((value) => value),
      setRange,
    };

    chart.getDom.mockImplementation((paneId, position) => {
      if (paneId === "vol_pane" && position === DomPosition.Main) return volMain;
      if (position === DomPosition.YAxis) return document.createElement("div");
      return null;
    });
    chart.getDrawPaneById = vi.fn(() => ({
      getAxisComponent: () => axis,
    }));
    chart.adjustPaneViewport = vi.fn();

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="VOL" />,
    );

    const touchStartHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchstart",
    )[1];
    const touchMoveHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchmove",
    )[1];
    const touch = {
      identifier: 1,
      clientX: 20,
      clientY: 100,
      screenX: 20,
      screenY: 100,
    };

    touchStartHandler({
      touches: [touch],
      changedTouches: [touch],
      preventDefault: vi.fn(),
    });
    touchMoveHandler({
      touches: [{ ...touch, clientY: 50 }],
      changedTouches: [{ ...touch, clientY: 50 }],
      preventDefault: vi.fn(),
    });

    const nextRange = setRange.mock.calls[0][0];
    expect(nextRange.range).not.toBe(100);
    expect(nextRange.to - nextRange.from).toBe(nextRange.range);
  });

  it("shows and moves the crosshair while long-pressing on mobile", () => {
    vi.useFakeTimers();
    const chart = init();
    const candleMain = document.createElement("div");
    const addEventListenerSpy = vi.spyOn(candleMain, "addEventListener");
    const setCrosshair = vi.fn();
    const setRange = vi.fn();
    const axis = {
      getRange: vi.fn(() => ({
        from: 0,
        to: 100,
        range: 100,
        realFrom: 0,
        realTo: 100,
      })),
      convertToRealValue: vi.fn((value) => value),
      setRange,
    };

    Object.defineProperty(candleMain, "clientHeight", { value: 200 });
    candleMain.getBoundingClientRect = vi.fn(() => ({
      left: 10,
      top: 20,
      width: 300,
      height: 200,
      right: 310,
      bottom: 220,
    }));
    chart.getDom.mockImplementation((paneId, position) => {
      if (paneId === "candle_pane" && position === DomPosition.Main) {
        return candleMain;
      }
      if (position === DomPosition.YAxis) return document.createElement("div");
      return null;
    });
    chart.getDrawPaneById = vi.fn(() => ({
      getAxisComponent: () => axis,
    }));
    chart.getChartStore = vi.fn(() => ({
      getTooltipStore: () => ({ setCrosshair }),
    }));

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="" />,
    );

    const touchStartHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchstart",
    )[1];
    const touchMoveHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchmove",
    )[1];
    const touchEndHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchend",
    )[1];
    const touch = {
      identifier: 1,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };

    touchStartHandler({
      touches: [touch],
      changedTouches: [touch],
      preventDefault: vi.fn(),
    });
    vi.advanceTimersByTime(499);
    expect(setCrosshair).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(setCrosshair).toHaveBeenCalledWith({
      x: 30,
      y: 60,
      paneId: "candle_pane",
    });

    const preventDefault = vi.fn();
    touchMoveHandler({
      touches: [{ ...touch, clientX: 90, clientY: 120 }],
      changedTouches: [{ ...touch, clientX: 90, clientY: 120 }],
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(setRange).not.toHaveBeenCalled();
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 80,
      y: 100,
      paneId: "candle_pane",
    });

    touchEndHandler({
      changedTouches: [{ ...touch, clientX: 90, clientY: 120 }],
      preventDefault: vi.fn(),
    });

    expect(setCrosshair).toHaveBeenLastCalledWith();
  });
});
