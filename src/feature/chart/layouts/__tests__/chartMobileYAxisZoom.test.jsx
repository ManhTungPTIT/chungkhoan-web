import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TradingChart from "../chart";
import { DomPosition, init } from "klinecharts/dist/index.esm.js";

vi.mock("klinecharts/dist/index.esm.js", () => {
  const chart = {
    setStyles: vi.fn(),
    applyNewData: vi.fn(),
    createIndicator: vi.fn(),
    overrideIndicator: vi.fn(),
    removeIndicator: vi.fn(),
    createOverlay: vi.fn(),
    removeOverlay: vi.fn(),
    resize: vi.fn(),
    getDom: vi.fn(),
    setPaneOptions: vi.fn(),
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

  // Dựng chart giả lập với trục Y cho candle_pane + vol_pane, trả về handler
  // touch của trục Y pane yêu cầu cùng axis/setRange để kiểm tra zoom.
  function setupYAxisZoomChart(paneId) {
    const chart = init();
    chart.createIndicator.mockImplementation((indicator) => {
      if (indicator?.name === "VOL") return "vol_pane";
      return "candle_pane";
    });
    const yAxisElements = {
      candle_pane: document.createElement("div"),
      vol_pane: document.createElement("div"),
    };
    const addEventListenerSpy = vi.spyOn(
      yAxisElements[paneId],
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
      setAutoCalcTickFlag: vi.fn(),
      setRange,
    };
    chart.getDom.mockImplementation((id, position) => {
      if (position === DomPosition.YAxis) return yAxisElements[id] ?? null;
      if (position === DomPosition.Main) return document.createElement("div");
      return null;
    });
    chart.getDrawPaneById = vi.fn(() => ({
      getAxisComponent: () => axis,
    }));
    chart.adjustPaneViewport = vi.fn();

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="VOL" />,
    );

    const findHandler = (eventName) =>
      addEventListenerSpy.mock.calls.find(([name]) => name === eventName)[1];
    return {
      chart,
      axis,
      setRange,
      touchStartHandler: findHandler("touchstart"),
      touchMoveHandler: findHandler("touchmove"),
      touchEndHandler: findHandler("touchend"),
    };
  }

  it("zooms the candle pane price axis with a one-finger drag on the axis", () => {
    const { chart, setRange, touchStartHandler, touchMoveHandler } =
      setupYAxisZoomChart("candle_pane");
    const touch = { identifier: 1, clientY: 200, pageY: 200 };

    touchStartHandler({
      touches: [touch],
      changedTouches: [touch],
      preventDefault: vi.fn(),
    });
    touchMoveHandler({
      touches: [{ ...touch, clientY: 100, pageY: 100 }],
      changedTouches: [{ ...touch, clientY: 100, pageY: 100 }],
      preventDefault: vi.fn(),
    });

    // scale = 100/200 = 0.5 → range 100 → 50, phóng to quanh tâm dải
    expect(setRange).toHaveBeenCalledWith({
      from: 25,
      to: 75,
      range: 50,
      realFrom: 25,
      realTo: 75,
      realRange: 50,
    });
    expect(chart.adjustPaneViewport).toHaveBeenCalledWith(
      false,
      true,
      true,
      true,
    );
  });

  it("zooms an indicator pane price axis even when the drag leaves the pane", () => {
    const { setRange, touchStartHandler, touchMoveHandler } =
      setupYAxisZoomChart("vol_pane");
    const touch = { identifier: 1, clientY: 100, pageY: 100 };

    touchStartHandler({
      touches: [touch],
      changedTouches: [touch],
      preventDefault: vi.fn(),
    });
    // Kéo xa xuống dưới, vượt hẳn khỏi pane chỉ báo (~160px) → vẫn zoom tiếp
    touchMoveHandler({
      touches: [{ ...touch, clientY: 400, pageY: 400 }],
      changedTouches: [{ ...touch, clientY: 400, pageY: 400 }],
      preventDefault: vi.fn(),
    });

    // scale = 400/100 = 4 → range 100 → 400, thu nhỏ quanh tâm dải
    expect(setRange).toHaveBeenCalledWith({
      from: -150,
      to: 250,
      range: 400,
      realFrom: -150,
      realTo: 250,
      realRange: 400,
    });
  });

  it("re-enables auto-fit with a double tap on the price axis", () => {
    const { chart, axis, setRange, touchStartHandler, touchEndHandler } =
      setupYAxisZoomChart("vol_pane");
    const tap = { identifier: 1, clientY: 100, pageY: 100 };
    const tapOnce = () => {
      touchStartHandler({
        touches: [tap],
        changedTouches: [tap],
        preventDefault: vi.fn(),
      });
      touchEndHandler({
        touches: [],
        changedTouches: [tap],
        preventDefault: vi.fn(),
      });
    };

    tapOnce();
    expect(axis.setAutoCalcTickFlag).not.toHaveBeenCalledWith(true);
    tapOnce();

    expect(axis.setAutoCalcTickFlag).toHaveBeenCalledWith(true);
    expect(chart.adjustPaneViewport).toHaveBeenCalledWith(
      false,
      true,
      true,
      true,
    );
    expect(setRange).not.toHaveBeenCalled();
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
    const rootAddEventListenerSpy = vi.spyOn(
      document.documentElement,
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
    const touchMoveHandler =
      addEventListenerSpy.mock.calls.find(
        ([eventName]) => eventName === "touchmove",
      )?.[1] ??
      rootAddEventListenerSpy.mock.calls
        .filter(([eventName]) => eventName === "touchmove")
        .at(-1)[1];

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

  it("zooms an indicator pane in place during a one-finger vertical drag", () => {
    const chart = init();
    chart.createIndicator.mockImplementation((indicator) => {
      if (indicator?.name === "VOL") return "vol_pane";
      return "candle_pane";
    });

    const volMain = document.createElement("div");
    Object.defineProperty(volMain, "clientHeight", { value: 200 });
    const addEventListenerSpy = vi.spyOn(volMain, "addEventListener");
    const rootAddEventListenerSpy = vi.spyOn(
      document.documentElement,
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
    const touchMoveHandler =
      addEventListenerSpy.mock.calls.find(
        ([eventName]) => eventName === "touchmove",
      )?.[1] ??
      rootAddEventListenerSpy.mock.calls
        .filter(([eventName]) => eventName === "touchmove")
        .at(-1)[1];
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

    expect(setRange).toHaveBeenCalledWith({
      from: 12.5,
      to: 87.5,
      range: 75,
      realFrom: 12.5,
      realTo: 87.5,
      realRange: 75,
    });
    expect(chart.adjustPaneViewport).toHaveBeenCalledWith(
      false,
      true,
      true,
      true,
    );
    expect(chart.setPaneOptions).not.toHaveBeenCalled();
  });

  // Dựng chart giả lập cho các test crosshair mobile và trả về các handler
  // touch đã đăng ký (touchstart trên pane chính, move/end trên documentElement).
  function setupMobileCrosshairChart({
    dataList = [],
    convertFromPixel = () => ({}),
  } = {}) {
    const chart = init();
    const candleMain = document.createElement("div");
    const addEventListenerSpy = vi.spyOn(candleMain, "addEventListener");
    const rootAddEventListenerSpy = vi.spyOn(
      document.documentElement,
      "addEventListener",
    );
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
    chart.getDataList = vi.fn(() => dataList);
    chart.convertFromPixel = vi.fn(convertFromPixel);

    render(
      <TradingChart candles={[]} signals={[]} infoHeight={0} activeKey="" />,
    );

    const touchStartHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "touchstart",
    )[1];
    const touchMoveHandler = rootAddEventListenerSpy.mock.calls
      .filter(([eventName]) => eventName === "touchmove")
      .at(-1)[1];
    const touchEndHandler = rootAddEventListenerSpy.mock.calls
      .filter(([eventName]) => eventName === "touchend")
      .at(-1)[1];

    return {
      setCrosshair,
      setRange,
      rootAddEventListenerSpy,
      touchStartHandler,
      touchMoveHandler,
      touchEndHandler,
    };
  }

  function makeTouchEvent(touches, changedTouches = touches) {
    return {
      touches,
      changedTouches,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    };
  }

  // Giả lập DOM TouchList thật: array-like (length + chỉ số + item) NHƯNG KHÔNG
  // iterable bằng for...of / spread / destructuring — như trên nhiều trình duyệt
  // mobile. Dùng để bắt lỗi phụ thuộc Symbol.iterator của TouchList.
  function nonIterableTouchList(...touches) {
    const list = {
      length: touches.length,
      item: (i) => touches[i] ?? null,
    };
    touches.forEach((touch, index) => {
      list[index] = touch;
    });
    return list;
  }

  // Giữ 500ms tại (40,80) rồi nhấc tay → crosshair được ghim tại {x:30, y:60}.
  function pinCrosshair({ touchStartHandler, touchEndHandler }) {
    const touch = {
      identifier: 1,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };
    touchStartHandler(makeTouchEvent([touch]));
    vi.advanceTimersByTime(500);
    touchEndHandler(makeTouchEvent([], [touch]));
  }

  it("shows and moves the crosshair while long-pressing, then keeps it after release", () => {
    vi.useFakeTimers();
    const {
      setCrosshair,
      setRange,
      rootAddEventListenerSpy,
      touchStartHandler,
      touchMoveHandler,
      touchEndHandler,
    } = setupMobileCrosshairChart();
    const touch = {
      identifier: 1,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };

    touchStartHandler(makeTouchEvent([touch]));
    vi.advanceTimersByTime(499);
    expect(setCrosshair).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(setCrosshair).toHaveBeenCalledWith({
      x: 30,
      y: 60,
      paneId: "candle_pane",
    });

    const moveEvent = makeTouchEvent([{ ...touch, clientX: 90, clientY: 120 }]);
    touchMoveHandler(moveEvent);

    expect(moveEvent.preventDefault).toHaveBeenCalled();
    expect(moveEvent.stopPropagation).toHaveBeenCalled();
    expect(moveEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(setRange).not.toHaveBeenCalled();
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 80,
      y: 100,
      paneId: "candle_pane",
    });

    const endEvent = makeTouchEvent(
      [],
      [{ ...touch, clientX: 90, clientY: 120 }],
    );
    touchEndHandler(endEvent);

    expect(endEvent.preventDefault).toHaveBeenCalled();
    expect(endEvent.stopPropagation).toHaveBeenCalled();
    expect(endEvent.stopImmediatePropagation).toHaveBeenCalled();

    // Nhấc tay xong crosshair phải GIỮ NGUYÊN, không tự xóa theo thời gian.
    vi.advanceTimersByTime(10000);
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 80,
      y: 100,
      paneId: "candle_pane",
    });
    expect(rootAddEventListenerSpy).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
      expect.objectContaining({ capture: true, passive: false }),
    );
  });

  it("clears the pinned crosshair with a quick tap", () => {
    vi.useFakeTimers();
    const { setCrosshair, touchStartHandler, touchEndHandler } =
      setupMobileCrosshairChart();
    pinCrosshair({ touchStartHandler, touchEndHandler });
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 30,
      y: 60,
      paneId: "candle_pane",
    });

    const tap = {
      identifier: 2,
      clientX: 150,
      clientY: 60,
      screenX: 150,
      screenY: 60,
    };
    touchStartHandler(makeTouchEvent([tap]));
    vi.advanceTimersByTime(50);
    touchEndHandler(makeTouchEvent([], [tap]));

    // Tap nhanh vào vùng khác → crosshair bị xóa (setCrosshair gọi không tham số).
    expect(setCrosshair).toHaveBeenLastCalledWith();
  });

  it("moves the pinned crosshair instead of clearing it when quick tapping another candle", () => {
    vi.useFakeTimers();
    const { setCrosshair, touchStartHandler, touchEndHandler } =
      setupMobileCrosshairChart({
        dataList: [{ timestamp: 1, close: 10 }],
        convertFromPixel: () => ({ dataIndex: 0 }),
      });
    pinCrosshair({ touchStartHandler, touchEndHandler });

    const tap = {
      identifier: 2,
      clientX: 150,
      clientY: 60,
      screenX: 150,
      screenY: 60,
    };
    touchStartHandler(makeTouchEvent([tap]));
    vi.advanceTimersByTime(50);
    touchEndHandler(makeTouchEvent([], [tap]));

    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 140,
      y: 40,
      paneId: "candle_pane",
    });
  });

  it("moves the pinned crosshair on a vertical drag instead of panning the price range", () => {
    vi.useFakeTimers();
    const {
      setCrosshair,
      setRange,
      touchStartHandler,
      touchMoveHandler,
      touchEndHandler,
    } = setupMobileCrosshairChart();
    pinCrosshair({ touchStartHandler, touchEndHandler });

    const drag = {
      identifier: 2,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };
    touchStartHandler(makeTouchEvent([drag]));
    const moveEvent = makeTouchEvent([{ ...drag, clientX: 45, clientY: 140 }]);
    touchMoveHandler(moveEvent);

    expect(moveEvent.preventDefault).toHaveBeenCalled();
    expect(moveEvent.stopPropagation).toHaveBeenCalled();
    expect(moveEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(setRange).not.toHaveBeenCalled();
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 35,
      y: 120,
      paneId: "candle_pane",
    });
  });

  it("follows the finger vertically during a hold-drag when touches are a non-iterable TouchList", () => {
    vi.useFakeTimers();
    const { setCrosshair, touchStartHandler, touchMoveHandler } =
      setupMobileCrosshairChart();
    const start = {
      identifier: 1,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };

    // Giữ lâu để crosshair xuất hiện (rect top=20 → y = 80-20 = 60).
    touchStartHandler(makeTouchEvent(nonIterableTouchList(start)));
    vi.advanceTimersByTime(500);
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 30,
      y: 60,
      paneId: "candle_pane",
    });

    // Vẫn giữ, kéo dọc xuống (clientY 80 → 160) với TouchList KHÔNG iterable.
    const moved = { ...start, clientY: 160 };
    const moveEvent = {
      touches: nonIterableTouchList(moved),
      changedTouches: nonIterableTouchList(moved),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    };
    touchMoveHandler(moveEvent);

    // Crosshair phải di theo trục Y (y = 160-20 = 140), không được đứng yên.
    expect(moveEvent.preventDefault).toHaveBeenCalled();
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 30,
      y: 140,
      paneId: "candle_pane",
    });
  });

  it("keeps the pinned crosshair while dragging the chart", () => {
    vi.useFakeTimers();
    const { setCrosshair, touchStartHandler, touchMoveHandler, touchEndHandler } =
      setupMobileCrosshairChart();
    pinCrosshair({ touchStartHandler, touchEndHandler });

    const drag = {
      identifier: 2,
      clientX: 40,
      clientY: 80,
      screenX: 40,
      screenY: 80,
    };
    touchStartHandler(makeTouchEvent([drag]));
    touchMoveHandler(makeTouchEvent([{ ...drag, clientX: 140 }]));
    const callsBeforeEnd = setCrosshair.mock.calls.length;
    touchEndHandler(makeTouchEvent([], [{ ...drag, clientX: 140 }]));

    // Kéo ngang để cuộn chart → crosshair KHÔNG bị xóa; khi nhấc tay phải được
    // áp LẠI đúng vị trí ghim (klinecharts có thể đã vẽ đè trong lúc cuộn).
    expect(setCrosshair.mock.calls.length).toBe(callsBeforeEnd + 1);
    expect(setCrosshair).toHaveBeenLastCalledWith({
      x: 30,
      y: 60,
      paneId: "candle_pane",
    });
  });
});
