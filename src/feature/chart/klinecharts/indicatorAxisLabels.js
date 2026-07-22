// Nhãn giá trị cuối của chỉ báo trên trục giá. KLineChart chỉ có
// lastValueMark vẽ mỗi nhãn đúng tại giá trị của nó — nhiều đường nằm sát
// nhau là nhãn chồng lên nhau. Module này tự vẽ nhãn lên một canvas phủ
// trên widget yAxis và đẩy các nhãn tách nhau ra khi trùng vị trí, đồng
// thời né nhãn giá nến hiện tại (do thư viện vẽ, không di chuyển được).
import { DomPosition } from "klinecharts/dist/index.esm.js";

const LABEL_HEIGHT = 14;
const LABEL_GAP = 2;
const LABEL_FONT = "600 11px Helvetica Neue, Helvetica, Arial, sans-serif";
const LABEL_PADDING_X = 1;
const MIN_AXIS_LABEL_WIDTH = 30;
const CROSSHAIR_LABEL_COLOR = "#111827";
const MILLION = 1_000_000;
const LABEL_SHIFT_LEFT = 4;
const AXIS_LABEL_WIDTH_REQUESTS_KEY = "__leoAxisLabelWidthRequests";
const AXIS_LABEL_APPLIED_WIDTH_KEY = "__leoAxisLabelAppliedWidth";

export function getAxisLabelWidth(textWidth) {
  return Math.ceil(Math.max(MIN_AXIS_LABEL_WIDTH, textWidth + LABEL_PADDING_X * 2));
}

export function getRequiredAxisLabelWidth(items, measureTextWidth) {
  return items.reduce((maxWidth, item) => {
    if (item.fixed) return maxWidth;
    const text = formatAxisLabel(item);
    return Math.max(maxWidth, getAxisLabelWidth(measureTextWidth(text)));
  }, MIN_AXIS_LABEL_WIDTH);
}

function syncChartAxisLabelWidth(chart, paneId, requiredWidth) {
  const requests = chart[AXIS_LABEL_WIDTH_REQUESTS_KEY] ?? new Map();
  requests.set(paneId, requiredWidth);
  chart[AXIS_LABEL_WIDTH_REQUESTS_KEY] = requests;

  const nextWidth = Math.max(MIN_AXIS_LABEL_WIDTH, ...requests.values());
  if (chart[AXIS_LABEL_APPLIED_WIDTH_KEY] === nextWidth) return false;
  chart[AXIS_LABEL_APPLIED_WIDTH_KEY] = nextWidth;
  chart.setStyles?.({ yAxis: { size: nextWidth } });
  return true;
}

function removeChartAxisLabelWidth(chart, paneId) {
  const requests = chart[AXIS_LABEL_WIDTH_REQUESTS_KEY];
  if (!requests) return;
  requests.delete(paneId);
  if (requests.size === 0) {
    chart[AXIS_LABEL_APPLIED_WIDTH_KEY] = undefined;
    chart.setStyles?.({ yAxis: { size: "auto" } });
    return;
  }
  const nextWidth = Math.max(MIN_AXIS_LABEL_WIDTH, ...requests.values());
  if (chart[AXIS_LABEL_APPLIED_WIDTH_KEY] !== nextWidth) {
    chart[AXIS_LABEL_APPLIED_WIDTH_KEY] = nextWidth;
    chart.setStyles?.({ yAxis: { size: nextWidth } });
  }
}

// Palette default của klinecharts — dùng khi indicator không khai báo màu line
const DEFAULT_LINE_COLORS = [
  "#FF9600",
  "#935EBD",
  "#2196F3",
  "#E11D74",
  "#01C5C4",
];
// BBS: 2 band trắng mờ trên nền fill — nhãn trắng không đọc được, bỏ qua
const SKIP_INDICATORS = new Set(["BBS"]);

export function formatAxisPrice(value, precision = 2) {
  const [int, dec] = value.toFixed(precision).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
}

function formatAxisLabel(item) {
  if (item.unit === "million") {
    return `${(item.value / MILLION).toFixed(item.precision ?? 2)}M`;
  }
  return formatAxisPrice(item.value, item.precision);
}

function getPaneIndicators(chart, paneId) {
  const found = chart.getIndicatorByPaneId(paneId);
  if (!found) return [];
  return typeof found.values === "function" ? [...found.values()] : [found];
}

function isVolumePane(chart, paneId) {
  return getPaneIndicators(chart, paneId).some((indicator) => indicator?.name === "VOL");
}

// Gom giá trị cuối của mọi figure dạng line thuộc các indicator trong pane
function collectLabels(chart, paneId) {
  const indicators = getPaneIndicators(chart, paneId);
  const labels = [];
  indicators.forEach((indicator) => {
    if (!indicator || SKIP_INDICATORS.has(indicator.name)) return;
    const last = indicator.result?.[indicator.result.length - 1];
    if (!last) return;
    const lines = indicator.styles?.lines ?? [];
    const stepLineStyles = indicator.extendData?.stepLineStyles ?? [];
    let lineIndex = -1;
    (indicator.figures ?? []).forEach((figure) => {
      if (figure.type !== "line") return;
      lineIndex += 1;
      const value = last[figure.key];
      if (!Number.isFinite(value)) return;
      const lineStyle = lines[lineIndex];
      const stepLine = stepLineStyles[lineIndex];
      // size 0 và không có step line thay thế → đường đang bị ẩn
      if (lineStyle && lineStyle.size === 0 && !stepLine) return;
      const color =
        stepLine?.color ??
        lineStyle?.color ??
        DEFAULT_LINE_COLORS[lineIndex % DEFAULT_LINE_COLORS.length];
      labels.push({
        value,
        color,
        precision: indicator.precision ?? 2,
      });
    });
  });
  return labels;
}

// Nhãn giá nến của thư viện có padding riêng, cao hơn nhãn chỉ báo
export const ANCHOR_CLEARANCE = 22;

function getItemHeight(item) {
  return item.height ?? LABEL_HEIGHT;
}

function getCenterDistance(a, b) {
  return getItemHeight(a) / 2 + getItemHeight(b) / 2 + LABEL_GAP;
}

// Xếp nhãn quanh MỐC là nhãn giá hiện tại (anchorY, do thư viện vẽ, đứng
// yên): nhãn phía trên mốc dồn dần lên, phía dưới dồn dần xuống, giữ đúng
// thứ tự giá và cách nhau tối thiểu 1 bậc — không nhãn nào đè lên mốc.
export function layoutAroundAnchor(items, anchorY, paneHeight) {
  const anchor = {
    y: anchorY,
    fixed: true,
    height: ANCHOR_CLEARANCE,
    __anchor: true,
  };
  const arranged = [...items, anchor].sort((a, b) => a.y - b.y);
  resolveLabelPositions(arranged, paneHeight);
  return items;
}

// Đẩy các nhãn tách nhau ra tối thiểu 1 bậc (nhãn fixed đứng yên), kẹp trong
// pane. items phải đã sort tăng theo y. Dùng cho pane không có nhãn giá nến.
export function resolveLabelPositions(items, paneHeight) {
  const half = LABEL_HEIGHT / 2;
  const maxY = paneHeight - half;

  items.forEach((item) => {
    if (item.fixed) return;
    item.y = Math.min(Math.max(item.y, half), maxY);
  });

  // Quét xuôi: mỗi nhãn cách nhãn trên tối thiểu 1 bậc. Gặp nhãn fixed bị
  // lấn thì dồn ngược chuỗi nhãn phía trên lên (dừng ở nhãn fixed khác/biên).
  for (let i = 1; i < items.length; i++) {
    const minY = items[i - 1].y + getCenterDistance(items[i - 1], items[i]);
    if (items[i].y >= minY) continue;
    if (!items[i].fixed) {
      items[i].y = minY;
      continue;
    }
    let requiredY = items[i].y - getCenterDistance(items[i - 1], items[i]);
    for (let j = i - 1; j >= 0; j--) {
      if (items[j].fixed || items[j].y <= requiredY) break;
      items[j].y = Math.max(requiredY, half);
      if (j > 0) {
        requiredY = items[j].y - getCenterDistance(items[j - 1], items[j]);
      }
    }
  }

  // Tràn đáy pane → dồn ngược lên từ dưới
  let limit = maxY;
  for (let j = items.length - 1; j >= 0; j--) {
    if (items[j].fixed) {
      limit =
        j > 0 ? items[j].y - getCenterDistance(items[j - 1], items[j]) : half;
      continue;
    }
    if (items[j].y > limit) items[j].y = Math.max(limit, half);
    limit =
      j > 0 ? items[j].y - getCenterDistance(items[j - 1], items[j]) : half;
  }
  return items;
}

function convertValueToY(chart, paneId, value) {
  const pixel = chart.convertToPixel({ value }, { paneId, absolute: false });
  const y = Array.isArray(pixel) ? pixel[0]?.y : pixel?.y;
  return Number.isFinite(y) ? y : null;
}

function convertYToValue(chart, paneId, y) {
  try {
    const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
    const value = axis?.convertFromPixel?.(y);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

// Đọc trực tiếp crosshair hiện tại từ chart thay vì cache qua action
// OnCrosshairChange: khi chuột rời khỏi chart, klinecharts reset crosshair
// về {} (không paneId) nhưng KHÔNG bắn action (ChartImp.crosshairChange chỉ
// execute khi crosshair.paneId là string) — cache qua action bị kẹt ở giá
// trị cuối, khiến nhãn giá đen không bao giờ biến mất khi rê chuột ra ngoài.
function getLiveCrosshairY(chart, paneId) {
  try {
    const crosshair = chart.getChartStore?.()?.getTooltipStore?.()?.getCrosshair?.();
    return crosshair?.paneId === paneId && Number.isFinite(crosshair.y)
      ? crosshair.y
      : null;
  } catch {
    return null;
  }
}

// Chặn trên của trục giá trị (from/to), dùng để tính bề rộng trục thay cho
// giá trị crosshair đang di chuyển. Giá trị dưới con trỏ luôn nằm trong
// [from, to] nên bề rộng nhãn tại 2 biên này CHẶN TRÊN bề rộng mọi nhãn có
// thể xuất hiện khi rê chuột — ổn định qua từng frame, chỉ đổi khi
// zoom/pan/data thay đổi. Dùng giá trị crosshair trực tiếp (như code cũ)
// khiến bề rộng trục đổi liên tục theo từng pixel chuột trên pane VOL (số
// khối lượng nhảy nhiều bậc số hơn giá) → chart.setStyles bị gọi liên tục,
// gây giật khi rê qua chỉ báo VOL.
function getAxisRangeBoundaryLabels(chart, paneId, isVolPane) {
  try {
    const axis = chart.getDrawPaneById?.(paneId)?.getAxisComponent?.();
    const range = axis?.getRange?.();
    if (!range) return [];
    return [range.from, range.to]
      .filter((value) => Number.isFinite(value))
      .map((value) => ({
        value,
        precision: 2,
        ...(isVolPane ? { unit: "million" } : {}),
      }));
  } catch {
    return [];
  }
}

function drawAxisLabel(ctx, item) {
  const text = formatAxisLabel(item);
  const textWidth = ctx.measureText(text).width;
  const boxWidth = getAxisLabelWidth(textWidth);
  const top = item.y - LABEL_HEIGHT / 2;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, top, boxWidth, LABEL_HEIGHT, 2);
  } else {
    ctx.rect(0, top, boxWidth, LABEL_HEIGHT);
  }
  ctx.fillStyle = item.color;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(text, LABEL_PADDING_X, item.y + 0.5);
}

function render(canvas, ctx, items, width, height, topLabels = []) {
  const dpr = window.devicePixelRatio || 1;
  const deviceWidth = Math.round(width * dpr);
  const deviceHeight = Math.round(height * dpr);
  if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
    canvas.width = deviceWidth;
    canvas.height = deviceHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = LABEL_FONT;
  ctx.textBaseline = "middle";
  items.forEach((item) => {
    if (item.fixed) return; // nhãn giá nến do klinecharts tự vẽ
    drawAxisLabel(ctx, item);
  });
  topLabels.forEach((label) => drawAxisLabel(ctx, label));
}

// Gắn canvas nhãn vào yAxis của một pane; trả về hàm gỡ.
// Dùng vòng lặp rAF + so sánh chữ ký để tự bám theo mọi thay đổi (zoom, kéo
// trục giá, resize, đổi dữ liệu) mà không phải subscribe từng loại event.
export function attachIndicatorAxisLabels(chart, paneId = "candle_pane") {
  const axisElement = chart.getDom?.(paneId, DomPosition.YAxis);
  if (!axisElement) return () => {};

  if (getComputedStyle(axisElement).position === "static") {
    axisElement.style.position = "relative";
  }
  axisElement.style.overflow = "visible";
  axisElement.parentElement?.style.setProperty("overflow", "visible");
  axisElement.style.minWidth = `${MIN_AXIS_LABEL_WIDTH}px`;
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    left: `-${LABEL_SHIFT_LEFT}px`,
    top: "0",
    width: `calc(90% + ${LABEL_SHIFT_LEFT}px)`,
    height: "100%",
    pointerEvents: "none",
    zIndex: "2",
  });
  axisElement.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let rafId = 0;
  let lastSignature = "";
  const tick = () => {
    rafId = requestAnimationFrame(tick);
    const width = axisElement.clientWidth;
    const height = axisElement.clientHeight;
    if (!width || !height) return;

    const items = [];
    collectLabels(chart, paneId).forEach((label) => {
      const y = convertValueToY(chart, paneId, label.value);
      if (y !== null) items.push({ ...label, y });
    });
    // Pane nến: lấy nhãn giá hiện tại (thư viện vẽ, đứng yên) làm mốc,
    // các nhãn chỉ báo xếp dần lên trên / xuống dưới quanh mốc này
    let anchorY = null;
    const isVolPane = isVolumePane(chart, paneId);
    // Đọc trực tiếp mỗi frame — không cache qua OnCrosshairChange, action này
    // không bắn khi chuột rời chart nên cache sẽ kẹt ở giá trị cuối.
    const crosshairY = getLiveCrosshairY(chart, paneId);
    let crosshairLabel = null;
    if (crosshairY !== null) {
      const crosshairValue = convertYToValue(chart, paneId, crosshairY);
      if (crosshairValue !== null) {
        crosshairLabel = {
          value: crosshairValue,
          y: crosshairY,
          color: CROSSHAIR_LABEL_COLOR,
          precision: 2,
          ...(isVolPane ? { unit: "million" } : {}),
        };
      }
    }
    if (paneId === "candle_pane") {
      const dataList = chart.getDataList?.() ?? [];
      const lastClose = dataList[dataList.length - 1]?.close;
      if (Number.isFinite(lastClose)) {
        anchorY = convertValueToY(chart, paneId, lastClose);

      }
    } else if (crosshairY !== null) {
      anchorY = crosshairY;
    }
    if (anchorY !== null) {
      layoutAroundAnchor(items, anchorY, height);
    } else {
      items.sort((a, b) => a.y - b.y);
      resolveLabelPositions(items, height);
    }
    items.sort((a, b) => a.y - b.y);

    ctx.font = LABEL_FONT;
    const topLabels = [crosshairLabel].filter(Boolean);
    const boundaryLabels = getAxisRangeBoundaryLabels(chart, paneId, isVolPane);
    const requiredAxisWidth = Math.max(
      getRequiredAxisLabelWidth(items, (text) => ctx.measureText(text).width),
      MIN_AXIS_LABEL_WIDTH,
      ...boundaryLabels.map((label) =>
        getAxisLabelWidth(
          ctx.measureText(formatAxisLabel(label)).width,
        ),
      ),
    );
    const minWidth = `${requiredAxisWidth}px`;
    if (axisElement.style.minWidth !== minWidth) {
      axisElement.style.minWidth = minWidth;
    }
    if (syncChartAxisLabelWidth(chart, paneId, requiredAxisWidth)) {
      lastSignature = "";
      return;
    }

    const signature =
      `${width}x${height}|${anchorY === null ? "" : Math.round(anchorY)}|` +
      topLabels.map((label) => `${label.color}:${label.value}@${Math.round(label.y)}`).join(",") +
      "|" +
      items
        .map((item) => `${item.color}:${item.value}@${Math.round(item.y)}`)
        .join(",");
    if (signature === lastSignature) return;
    lastSignature = signature;
    render(canvas, ctx, items, width, height, topLabels);
  };
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    canvas.remove();
  };
}

