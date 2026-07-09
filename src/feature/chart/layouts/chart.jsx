import { useEffect, useRef } from "react";
import { init, dispose, DomPosition } from "klinecharts/dist/index.esm.js";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import { drawRsiBackground } from "../klinecharts/rsiIndicator";
import { drawIchimokuCloud } from "../klinecharts/ichimokuIndicator";
import "../klinecharts/adxIndicator";
import "../klinecharts/signalMarkerOverlay";
import { attachIndicatorAxisLabels } from "../klinecharts/indicatorAxisLabels";
import {
  drawConfiguredStepLines,
  isStepLineShape,
} from "../klinecharts/stepLineIndicator";
import {
  ALL_INDICATORS,
  getIndicatorDefinition,
  normalizeIndicatorConfigs,
} from "../untils/indicatorSettings";

export { ALL_INDICATORS };

const DRAGGABLE_SEPARATOR_SIZE = 1;
const MOBILE_CROSSHAIR_DELAY = 500;
const MOBILE_CROSSHAIR_MOVE_TOLERANCE = 8;
const INDICATOR_PANE_HEIGHT = 120;
const PRICE_AXIS_SIZE = 76;
const SUB_PANE_INDICATOR_TOOLTIP = {
  showRule: "always",
  showName: true,
  showParams: true,
};
const EMPTY_INDICATOR_CONFIGS = {};

function getFixedIndicatorPaneOptions() {
  return {
    height: INDICATOR_PANE_HEIGHT,
    minHeight: INDICATOR_PANE_HEIGHT,
    dragEnabled: false,
  };
}

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
  return styleLines.map((line) => {
    const hideDefaultLine = line.visible && isStepLineShape(line.shape);
    return {
      style: line.style,
      smooth: false,
      size: line.visible && !hideDefaultLine ? line.size : 0,
      dashedValue: line.style === "dashed" ? [4, 4] : [2, 2],
      color:
        line.visible && !hideDefaultLine ? line.color : "rgba(0,0,0,0)",
      ...(line.shape ? { shape: line.shape } : {}),
    };
  });
}

function getIndicatorStepLineStyles(name, indicatorConfigs) {
  const rawConfig = indicatorConfigs?.[name];
  if (!rawConfig?.styles?.lines?.length) {
    return [];
  }

  const config = normalizeIndicatorConfigs(indicatorConfigs)[name];
  const styleLines = config?.styles?.lines ?? [];
  const stepLines = styleLines.map((line) => {
    if (!line.visible || !isStepLineShape(line.shape)) return null;
    return {
      style: line.style,
      smooth: false,
      size: line.size,
      dashedValue: line.style === "dashed" ? [4, 4] : [2, 2],
      color: line.color,
      shape: line.shape,
    };
  });
  return stepLines.some(Boolean) ? stepLines : [];
}

function getBaseIndicatorDraw(name) {
  if (name === "ICHIMOKU") return drawIchimokuCloud;
  if (name === "RSI") return drawRsiBackground;
  return null;
}

function createStepLineDraw(name) {
  const baseDraw = getBaseIndicatorDraw(name);
  return (context) => {
    baseDraw?.(context);
    drawConfiguredStepLines(context);
    return false;
  };
}

function withStepLineExtra(name, indicatorConfigs, extra = {}) {
  const stepLineStyles = getIndicatorStepLineStyles(name, indicatorConfigs);
  if (!stepLineStyles.length) return extra;
  return {
    ...extra,
    extendData: {
      ...(extra.extendData ?? {}),
      stepLineStyles,
    },
    draw: createStepLineDraw(name),
  };
}

function getIndicatorCreateValue(name, indicatorConfigs, extra = {}) {
  const params = getIndicatorParams(name, indicatorConfigs);
  const lineStyles = getIndicatorLineStyles(name, indicatorConfigs);
  const indicatorExtra = withStepLineExtra(name, indicatorConfigs, extra);
  const hasExtra = Object.keys(indicatorExtra).length > 0;
  if (params.length > 0 || lineStyles.length > 0 || hasExtra) {
    return {
      name,
      ...(params.length > 0 ? { calcParams: params } : {}),
      ...(lineStyles.length > 0 ? { styles: { lines: lineStyles } } : {}),
      ...indicatorExtra,
    };
  }
  return name;
}

function withSubPaneIndicatorTooltip(createValue) {
  if (typeof createValue === "string") {
    return {
      name: createValue,
      styles: { tooltip: SUB_PANE_INDICATOR_TOOLTIP },
    };
  }

  return {
    ...createValue,
    styles: {
      ...(createValue.styles ?? {}),
      tooltip: SUB_PANE_INDICATOR_TOOLTIP,
    },
  };
}

function toChartTimestamp(time) {
  if (!Number.isFinite(time)) return null;
  return time > 1e12 ? Math.floor(time) : time * 1000;
}

function toKLineData(candles = []) {
  return candles
    .map((c) => {
      const timestamp = toChartTimestamp(c.time);
      return {
        timestamp,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number.isFinite(Number(c.volume)) ? Number(c.volume) : 0,
      };
    })
    .filter(
      (c) =>
        Number.isFinite(c.timestamp) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close),
    );
}

function syncSignalOverlays(chart, signals) {
  chart.removeOverlay?.({ groupId: "signal" });
  signals.forEach((s) => {
    chart.createOverlay({
      name: "signalMarker",
      groupId: "signal",
      points: [{ timestamp: s.time * 1000, value: s.price }],
      extendData: s,
      lock: true,
    });
  });
}

function syncBbsIndicator(chart, signals) {
  chart.removeIndicator?.("candle_pane", "BBS");
  chart.createIndicator(
    { name: "BBS", extendData: signals },
    true,
    { id: "candle_pane" },
  );
}

function getSubPaneIndicatorTitle(name) {
  if (name === "VOL") return "Volume - Khối lượng";
  const label = getIndicatorDefinition(name)?.label ?? name;
  return label.replace(/\s+—\s+/g, " - ");
}

function attachSubPaneIndicatorLabels(chart, paneIndicators) {
  return paneIndicators.map(({ paneId, name }) => {
    const paneEl = chart.getDom?.(paneId, DomPosition.Main);
    if (!paneEl) return () => {};

    const labelEl = document.createElement("div");
    labelEl.className = "chart-indicator-pane-label";
    labelEl.textContent = getSubPaneIndicatorTitle(name);
    Object.assign(labelEl.style, {
      position: "absolute",
      top: "6px",
      left: "8px",
      zIndex: "4",
      pointerEvents: "none",
      color: "#1d2939",
      fontSize: "12px",
      lineHeight: "16px",
      fontFamily: "sans-serif",
      fontWeight: "500",
      background: "rgba(255, 255, 255, 0.72)",
      borderRadius: "4px",
      padding: "1px 4px",
    });

    const previousPosition = paneEl.style.position;
    if (getComputedStyle(paneEl).position === "static") {
      paneEl.style.position = "relative";
    }
    paneEl.appendChild(labelEl);

    return () => {
      labelEl.remove();
      paneEl.style.position = previousPosition;
    };
  });
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
    return "candle_pane";
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
    return "candle_pane";
  }
  if (name === "VOL") {
    // Pane phụ luôn hiển thị dòng tên chỉ báo ở góc trên.
    return chart.createIndicator(
      {
        name: "VOL",
        calcParams: [],
        styles: { tooltip: SUB_PANE_INDICATOR_TOOLTIP },
      },
      false,
      getFixedIndicatorPaneOptions(),
    );
  }
  const pane = getIndicatorDefinition(name)?.pane;
  const createValue = getIndicatorCreateValue(name, indicatorConfigs);
  if (pane === "candle_pane") {
    chart.createIndicator(createValue, true, { id: "candle_pane" });
    return "candle_pane";
  } else {
    return chart.createIndicator(
      withSubPaneIndicatorTooltip(createValue),
      false,
      getFixedIndicatorPaneOptions(),
    ); // pane riêng
  }
}

function getOrderedActiveIndicators(activeKey) {
  const names = activeKey.split(",").filter(Boolean);
  const isCandlePaneIndicator = (name) =>
    getIndicatorDefinition(name)?.pane === "candle_pane";

  return [
    ...names.filter(isCandlePaneIndicator),
    ...names.filter((name) => name === "VOL"),
    ...names.filter((name) => name !== "VOL" && !isCandlePaneIndicator(name)),
  ];
}

function getPanePriceRangeSnapshot(chart, paneIds) {
  const snapshot = [];
  paneIds.forEach((paneId) => {
    try {
      const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
      const range = axis?.getRange?.();
      if (
        axis &&
        axis.getAutoCalcTickFlag?.() === false &&
        range &&
        range.realFrom !== range.realTo
      ) {
        snapshot.push({ paneId, range });
      }
    } catch {
      // Internal KLineCharts API changed; skip restoring this pane.
    }
  });
  return snapshot;
}

function restorePanePriceRangeSnapshot(chart, snapshot) {
  snapshot.forEach(({ paneId, range }) => {
    try {
      const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
      if (!axis) return;
      axis.setAutoCalcTickFlag?.(false);
      axis.setRange?.(range);
    } catch {
      // Internal KLineCharts API changed; leave native autoscale behavior.
    }
  });
}

// Cùng một stream dữ liệu đang chảy (tick/append realtime) hay dataset bị THAY
// THẾ (lần tải đầu, đổi mã, đổi khung)? So nến đầu + nến tại vị trí cuối của
// data hiện có: tick chỉ đổi giá trị nến cuối, append chỉ thêm nến mới phía sau.
//
// CHỈ so timestamp là KHÔNG đủ: hai mã khác nhau ở cùng khung NGÀY có chuỗi nến
// trùng khít timestamp theo từng index (cùng lịch phiên) và cùng độ dài — vd
// VNINDEX (~1270) và ACB (~18) đều 375 nến, cùng first/last ts. Khi đó check
// timestamp báo "cùng stream" nhầm → chỉ update nến cuối, để nến mã cũ vẽ đè
// lên mã mới. Nến ĐẦU không bao giờ đổi trong một stream sống (tick chỉ chạm
// nến cuối, append chỉ thêm phía sau) nên GIÁ nến đầu phân biệt được đổi mã.
function isSameFirstCandle(a, b) {
  return (
    a?.open === b?.open &&
    a?.high === b?.high &&
    a?.low === b?.low &&
    a?.close === b?.close
  );
}

function isSameLiveDataStream(currentData, nextData) {
  if (currentData.length === 0 || nextData.length === 0) return false;
  if (currentData[0]?.timestamp !== nextData[0]?.timestamp) return false;
  if (!isSameFirstCandle(currentData[0], nextData[0])) return false;
  if (nextData.length < currentData.length) return false;

  const lastCurrentIndex = currentData.length - 1;
  return (
    nextData[lastCurrentIndex]?.timestamp ===
    currentData[lastCurrentIndex]?.timestamp
  );
}

// Bật lại auto-fit trục giá của các pane — gọi khi dataset bị thay thế để lần
// vẽ kế tiếp trục ôm dải giá của data mới (mã mới có thể ở dải giá khác hẳn).
function refitPaneAxes(chart, paneIds) {
  paneIds.forEach((paneId) => {
    try {
      chart
        .getDrawPaneById?.(paneId)
        ?.getAxisComponent?.()
        ?.setAutoCalcTickFlag?.(true);
    } catch {
      // API nội bộ đổi → để autoscale mặc định của lib tự lo
    }
  });
}

// Update data trên chart hiện có, không dispose/init lại chart (data realtime
// vào chart mà không làm trắng trang).
export function updateChartData(chart, candles, paneIds = []) {
  const data = toKLineData(candles);
  if (data.length === 0 && (chart.getDataList?.()?.length ?? 0) > 0) {
    return;
  }
  const currentData = chart.getDataList?.() ?? [];
  const sameStream = data.length > 0 && isSameLiveDataStream(currentData, data);
  const priceRangeSnapshot = sameStream
    ? getPanePriceRangeSnapshot(chart, paneIds)
    : [];

  if (sameStream && typeof chart.updateData === "function") {
    for (let i = currentData.length - 1; i < data.length; i += 1) {
      chart.updateData(data[i]);
    }
  } else {
    // Reset auto-fit only when the dataset is replaced (initial load, symbol/timeframe change).
    // Same-stream realtime ticks keep the user price range only after manual zoom/pan.
    if (!sameStream && data.length > 0) refitPaneAxes(chart, paneIds);
    chart.applyNewData(data);
  }

  if (sameStream) {
    if (priceRangeSnapshot.length > 0) {
      restorePanePriceRangeSnapshot(chart, priceRangeSnapshot);
      chart.adjustPaneViewport?.(false, true, true, true);
    }
  } else {
    chart.resize?.();
    requestAnimationFrame(() => chart.resize?.());
  }
}
const YAXIS_DOUBLE_TAP_MS = 500;

// Zoom dải giá trị bằng MỘT NGÓN kéo dọc trên trục Y — dành cho điện thoại.
// Trước đây chuyển touch → chuột giả cho klinecharts tự xử lý, nhưng klinecharts
// chỉ zoom khi con trỏ còn NẰM TRONG widget trục Y của đúng pane; pane chỉ báo
// thấp (~160px) nên vừa vuốt ra ngoài là zoom dừng. Touch event luôn bắn về
// element bắt đầu chạm nên tự zoom trực tiếp thì kéo xa mấy cũng không dừng.
// Kéo xuống → giãn dải (đồ thị nhỏ lại), kéo lên → co dải (phóng to) — cùng
// công thức scale = pageY/startPageY klinecharts dùng cho chuột. Chạm ĐÚP vào
// trục → bật lại auto-fit (khớp hành vi double-click chuột của klinecharts).
function enableMobileYAxisTouchZoom(chart, paneId = "candle_pane") {
  const yAxisElement = chart.getDom?.(paneId, DomPosition.YAxis);
  if (!yAxisElement) return () => {};

  yAxisElement.style.touchAction = "none";

  let activeTouchId = null;
  let startPageY = 1;
  let startRange = null;
  let moved = false;
  let lastTapAt = 0;

  const getAxis = () => {
    try {
      return chart.getDrawPaneById?.(paneId)?.getAxisComponent?.() ?? null;
    } catch {
      return null;
    }
  };

  const findTouch = (touches) => {
    // TouchList không iterable bằng for...of trên nhiều trình duyệt mobile →
    // duyệt theo chỉ số.
    for (let i = 0; i < touches.length; i += 1) {
      if (touches[i].identifier === activeTouchId) return touches[i];
    }
    return null;
  };

  const pageYOf = (touch) => touch.pageY ?? touch.clientY;

  const onTouchStart = (event) => {
    if (activeTouchId !== null || event.touches.length !== 1) return;
    const touch = event.changedTouches[0];
    activeTouchId = touch.identifier;
    startPageY = Math.max(pageYOf(touch), 1);
    startRange = getAxis()?.getRange?.() ?? null;
    moved = false;
    event.preventDefault();
  };

  const onTouchMove = (event) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.changedTouches);
    if (!touch) return;
    event.preventDefault();
    const axis = getAxis();
    if (!axis || !startRange) return;
    const scale = pageYOf(touch) / startPageY;
    if (!Number.isFinite(scale) || scale <= 0) return;
    if (
      Math.abs(pageYOf(touch) - startPageY) > MOBILE_CROSSHAIR_MOVE_TOLERANCE
    ) {
      moved = true;
    }
    try {
      // Tắt auto-fit để dải vừa zoom không bị fit đè lại ở lần vẽ sau
      axis.setAutoCalcTickFlag?.(false);
      const newRange = Math.max(startRange.range * scale, Number.EPSILON);
      const difRange = (newRange - startRange.range) / 2;
      const newFrom = startRange.from - difRange;
      const newTo = startRange.to + difRange;
      const realFrom = axis.convertToRealValue(newFrom);
      const realTo = axis.convertToRealValue(newTo);
      axis.setRange({
        from: newFrom,
        to: newTo,
        range: newTo - newFrom,
        realFrom,
        realTo,
        realRange: realTo - realFrom,
      });
      chart.adjustPaneViewport?.(false, true, true, true);
    } catch {
      activeTouchId = null; // API nội bộ đổi → ngừng, không làm hỏng chart
    }
  };

  const endTouch = (event) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.changedTouches);
    if (!touch) return;
    event.preventDefault();
    activeTouchId = null;
    startRange = null;
    if (moved) {
      lastTapAt = 0;
      return;
    }
    const now = Date.now();
    if (now - lastTapAt < YAXIS_DOUBLE_TAP_MS) {
      lastTapAt = 0;
      try {
        getAxis()?.setAutoCalcTickFlag?.(true);
        chart.adjustPaneViewport?.(false, true, true, true);
      } catch {
        // API nội bộ đổi → bỏ qua, không làm hỏng chart
      }
    } else {
      lastTapAt = now;
    }
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

// Cho phép KÉO DỌC bằng chuột để PAN khung giá (giữ nguyên mức zoom). KLineChart
// hỗ trợ sẵn pan trục Y ở pane chính nhưng CHỈ khi auto-fit (autoCalcTickFlag)
// tắt + scrollZoom bật (mặc định bật). Trước đây tắt auto-fit bằng poll rAF "đợi
// fit xong" — race với draw trễ của lib (>30 frame sau applyNewData) và với
// resize (mở panel) nên hay đóng băng nhầm range cũ → data mới vẽ ngoài khung
// nhìn, chart trắng. Nay đóng băng LƯỜI: chỉ tắt auto-fit đúng lúc người dùng
// ĐẶT CHUỘT xuống pane/trục giá (range lúc đó chắc chắn là range đã fit đang
// hiển thị) — mọi lúc khác trục tự auto-fit theo data. Double-click vào trục
// giá vẫn bật lại auto-fit (hành vi gốc của klinecharts). Touch không cần lo:
// các handler mobile tự setRange (setRange của lib tự tắt auto-fit).
function enablePriceAxisPan(chart, paneId = "candle_pane") {
  const targets = [
    chart.getDom?.(paneId, DomPosition.Main),
    chart.getDom?.(paneId, DomPosition.YAxis),
  ].filter(Boolean);
  if (targets.length === 0) return () => {};

  const freeze = () => {
    try {
      const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
      const range = axis?.getRange?.();
      const hasData = (chart.getDataList?.()?.length ?? 0) > 0;
      // Chart rỗng có range "hợp lệ" giả (calcRange trả mặc định 0–10 khi không
      // có nến) — không đóng băng lúc đó.
      if (axis && hasData && range && range.realFrom !== range.realTo) {
        axis.setAutoCalcTickFlag(false); // giữ khung giá hiện tại → cho phép pan
      }
    } catch {
      // API nội bộ không còn → bỏ qua, không làm hỏng chart
    }
  };

  // capture: chạy trước handler kéo của klinecharts trong cùng cú nhấn chuột.
  targets.forEach((el) =>
    el.addEventListener("mousedown", freeze, { capture: true }),
  );
  return () => {
    targets.forEach((el) =>
      el.removeEventListener("mousedown", freeze, { capture: true }),
    );
  };
}

// Đặt crosshair theo point có sẵn; trả về point nếu thành công để caller lưu
// lại vị trí ghim (áp lại sau khi kéo/cuộn).
function applyMobileCrosshair(chart, point) {
  try {
    chart.getChartStore?.()?.getTooltipStore?.()?.setCrosshair?.(point);
    return point;
  } catch {
    // Internal API changed; leave native chart gestures untouched.
    return null;
  }
}

function getMobileCrosshairPoint(paneId, element, touch) {
  const rect = element.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
    paneId,
  };
}

function mobileCrosshairPointHasData(chart, paneId, point) {
  try {
    const dataList =
      chart.getDataList?.() ?? chart.getChartStore?.()?.getDataList?.() ?? [];
    if (dataList.length === 0) return false;

    const converted = chart.convertFromPixel?.([point], { paneId });
    const convertedPoint = Array.isArray(converted) ? converted[0] : converted;
    let dataIndex = convertedPoint?.dataIndex;
    if (!Number.isInteger(dataIndex)) {
      dataIndex = chart
        .getChartStore?.()
        ?.getTimeScaleStore?.()
        ?.coordinateToDataIndex?.(point.x);
    }
    return (
      Number.isInteger(dataIndex) &&
      dataIndex >= 0 &&
      dataIndex < dataList.length
    );
  } catch {
    return false;
  }
}

function setMobileCrosshair(chart, paneId, element, touch) {
  try {
    return applyMobileCrosshair(
      chart,
      getMobileCrosshairPoint(paneId, element, touch),
    );
  } catch {
    // Internal API changed; leave native chart gestures untouched.
    return null;
  }
}

function clearMobileCrosshair(chart) {
  try {
    chart.getChartStore?.()?.getTooltipStore?.()?.setCrosshair?.();
  } catch {
    // Internal API changed; leave native chart gestures untouched.
  }
}

// Pan KHUNG GIÁ bằng VUỐT DỌC trên thân biểu đồ — DÀNH RIÊNG cho điện thoại.
// KLineChart xử lý touch ở pane chính (touchMoveEvent) CHỈ cuộn ngang thời gian,
// KHÔNG pan trục Y như đường chuột — nên ta tự pan: vuốt dọc 1 ngón → dịch dải
// giá trục Y (giữ nguyên độ rộng = giữ zoom). Vuốt ngang vẫn để klinecharts cuộn
// thời gian; 2 ngón vẫn để klinecharts pinch-zoom. Dùng API runtime nội bộ, bọc
// try/catch để an toàn nếu klinecharts đổi nội bộ ở bản khác.
function enableMobilePriceTouchPan(chart, paneId = "candle_pane") {
  const mainEl = chart.getDom?.(paneId, DomPosition.Main);
  if (!mainEl) return () => {};
  const rootEl = mainEl.ownerDocument?.documentElement;
  if (!rootEl) return () => {};

  let activeId = null;
  let startY = 0;
  let startX = 0;
  let startRange = null;
  let height = 1;
  let pinchStart = null;
  let longPressTimerId = 0;
  let crosshairActive = false;
  // Crosshair đã GHIM (nhấc tay sau khi giữ lâu): giữ nguyên vị trí cho tới khi
  // người dùng TAP nhanh vào chart; kéo/cuộn/pinch không làm mất.
  let crosshairPinned = false;
  let pinnedCrosshair = null;
  let movedBeyondTolerance = false;

  const getAxis = () => {
    try {
      return chart.getDrawPaneById?.(paneId)?.getAxisComponent?.() ?? null;
    } catch {
      return null;
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerId) {
      clearTimeout(longPressTimerId);
      longPressTimerId = 0;
    }
  };

  const findActiveTouch = (touches) => {
    // TouchList không iterable bằng for...of trên nhiều trình duyệt mobile →
    // duyệt theo chỉ số.
    for (let i = 0; i < touches.length; i += 1) {
      if (touches[i].identifier === activeId) return touches[i];
    }
    return null;
  };

  const onStart = (event) => {
    if (event.touches.length === 2) {
      clearLongPressTimer();
      crosshairActive = false;
      const range = getAxis()?.getRange?.();
      if (!range) return;
      const a = event.touches[0];
      const b = event.touches[1];
      const dy = Math.abs(b.clientY - a.clientY);
      const dx = Math.abs(b.clientX - a.clientX);
      activeId = null;
      pinchStart = {
        dy: Math.max(dy, 1),
        dx: Math.max(dx, 1),
        centerY: (a.clientY + b.clientY) / 2,
        range,
        height: mainEl.clientHeight || 1,
      };
      return;
    }
    if (event.touches.length !== 1) {
      clearLongPressTimer();
      crosshairActive = false;
      activeId = null; // 2 ngón → nhường klinecharts pinch-zoom
      return;
    }
    const touch = event.changedTouches[0];
    activeId = touch.identifier;
    startX = touch.clientX;
    startY = touch.clientY;
    startRange = getAxis()?.getRange?.() ?? null;
    height = mainEl.clientHeight || 1;
    crosshairActive = false;
    movedBeyondTolerance = false;
    clearLongPressTimer();
    longPressTimerId = setTimeout(() => {
      if (activeId !== touch.identifier) return;
      crosshairActive = true;
      pinnedCrosshair =
        setMobileCrosshair(chart, paneId, mainEl, touch) ?? pinnedCrosshair;
    }, MOBILE_CROSSHAIR_DELAY);
  };

  const onMove = (event) => {
    if (crosshairActive) {
      const touch =
        findActiveTouch(event.touches) ?? findActiveTouch(event.changedTouches);
      if (!touch) return;
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      pinnedCrosshair =
        setMobileCrosshair(chart, paneId, mainEl, touch) ?? pinnedCrosshair;
      return;
    }

    if (event.touches.length === 2 && pinchStart) {
      clearLongPressTimer();
      const a = event.touches[0];
      const b = event.touches[1];
      const dy = Math.max(Math.abs(b.clientY - a.clientY), 1);
      const dx = Math.max(Math.abs(b.clientX - a.clientX), 1);
      const verticalChange = Math.abs(dy - pinchStart.dy);
      const horizontalChange = Math.abs(dx - pinchStart.dx);
      if (verticalChange <= horizontalChange) return;

      const axis = getAxis();
      if (!axis) return;
      event.preventDefault?.();
      try {
        const zoom = pinchStart.dy / dy;
        const start = pinchStart.range;
        const centerRate = 1 - pinchStart.centerY / pinchStart.height;
        const center = start.from + start.range * centerRate;
        const nextRange = Math.max(start.range * zoom, Number.EPSILON);
        const newFrom = center - nextRange * centerRate;
        const newTo = newFrom + nextRange;
        const realFrom = axis.convertToRealValue(newFrom);
        const realTo = axis.convertToRealValue(newTo);
        axis.setRange({
          from: newFrom,
          to: newTo,
          range: newTo - newFrom,
          realFrom,
          realTo,
          realRange: realTo - realFrom,
        });
        chart.adjustPaneViewport?.(false, true, true, true);
      } catch {
        pinchStart = null;
      }
      return;
    }

    if (activeId === null || event.touches.length !== 1) {
      clearLongPressTimer();
      activeId = null;
      return;
    }
    let touch = null;
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      if (event.changedTouches[i].identifier === activeId) {
        touch = event.changedTouches[i];
        break;
      }
    }
    if (!touch) return;

    const dy = touch.clientY - startY;
    const dx = touch.clientX - startX;
    if (
      Math.abs(dx) > MOBILE_CROSSHAIR_MOVE_TOLERANCE ||
      Math.abs(dy) > MOBILE_CROSSHAIR_MOVE_TOLERANCE
    ) {
      movedBeyondTolerance = true; // hết là tap → không xóa crosshair đã ghim
      clearLongPressTimer();
    }
    // Chỉ pan khi vuốt DỌC trội hơn ngang (ngang nhường klinecharts cuộn thời gian).
    if (
      paneId === "candle_pane" &&
      crosshairPinned &&
      Math.abs(dy) > Math.abs(dx)
    ) {
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      pinnedCrosshair =
        setMobileCrosshair(chart, paneId, mainEl, touch) ?? pinnedCrosshair;
      return;
    }

    if (Math.abs(dy) <= Math.abs(dx)) return;

    if (paneId !== "candle_pane") {
      const axis = getAxis();
      if (!axis || !startRange) return;
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      try {
        axis.setAutoCalcTickFlag?.(false);
        const zoom = Math.max((height + dy) / height, Number.EPSILON);
        const centerRate = 1 - startY / height;
        const center = startRange.from + startRange.range * centerRate;
        const nextRange = Math.max(startRange.range * zoom, Number.EPSILON);
        const newFrom = center - nextRange * centerRate;
        const newTo = newFrom + nextRange;
        const realFrom = axis.convertToRealValue(newFrom);
        const realTo = axis.convertToRealValue(newTo);
        axis.setRange({
          from: newFrom,
          to: newTo,
          range: newTo - newFrom,
          realFrom,
          realTo,
          realRange: realTo - realFrom,
        });
        chart.adjustPaneViewport?.(false, true, true, true);
      } catch {
        activeId = null;
      }
      return;
    }
    const axis = getAxis();
    if (!axis || !startRange) return;
    try {
      // Dịch dải giá theo tỉ lệ quãng vuốt / chiều cao pane (giống công thức pan
      // trục Y của đường chuột trong klinecharts). from/to dịch cùng lượng → giữ zoom.
      const difRange = startRange.range * (dy / height);
      const newFrom = startRange.from + difRange;
      const newTo = startRange.to + difRange;
      const realFrom = axis.convertToRealValue(newFrom);
      const realTo = axis.convertToRealValue(newTo);
      axis.setRange({
        from: newFrom,
        to: newTo,
        range: newTo - newFrom,
        realFrom,
        realTo,
        realRange: realTo - realFrom,
      });
      chart.adjustPaneViewport?.(false, true, true, true); // repaint
    } catch {
      activeId = null; // API nội bộ đổi → ngừng, không làm hỏng chart
    }
  };

  const onEnd = (event) => {
    clearLongPressTimer();
    if (crosshairActive) {
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      // Nhấc tay sau khi giữ lâu → GHIM crosshair tại vị trí cuối cùng.
      crosshairPinned = true;
    } else if (crosshairPinned) {
      const endedTouch =
        activeId !== null ? findActiveTouch(event.changedTouches) : null;
      const endedActiveTouch = endedTouch !== null;
      if (endedTouch && !movedBeyondTolerance) {
        const tapPoint = getMobileCrosshairPoint(paneId, mainEl, endedTouch);
        if (mobileCrosshairPointHasData(chart, paneId, tapPoint)) {
          pinnedCrosshair =
            applyMobileCrosshair(chart, tapPoint) ?? pinnedCrosshair;
        } else {
        // Tap nhanh khi đang ghim → xóa crosshair.
          crosshairPinned = false;
          pinnedCrosshair = null;
          clearMobileCrosshair(chart);
        }
      } else if (pinnedCrosshair && (endedActiveTouch || pinchStart)) {
        // Kéo/cuộn/pinch xong → klinecharts có thể đã vẽ đè hoặc xóa crosshair
        // trong lúc thao tác; áp lại đúng vị trí đã ghim.
        applyMobileCrosshair(chart, pinnedCrosshair);
      }
    }
    activeId = null;
    pinchStart = null;
    crosshairActive = false;
  };

  const touchMoveOptions = { passive: false, capture: true };
  const touchEndOptions = { capture: true };

  mainEl.addEventListener("touchstart", onStart, { passive: true });
  rootEl.addEventListener("touchmove", onMove, touchMoveOptions);
  rootEl.addEventListener("touchend", onEnd, touchEndOptions);
  rootEl.addEventListener("touchcancel", onEnd, touchEndOptions);

  return () => {
    clearLongPressTimer();
    clearMobileCrosshair(chart);
    mainEl.removeEventListener("touchstart", onStart);
    rootEl.removeEventListener("touchmove", onMove, touchMoveOptions);
    rootEl.removeEventListener("touchend", onEnd, touchEndOptions);
    rootEl.removeEventListener("touchcancel", onEnd, touchEndOptions);
  };
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
  indicatorConfigs = EMPTY_INDICATOR_CONFIGS,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null); // giữ instance để thanh công cụ vẽ gọi createOverlay
  const paneIdsRef = useRef(new Set(["candle_pane"]));
  const candlesRef = useRef(candles);
  const signalsRef = useRef(signals);

  candlesRef.current = candles;
  signalsRef.current = signals;

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
      xAxis: {
        axisLine: { show: false, color: "transparent", size: 0 },
        tickLine: { show: false, color: "transparent", size: 0, length: 0 },
      },
      yAxis: {
        size: PRICE_AXIS_SIZE,
        axisLine: { show: false, color: "transparent", size: 0 },
        tickLine: { show: false, color: "transparent", size: 0, length: 0 },
      },
      separator: {
        // KLineCharts uses the separator pane as the drag handle for resizing
        // indicator panes. Keep it transparent, but never set the size to 0.
        size: DRAGGABLE_SEPARATOR_SIZE,
        color: "transparent",
        fill: false,
        activeBackgroundColor: "rgba(37, 99, 235, 0.08)",
      },
      crosshair: {
        show: true,
        horizontal: {
          show: true,
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 2],
            size: 1,
            color: "rgba(17, 24, 39, 0.55)",
          },
          text: {
            show: true,
            color: "#fff",
            backgroundColor: "#111827",
          },
        },
        vertical: {
          show: true,
          line: {
            show: true,
            style: "dashed",
            dashedValue: [4, 2],
            size: 1,
            color: "rgba(17, 24, 39, 0.45)",
          },
          text: {
            show: true,
            color: "#fff",
            backgroundColor: "#111827",
          },
        },
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
        // PHẢI tắt lastValueMark của thư viện: nhãn giá trị chỉ báo do
        // attachIndicatorAxisLabels tự vẽ (có chống chồng lấn, né nhãn giá
        // nến). Bật lại đây sẽ vẽ ĐÔI nhãn và chúng lại đè lên nhau.
        lastValueMark: {
          show: false,
          text: { show: false },
        },
        tooltip: { showRule: "none" }, // ẩn dòng EMA(10,20,50), BOLL(20,2)...
      },
    });

    // API trả time unix giây → KLineChart cần timestamp ms; bỏ bản ghi hỏng
    // Chỉ báo do người dùng chọn
    chart.applyNewData(toKLineData(candlesRef.current));
    chart.resize?.();

    const paneIds = new Set(["candle_pane"]);
    const subPaneIndicators = [];
    getOrderedActiveIndicators(activeKey).forEach((name) => {
      const paneId = addIndicator(chart, name, indicatorConfigs);
      if (paneId) {
        paneIds.add(paneId);
        if (paneId !== "candle_pane") {
          subPaneIndicators.push({ paneId, name });
        }
      }
    });
    paneIdsRef.current = paneIds;

    // Bollinger + fill xanh/đỏ theo tín hiệu — signals truyền qua extendData
    syncBbsIndicator(chart, signalsRef.current);
    syncSignalOverlays(chart, signalsRef.current);

    // Markers mua/bán
    // KLineChart v9 không tự autoSize theo container
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(container);
    const disableMobilePaneGestures = [...paneIds].flatMap((paneId) => [
      enableMobileYAxisTouchZoom(chart, paneId),
      enablePriceAxisPan(chart, paneId),
      enableMobilePriceTouchPan(chart, paneId),
    ]);
    // Nhãn giá trị cuối của chỉ báo trên trục giá, tự né nhau (thay cho
    // lastValueMark của thư viện vốn để nhãn chồng lên nhau)
    const detachAxisLabels = [...paneIds].map((paneId) =>
      attachIndicatorAxisLabels(chart, paneId),
    );
    const detachPaneLabels = attachSubPaneIndicatorLabels(
      chart,
      subPaneIndicators,
    );

    return () => {
      detachPaneLabels.forEach((detach) => detach());
      detachAxisLabels.forEach((detach) => detach());
      disableMobilePaneGestures.forEach((disable) => disable());
      ro.disconnect();
      dispose(container);
      chartRef.current = null;
    };
  // CHANGE: không phụ thuộc candles/signals để tránh dispose/init chart khi data realtime poll.
  }, [activeKey, indicatorConfigs]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    // CHANGE: candles mới chỉ update data trên chart hiện có, không tạo chart mới.
    updateChartData(chart, candles, [...paneIdsRef.current]);
  }, [candles]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    // CHANGE: signals mới chỉ sync overlay/indicator, không init lại chart.
    syncBbsIndicator(chart, signals);
    syncSignalOverlays(chart, signals);
  }, [signals]);
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
