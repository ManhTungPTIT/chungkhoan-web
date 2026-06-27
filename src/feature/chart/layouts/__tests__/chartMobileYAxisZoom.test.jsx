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
});
