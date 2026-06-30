import { useEffect, useRef } from "react";
import { init, dispose, DomPosition } from "klinecharts/dist/index.esm.js";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import "../klinecharts/ichimokuIndicator";
import "../klinecharts/adxIndicator";
import "../klinecharts/signalMarkerOverlay";
import {
  ALL_INDICATORS,
  getIndicatorDefinition,
  normalizeIndicatorConfigs,
} from "../untils/indicatorSettings";

export { ALL_INDICATORS };

function getIndicatorParams(name, indicatorConfigs) {
  const config = normalizeIndicatorConfigs(indicatorConfigs)[name];
  const definition = getIndicatorDefinition(name);
  return (
    config?.params ??
    definition?.params?.map((param) => param.defaultValue) ??
    []
  );
}

function getIndicatorLineStyles(name, indicatorConfigs) {
  const rawConfig = indicatorConfigs?.[name];
  if (!rawConfig?.styles?.lines?.length) {
    return [];
  }

  const config = normalizeIndicatorConfigs(indicatorConfigs)[name];
  const styleLines = config?.styles?.lines ?? [];
  return styleLines.map((line, index) => {
    return {
      style: line.style,
      smooth: false,
      size: line.visible ? line.size : 0,
      dashedValue: line.style === "dashed" ? [4, 4] : [2, 2],
      color: line.visible ? line.color : "rgba(0,0,0,0)",
    };
  });
}

function getIndicatorCreateValue(name, indicatorConfigs, extra = {}) {
  const params = getIndicatorParams(name, indicatorConfigs);
  const lineStyles = getIndicatorLineStyles(name, indicatorConfigs);
  const hasExtra = Object.keys(extra).length > 0;
  if (params.length > 0 || lineStyles.length > 0 || hasExtra) {
    return {
      name,
      ...(params.length > 0 ? { calcParams: params } : {}),
      ...(lineStyles.length > 0 ? { styles: { lines: lineStyles } } : {}),
      ...extra,
    };
  }
  return name;
}

// Mây Kumo của Ichimoku do hàm draw tự tô (không phải line) → truyền màu nền
// qua extendData để draw đọc. Thiếu config thì draw dùng màu mặc định.
function getIchimokuCloudExtend(indicatorConfigs) {
  const fill = normalizeIndicatorConfigs(indicatorConfigs)?.ICHIMOKU?.styles
    ?.fills?.[0];
  if (!fill) return {};
  return {
    extendData: { cloud: { visible: fill.visible !== false, colors: fill.colors } },
  };
}

// Tạo 1 chỉ báo trên chart (EMA dùng cấu hình màu riêng cũ).
function addIndicator(chart, name, indicatorConfigs) {
  if (name === "ICHIMOKU") {
    const createValue = getIndicatorCreateValue(
      name,
      indicatorConfigs,
      getIchimokuCloudExtend(indicatorConfigs),
    );
    chart.createIndicator(createValue, true, { id: "candle_pane" });
    return;
  }
  if (name === "EMA") {
    const params = getIndicatorParams(name, indicatorConfigs);
    const lineStyles = getIndicatorLineStyles(name, indicatorConfigs);
    const colors = ["blue", "purple", "#f59e0b", "#16a34a", "#ef4444"];
    // styles.lines THAY THẾ toàn bộ default — phải đủ style/smooth/size/dashedValue,
    // thiếu dashedValue sẽ crash khi zoom.
    chart.createIndicator(
      {
        name: "EMA",
        calcParams: params,
        styles: {
          lines:
            lineStyles.length > 0
              ? lineStyles
              : params.map((_, index) => ({
                  style: "solid",
                  smooth: false,
                  size: 1,
                  dashedValue: [2, 2],
                  color: colors[index % colors.length],
                })),
        },
      },
      true,
      { id: "candle_pane" },
    );
    return;
  }
  if (name === "VOL") {
    // Bật tooltip riêng cho VOL: chỉ hiện giá trị khối lượng khi rê chuột
    // (crosshair) qua cột, không ảnh hưởng tooltip các chỉ báo khác.
    chart.createIndicator(
      {
        name: "VOL",
        styles: { tooltip: { showRule: "follow_cross" } },
      },
      false,
    );
    return;
  }
  const pane = getIndicatorDefinition(name)?.pane;
  const createValue = getIndicatorCreateValue(name, indicatorConfigs);
  if (pane === "candle_pane") {
    chart.createIndicator(createValue, true, { id: "candle_pane" });
  } else {
    chart.createIndicator(createValue, false); // pane riêng
  }
}

function dispatchTouchAsMouse(target, type, touch, buttons) {
  if (!(target instanceof EventTarget) || typeof MouseEvent === "undefined") {
    return;
  }

  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons,
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
  });
  Object.defineProperty(event, "sourceCapabilities", {
    value: { firesTouchEvents: false },
  });
  target.dispatchEvent(event);
}

function enableMobileYAxisTouchZoom(chart, paneId = "candle_pane") {
  const yAxisElement = chart.getDom?.(paneId, DomPosition.YAxis);
  if (!yAxisElement) return () => {};

  yAxisElement.style.touchAction = "none";

  let activeTouchId = null;

  const findTouch = (touches) => {
    for (const touch of touches) {
      if (touch.identifier === activeTouchId) return touch;
    }
    return null;
  };

  const onTouchStart = (event) => {
    if (activeTouchId !== null || event.touches.length !== 1) return;
    const touch = event.changedTouches[0];
    activeTouchId = touch.identifier;
    event.preventDefault();
    dispatchTouchAsMouse(yAxisElement, "mousedown", touch, 1);
  };

  const onTouchMove = (event) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.changedTouches);
    if (!touch) return;
    event.preventDefault();
    dispatchTouchAsMouse(document.documentElement, "mousemove", touch, 1);
  };

  const endTouch = (event) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.changedTouches);
    if (!touch) return;
    event.preventDefault();
    activeTouchId = null;
    dispatchTouchAsMouse(document.documentElement, "mouseup", touch, 0);
  };

  yAxisElement.addEventListener("touchstart", onTouchStart, {
    passive: false,
  });
  yAxisElement.addEventListener("touchmove", onTouchMove, {
    passive: false,
  });
  yAxisElement.addEventListener("touchend", endTouch);
  yAxisElement.addEventListener("touchcancel", endTouch);

  return () => {
    yAxisElement.removeEventListener("touchstart", onTouchStart);
    yAxisElement.removeEventListener("touchmove", onTouchMove);
    yAxisElement.removeEventListener("touchend", endTouch);
    yAxisElement.removeEventListener("touchcancel", endTouch);
  };
}

// Cho phép VUỐT DỌC trên thân biểu đồ để PAN khung giá (di chuyển lên/xuống),
// giữ nguyên mức zoom. KLineChart đã hỗ trợ sẵn pan trục Y ở pane chính, nhưng
// CHỈ khi auto-fit (autoCalcTickFlag) tắt + scrollZoom bật (mặc định bật). Vì vậy
// ta đợi chart fit giá lần đầu (range hợp lệ) rồi tắt auto-fit để giữ đúng khung
// giá ban đầu và bật pan. Double-click/double-tap vào trục giá sẽ bật lại auto-fit.
// Dùng API runtime nội bộ (getDrawPaneById/getAxisComponent) — bọc try/catch để
// an toàn nếu klinecharts đổi nội bộ ở bản khác.
function enablePriceAxisPan(chart, paneId = "candle_pane") {
  let rafId = 0;
  let tries = 0;
  const apply = () => {
    tries += 1;
    try {
      const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
      const range = axis?.getRange?.();
      if (axis && range && range.realFrom !== range.realTo) {
        axis.setAutoCalcTickFlag(false); // giữ khung giá hiện tại → cho phép pan
        return;
      }
    } catch {
      return; // API nội bộ không còn → bỏ qua, không làm hỏng chart
    }
    if (tries < 30) rafId = requestAnimationFrame(apply); // đợi tới khi fit xong
  };
  rafId = requestAnimationFrame(apply);
  return () => cancelAnimationFrame(rafId);
}

// Công cụ vẽ (overlay built-in của KLineChart). glyph = ký hiệu nút.
const DRAW_TOOLS = [
  { name: "horizontalStraightLine", glyph: "—", label: "Đường ngang" },
  { name: "straightLine", glyph: "／", label: "Đường thẳng" },
  { name: "segment", glyph: "↗", label: "Đoạn thẳng" },
  { name: "rayLine", glyph: "→", label: "Tia" },
  { name: "priceLine", glyph: "⎯", label: "Đường giá" },
  { name: "fibonacciLine", glyph: "Fib", label: "Fibonacci" },
  { name: "rect", glyph: "▭", label: "Hình chữ nhật" },
  { name: "circle", glyph: "◯", label: "Hình tròn" },
  { name: "simpleAnnotation", glyph: "✎", label: "Ghi chú" },
];

// activeKey: chuỗi tên chỉ báo đang bật (do TradingView truyền xuống).
export default function TradingChart({
  candles,
  signals,
  infoHeight = 0,
  activeKey = "",
  showDraw = false,
  indicatorConfigs = {},
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null); // giữ instance để thanh công cụ vẽ gọi createOverlay

  useEffect(() => {
    const container = containerRef.current;
    const chart = init(container);
    chartRef.current = chart;

    chart.setStyles({
      grid: {
        show: false, // bỏ đường kẻ lưới trong đồ thị
        horizontal: { show: false },
        vertical: { show: false },
      },
      candle: {
        bar: {
          upColor: "#26a69a",
          downColor: "#ef5350",
          upBorderColor: "#26a69a",
          downBorderColor: "#ef5350",
          upWickColor: "#26a69a",
          downWickColor: "#ef5350",
        },
        tooltip: { showRule: "none" }, // ẩn dòng Time, Open, High, Low, Close, Volume
      },
      indicator: {
        tooltip: { showRule: "none" }, // ẩn dòng EMA(10,20,50), BOLL(20,2)...
      },
    });

    // API trả time unix giây → KLineChart cần timestamp ms; bỏ bản ghi hỏng
    const dataList = candles
      .filter((c) => typeof c.time === "number")
      .map((c) => ({
        timestamp: c.time * 1000,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
    chart.applyNewData(dataList);

    // Chỉ báo do người dùng chọn
    activeKey
      .split(",")
      .filter(Boolean)
      .forEach((name) => addIndicator(chart, name, indicatorConfigs));

    // Bollinger + fill xanh/đỏ theo tín hiệu — signals truyền qua extendData
    chart.createIndicator({ name: "BBS", extendData: signals }, true, {
      id: "candle_pane",
    });

    // Markers mua/bán
    signals.forEach((s) => {
      chart.createOverlay({
        name: "signalMarker",
        points: [{ timestamp: s.time * 1000, value: s.price }],
        extendData: s,
        lock: true,
      });
    });

    // KLineChart v9 không tự autoSize theo container
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(container);
    const disableMobileYAxisTouchZoom = enableMobileYAxisTouchZoom(chart);
    const disablePriceAxisPan = enablePriceAxisPan(chart);

    return () => {
      disableMobileYAxisTouchZoom();
      disablePriceAxisPan();
      ro.disconnect();
      dispose(container);
      chartRef.current = null;
    };
  }, [candles, signals, activeKey, indicatorConfigs]);

  // Vào chế độ vẽ một overlay; groupId "draw" để xoá riêng hình vẽ (không đụng marker)
  const startDraw = (name) =>
    chartRef.current?.createOverlay({ name, groupId: "draw" });
  const clearDraw = () => chartRef.current?.removeOverlay({ groupId: "draw" });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `calc(100dvh - ${infoHeight}px)`,
      }}
    >
      {/* Thanh công cụ vẽ — ngang, trượt vào/ra theo showDraw */}
      <div
        className="draw-toolbar"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          gap: 2,
          background: "#fff",
          border: "1px solid var(--border, #d6dae3)",
          borderRadius: 8,
          padding: 4,
          boxShadow: "0 4px 12px rgba(16,24,40,0.12)",
          transition: "transform 0.25s ease, opacity 0.25s ease",
          transform: showDraw ? "translateX(0)" : "translateX(-110%)",
          opacity: showDraw ? 1 : 0,
          pointerEvents: showDraw ? "auto" : "none",
        }}
      >
        {DRAW_TOOLS.map((t) => (
          <button
            key={t.name}
            type="button"
            title={t.label}
            onClick={() => startDraw(t.name)}
            style={{
              width: 30,
              height: 30,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: "0.85rem",
            }}
          >
            {t.glyph}
          </button>
        ))}
        <button
          type="button"
          title="Xoá hình vẽ"
          onClick={clearDraw}
          style={{
            width: 30,
            height: 30,
            border: "none",
            borderLeft: "1px solid #eee",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          🗑
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          // Để cử chỉ chạm (pinch-zoom / kéo) đi vào chart thay vì bị trình duyệt
          // mobile xử lý thành zoom/cuộn trang → mới zoom được trên điện thoại.
          touchAction: "none",
        }}
      />
    </div>
  );
}
