const STEP_LINE_SHAPES = new Set([
  "step",
  "step-break",
  "diamond-step",
  "frequency",
  "cross",
  "area",
  "area-break",
  "columns",
  "circles",
]);

const AREA_FILL_ALPHA = 0.62;

export function isStepLineShape(shape) {
  return STEP_LINE_SHAPES.has(shape);
}

function getVisibleRangeBounds(visibleRange, length) {
  const from = Math.max(
    0,
    Math.floor(visibleRange.realFrom ?? visibleRange.from ?? 0),
  );
  const to = Math.min(
    length,
    Math.ceil(visibleRange.realTo ?? visibleRange.to ?? length),
  );
  return { from, to };
}

function isDrawableStyle(style) {
  return (
    style &&
    Number(style.size) > 0 &&
    style.color !== "rgba(0,0,0,0)"
  );
}

function drawStepPath(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index - 1].y);
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.stroke();
}

function colorWithAlpha(color, alpha) {
  const rawColor = String(color ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(rawColor)) {
    const red = parseInt(rawColor.slice(1, 3), 16);
    const green = parseInt(rawColor.slice(3, 5), 16);
    const blue = parseInt(rawColor.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbMatch = rawColor.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i,
  );
  if (!rgbMatch) return `rgba(255, 51, 68, ${alpha})`;

  const [red, green, blue] = rgbMatch
    .slice(1, 4)
    .map((component) => Math.min(255, Math.max(0, Number(component))));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawDiamond(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function drawDiamondMarkers(ctx, points, style) {
  if (style.shape !== "diamond-step") return;

  const lineSize = Number(style.size) || 1;
  const outerRadius = Math.max(8, lineSize * 4 + 4);
  const innerRadius = Math.max(4, lineSize * 2 + 2);

  points.forEach(({ x, y }) => {
    ctx.fillStyle = colorWithAlpha(style.color, 0.16);
    drawDiamond(ctx, x, y, outerRadius);
    ctx.fill();

    ctx.fillStyle = style.color;
    drawDiamond(ctx, x, y, innerRadius);
    ctx.fill();
  });
}

function drawFrequency(ctx, points, style, bounding) {
  if (style.shape !== "frequency") return false;

  const bottom = Number.isFinite(bounding?.height) ? bounding.height : 0;
  const markerRadius = Math.max(5, (Number(style.size) || 1) + 3);

  points.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = Number(style.size) || 1;
    ctx.setLineDash?.([]);
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#2962FF";
    ctx.lineWidth = 1;
    ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  return true;
}

function getColumnWidth(points, style) {
  const spacing = points.reduce((minimum, point, index) => {
    if (index === 0) return minimum;
    const distance = Math.abs(point.x - points[index - 1].x);
    return distance > 0 ? Math.min(minimum, distance) : minimum;
  }, Number.POSITIVE_INFINITY);

  if (Number.isFinite(spacing)) return Math.max(2, spacing * 0.76);
  return Math.max(2, (Number(style.size) || 1) * 4);
}

function drawColumns(ctx, points, style, bounding) {
  if (style.shape !== "columns") return false;

  const bottom = Number.isFinite(bounding?.height) ? bounding.height : 0;
  const columnWidth = getColumnWidth(points, style);

  ctx.fillStyle = style.color;
  ctx.setLineDash?.([]);
  points.forEach(({ x, y }) => {
    const top = Math.min(y, bottom);
    const height = Math.abs(bottom - y);
    ctx.fillRect?.(x - columnWidth / 2, top, columnWidth, height);
  });

  return true;
}

function drawCircleMarkers(ctx, points, radius) {
  points.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#2962FF";
    ctx.lineWidth = 1;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawSolidCircleMarkers(ctx, points, style) {
  if (style.shape !== "circles") return false;

  const radius = Math.max(3, (Number(style.size) || 1) + 1);
  ctx.fillStyle = style.color;
  ctx.setLineDash?.([]);

  points.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  return true;
}

function drawCrossMarkers(ctx, points, style) {
  if (style.shape !== "cross") return false;

  const radius = Math.max(4, (Number(style.size) || 1) * 2);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = Number(style.size) || 1;
  ctx.setLineDash?.([]);

  points.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.moveTo(x - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x, y + radius);
    ctx.stroke();
  });

  return true;
}

function drawArea(ctx, points, style, bounding) {
  if (!["area", "area-break"].includes(style.shape)) return false;
  if (points.length === 0) return true;

  const bottom = Number.isFinite(bounding?.height) ? bounding.height : 0;
  const markerRadius = Math.max(5, (Number(style.size) || 1) + 3);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.lineTo(points[points.length - 1].x, bottom);
  ctx.lineTo(points[0].x, bottom);
  ctx.closePath();
  ctx.fillStyle = colorWithAlpha(style.color, AREA_FILL_ALPHA);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = Number(style.size) || 1;
  ctx.setLineDash?.(style.shape === "area-break" ? style.dashedValue : []);
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.stroke();

  if (style.shape === "area") {
    drawCircleMarkers(ctx, points, markerRadius);
  }

  return true;
}

export function drawConfiguredStepLines({
  ctx,
  bounding,
  indicator,
  visibleRange,
  xAxis,
  yAxis,
}) {
  const stepLineStyles = indicator.extendData?.stepLineStyles ?? [];
  if (!stepLineStyles.some(Boolean)) return false;

  const result = indicator.result ?? [];
  const lineFigures = (indicator.figures ?? []).filter(
    (figure) => figure.type === "line",
  );
  const { from, to } = getVisibleRangeBounds(visibleRange, result.length);

  stepLineStyles.forEach((style, lineIndex) => {
    if (!isDrawableStyle(style)) return;
    const figure = lineFigures[lineIndex];
    if (!figure?.key) return;

    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = Number(style.size) || 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.setLineDash?.(style.style === "dashed" ? style.dashedValue : []);

    let points = [];
    const flush = () => {
      if (
        !drawColumns(ctx, points, style, bounding) &&
        !drawFrequency(ctx, points, style, bounding) &&
        !drawSolidCircleMarkers(ctx, points, style) &&
        !drawCrossMarkers(ctx, points, style) &&
        !drawArea(ctx, points, style, bounding)
      ) {
        drawStepPath(ctx, points);
        drawDiamondMarkers(ctx, points, style);
      }
      points = [];
    };
    for (let dataIndex = from; dataIndex < to; dataIndex += 1) {
      const value = result[dataIndex]?.[figure.key];
      if (!Number.isFinite(value)) {
        flush();
        continue;
      }
      points.push({
        x: xAxis.convertToPixel(dataIndex),
        y: yAxis.convertToPixel(value),
      });
    }
    flush();
    ctx.restore();
  });

  return false;
}
