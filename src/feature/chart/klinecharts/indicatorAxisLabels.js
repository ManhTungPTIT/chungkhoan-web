// Nhãn giá trị cuối của chỉ báo trên trục giá. KLineChart chỉ có
// lastValueMark vẽ mỗi nhãn đúng tại giá trị của nó — nhiều đường nằm sát
// nhau là nhãn chồng lên nhau. Module này tự vẽ nhãn lên một canvas phủ
// trên widget yAxis và đẩy các nhãn tách nhau ra khi trùng vị trí, đồng
// thời né nhãn giá nến hiện tại (do thư viện vẽ, không di chuyển được).
import { DomPosition } from "klinecharts/dist/index.esm.js";

const LABEL_HEIGHT = 18;
const LABEL_GAP = 2;
const LABEL_FONT = "600 12px Helvetica Neue, Helvetica, Arial, sans-serif";
const LABEL_PADDING_X = 6;
const MIN_AXIS_LABEL_WIDTH = 76;
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

// Gom giá trị cuối của mọi figure dạng line thuộc các indicator trong pane
function collectLabels(chart, paneId) {
  const found = chart.getIndicatorByPaneId(paneId);
  if (!found) return [];
  const indicators =
    typeof found.values === "function" ? [...found.values()] : [found];

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

// Xếp nhãn quanh MỐC là nhãn giá hiện tại (anchorY, do thư viện vẽ, đứng
// yên): nhãn phía trên mốc dồn dần lên, phía dưới dồn dần xuống, giữ đúng
// thứ tự giá và cách nhau tối thiểu 1 bậc — không nhãn nào đè lên mốc.
export function layoutAroundAnchor(items, anchorY, paneHeight) {
  const step = LABEL_HEIGHT + LABEL_GAP;
  const half = LABEL_HEIGHT / 2;
  const clearance = ANCHOR_CLEARANCE / 2 + LABEL_GAP + half;

  const above = items
    .filter((item) => item.y <= anchorY)
    .sort((a, b) => b.y - a.y);
  const below = items
    .filter((item) => item.y > anchorY)
    .sort((a, b) => a.y - b.y);

  let boundAbove = anchorY - clearance;
  above.forEach((item) => {
    item.y = Math.max(Math.min(item.y, boundAbove), half);
    boundAbove = item.y - step;
  });

  let boundBelow = anchorY + clearance;
  below.forEach((item) => {
    item.y = Math.min(Math.max(item.y, boundBelow), paneHeight - half);
    boundBelow = item.y + step;
  });
  return items;
}

// Đẩy các nhãn tách nhau ra tối thiểu 1 bậc (nhãn fixed đứng yên), kẹp trong
// pane. items phải đã sort tăng theo y. Dùng cho pane không có nhãn giá nến.
export function resolveLabelPositions(items, paneHeight) {
  const step = LABEL_HEIGHT + LABEL_GAP;
  const half = LABEL_HEIGHT / 2;
  const maxY = paneHeight - half;

  items.forEach((item) => {
    if (item.fixed) return;
    item.y = Math.min(Math.max(item.y, half), maxY);
  });

  // Quét xuôi: mỗi nhãn cách nhãn trên tối thiểu 1 bậc. Gặp nhãn fixed bị
  // lấn thì dồn ngược chuỗi nhãn phía trên lên (dừng ở nhãn fixed khác/biên).
  for (let i = 1; i < items.length; i++) {
    const minY = items[i - 1].y + step;
    if (items[i].y >= minY) continue;
    if (!items[i].fixed) {
      items[i].y = minY;
      continue;
    }
    let requiredY = items[i].y - step;
    for (let j = i - 1; j >= 0; j--) {
      if (items[j].fixed || items[j].y <= requiredY) break;
      items[j].y = Math.max(requiredY, half);
      requiredY = items[j].y - step;
    }
  }

  // Tràn đáy pane → dồn ngược lên từ dưới
  let limit = maxY;
  for (let j = items.length - 1; j >= 0; j--) {
    if (items[j].fixed) {
      limit = items[j].y - step;
      continue;
    }
    if (items[j].y > limit) items[j].y = Math.max(limit, half);
    limit = items[j].y - step;
  }
  return items;
}

function convertValueToY(chart, paneId, value) {
  const pixel = chart.convertToPixel({ value }, { paneId, absolute: false });
  const y = Array.isArray(pixel) ? pixel[0]?.y : pixel?.y;
  return Number.isFinite(y) ? y : null;
}

function render(canvas, ctx, items, width, height) {
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
    const text = formatAxisPrice(item.value, item.precision);
    const textWidth = ctx.measureText(text).width;
    const boxWidth = Math.max(MIN_AXIS_LABEL_WIDTH, textWidth + LABEL_PADDING_X * 2);
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
  });
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
  axisElement.style.minWidth = `${MIN_AXIS_LABEL_WIDTH}px`;
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: "100%",
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
    if (paneId === "candle_pane") {
      const dataList = chart.getDataList?.() ?? [];
      const lastClose = dataList[dataList.length - 1]?.close;
      if (Number.isFinite(lastClose)) {
        anchorY = convertValueToY(chart, paneId, lastClose);
      }
    }
    if (anchorY !== null) {
      layoutAroundAnchor(items, anchorY, height);
    } else {
      items.sort((a, b) => a.y - b.y);
      resolveLabelPositions(items, height);
    }
    items.sort((a, b) => a.y - b.y);

    const signature =
      `${width}x${height}|${anchorY === null ? "" : Math.round(anchorY)}|` +
      items
        .map((item) => `${item.color}:${item.value}@${Math.round(item.y)}`)
        .join(",");
    if (signature === lastSignature) return;
    lastSignature = signature;
    render(canvas, ctx, items, width, height);
  };
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    canvas.remove();
  };
}
