import { render, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TradingChart from "../chart";
import { init, __getChart } from "klinecharts/dist/index.esm.js";

// Mô phỏng trục Y của klinecharts v9 đủ sát để bắt bug "trục đóng băng":
//  - chart mới/không có nến → calcRange() trả range mặc định 0–10 (đúng source lib)
//  - auto-fit (autoCalcTickFlag=true) → refit range theo min(low)/max(high) ở lần VẼ
//    kế tiếp (draw là async — mô phỏng bằng rAF sau applyNewData / ngay trong
//    adjustPaneViewport)
//  - setAutoCalcTickFlag(false) → range giữ nguyên bất kể data mới
vi.mock("klinecharts/dist/index.esm.js", () => {
  const DEFAULT_RANGE = {
    from: 0,
    to: 10,
    range: 10,
    realFrom: 0,
    realTo: 10,
    realRange: 10,
  };

  let chart = null;

  function makeChart() {
    let dataList = [];
    const axes = new Map();

    const axisState = (paneId) => {
      if (!axes.has(paneId)) {
        axes.set(paneId, {
          autoFit: true,
          range: { from: 0, to: 0, range: 0, realFrom: 0, realTo: 0, realRange: 0 },
        });
      }
      return axes.get(paneId);
    };

    const refit = () => {
      axes.forEach((axis) => {
        if (!axis.autoFit) return;
        if (dataList.length === 0) {
          axis.range = { ...DEFAULT_RANGE };
          return;
        }
        const min = Math.min(...dataList.map((c) => c.low));
        const max = Math.max(...dataList.map((c) => c.high));
        axis.range = {
          from: min,
          to: max,
          range: max - min,
          realFrom: min,
          realTo: max,
          realRange: max - min,
        };
      });
    };

    return {
      __axisState: axisState,
      setStyles: vi.fn(),
      applyNewData: vi.fn((data) => {
        dataList = data;
        requestAnimationFrame(refit); // draw async như lib thật
      }),
      getDataList: () => dataList,
      adjustPaneViewport: vi.fn(() => refit()),
      resize: vi.fn(),
      createIndicator: vi.fn(() => "candle_pane"),
      removeIndicator: vi.fn(),
      overrideIndicator: vi.fn(),
      createOverlay: vi.fn(),
      removeOverlay: vi.fn(),
      getDom: vi.fn(() => null),
      getIndicatorByPaneId: vi.fn(() => null),
      getDrawPaneById: (paneId) => ({
        getAxisComponent: () => {
          const state = axisState(paneId);
          return {
            getRange: () => state.range,
            setAutoCalcTickFlag: (flag) => {
              state.autoFit = flag;
            },
            setRange: (range) => {
              state.autoFit = false;
              state.range = range;
            },
            convertToRealValue: (v) => v,
          };
        },
      }),
    };
  }

  return {
    DomPosition: { Main: "main", YAxis: "yAxis" },
    dispose: vi.fn(),
    init: vi.fn(() => {
      chart = makeChart();
      return chart;
    }),
    registerIndicator: vi.fn(),
    registerOverlay: vi.fn(),
    __getChart: () => chart,
  };
});

global.ResizeObserver = class {
  observe = vi.fn();
  disconnect = vi.fn();
};

// rAF điều khiển tay: hàng đợi callback, test tự flush từng "frame"
let rafQueue = [];
const flushFrames = (frames = 40) => {
  for (let i = 0; i < frames && rafQueue.length > 0; i += 1) {
    const queue = rafQueue;
    rafQueue = [];
    queue.forEach((cb) => cb());
  }
};

beforeEach(() => {
  rafQueue = [];
  vi.stubGlobal("requestAnimationFrame", (cb) => rafQueue.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// candles theo format prop của TradingChart (time unix giây)
const DAY = 24 * 60 * 60;
const T0 = 1751328000; // 2025-07-01 00:00 UTC
const candle = (i, price, volume = 1000) => ({
  time: T0 + i * DAY,
  open: price - 2,
  high: price + 5,
  low: price - 5,
  close: price,
  volume,
});

const VNINDEX_CANDLES = [candle(0, 1840), candle(1, 1845), candle(2, 1848.25)];
const STOCK_CANDLES = [
  { ...candle(0, 60.5), time: T0 + 30 * DAY },
  { ...candle(1, 61.2), time: T0 + 31 * DAY },
  { ...candle(2, 62.9), time: T0 + 32 * DAY },
];

const renderChart = (candles) =>
  render(
    <TradingChart candles={candles} signals={[]} infoHeight={0} activeKey="" />,
  );

const candleRange = () => __getChart().__axisState("candle_pane").range;

describe("TradingChart price axis auto-fit", () => {
  it("dữ liệu về sau khi chart init rỗng → trục giá phải ôm dữ liệu (không kẹt ở range mặc định 0–10)", () => {
    // Mount khi lịch sử chưa tải xong (candles rỗng) — đúng flow thực tế:
    // init effect chạy 1 lần, dữ liệu về sau qua prop candles.
    const { rerender } = renderChart([]);
    flushFrames(); // chart vẽ khung rỗng, range default 0–10

    rerender(
      <TradingChart
        candles={VNINDEX_CANDLES}
        signals={[]}
        infoHeight={0}
        activeKey=""
      />,
    );
    flushFrames();

    const range = candleRange();
    const lastClose = 1848.25;
    expect(range.realFrom).toBeLessThanOrEqual(lastClose);
    expect(range.realTo).toBeGreaterThanOrEqual(lastClose);
  });

  it("đổi mã (dataset thay thế) → trục giá auto-fit lại theo mã mới dù đã đóng băng để pan", () => {
    const { rerender } = renderChart([]);
    flushFrames();
    rerender(
      <TradingChart
        candles={VNINDEX_CANDLES}
        signals={[]}
        infoHeight={0}
        activeKey=""
      />,
    );
    flushFrames();

    rerender(
      <TradingChart
        candles={STOCK_CANDLES}
        signals={[]}
        infoHeight={0}
        activeKey=""
      />,
    );
    flushFrames();

    const range = candleRange();
    const lastClose = 62.9;
    expect(range.realFrom).toBeLessThanOrEqual(lastClose);
    expect(range.realTo).toBeGreaterThanOrEqual(lastClose);
  });

  it("tick realtime cùng stream → không refit trục (giữ khung giá người dùng đang xem)", () => {
    const { rerender } = renderChart([]);
    flushFrames();
    rerender(
      <TradingChart
        candles={VNINDEX_CANDLES}
        signals={[]}
        infoHeight={0}
        activeKey=""
      />,
    );
    flushFrames();

    const state = __getChart().__axisState("candle_pane");
    // Người dùng pan/zoom → trục đã đóng băng ở khung riêng
    state.autoFit = false;
    const pannedRange = {
      from: 1700,
      to: 1900,
      range: 200,
      realFrom: 1700,
      realTo: 1900,
      realRange: 200,
    };
    state.range = pannedRange;

    // Tick mới: cùng stream (giữ nến đầu + nến cuối cùng timestamp), chỉ đổi close
    const ticked = [
      ...VNINDEX_CANDLES.slice(0, -1),
      { ...VNINDEX_CANDLES[2], close: 1850 },
    ];
    rerender(
      <TradingChart
        candles={ticked}
        signals={[]}
        infoHeight={0}
        activeKey=""
      />,
    );
    flushFrames();

    expect(state.autoFit).toBe(false);
    expect(state.range).toEqual(pannedRange);
    // data tick vẫn phải vào chart
    const dataList = __getChart().getDataList();
    expect(dataList[dataList.length - 1].close).toBe(1850);
  });
});
