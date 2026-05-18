import { LineSeries } from "lightweight-charts";
import { calcBB } from "../untils/indicators";

export function addBollingerBands(
  chart,
  container,
  candleData,
  signals = [],
  options = {},
) {
  const {
    period = 20,
    multiplier = 2,
    upperColor = "rgb(58,113,252)", //duong phia tren
    // middleColor = "rgba(150,150,150,0.5)",
    lowerColor = "rgb(58,113,252)", //duong phia duoi
    lineWidth = 1,
    // ✅ Thêm 2 màu mới thay fillColor cũ
    buyFillColor = "rgba(38,166,154,0.15)", // xanh — vùng MUA→BÁN
    sellFillColor = "rgba(239,83,80,0.15)", // đỏ  — vùng BÁN→MUA
    neutralFill = "rgba(180,180,220,0.08)", // xám — trước signal đầu tiên
  } = options;

  const bb = calcBB(candleData, period, multiplier);
  const base = {
    lineWidth,
    priceLineVisible: false,
    lastValueVisible: true,
    crosshairMarkerVisible: false,
  };

  const upperSeries = chart.addSeries(LineSeries, {
    ...base,
    color: upperColor,
  });
  upperSeries.setData(bb.upper);
  const lowerSeries = chart.addSeries(LineSeries, {
    ...base,
    color: lowerColor,
  });
  lowerSeries.setData(bb.lower);

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100";
  container.appendChild(canvas);

  const drawFill = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    // 1. Build toàn bộ points
    const points = [];
    const len = Math.min(bb.upper.length, bb.lower.length);
    for (let i = 0; i < len; i++) {
      const ux = chart.timeScale().timeToCoordinate(bb.upper[i].time);
      const uy = upperSeries.priceToCoordinate(bb.upper[i].value);
      const lx = chart.timeScale().timeToCoordinate(bb.lower[i].time);
      const ly = lowerSeries.priceToCoordinate(bb.lower[i].value);
      if (ux !== null && uy !== null && lx !== null && ly !== null) {
        points.push({ ux, uy, lx, ly, time: bb.upper[i].time });
      }
    }
    if (points.length < 2) return;

    // 2. Convert signals thành pixel X — chỉ dùng signal đang visible
    const sigPixels = signals
      .map((s) => ({
        x: chart.timeScale().timeToCoordinate(s.time),
        type: s.type, // 'buy' | 'sell'
      }))
      .filter((s) => s.x !== null)
      .sort((a, b) => a.x - b.x);

    // 3. Hàm vẽ 1 đoạn polygon giữa xStart và xEnd với màu color
    const drawSegment = (xStart, xEnd, color) => {
      // Lọc points trong khoảng [xStart, xEnd]
      const seg = points.filter((p) => p.ux >= xStart && p.ux <= xEnd);
      if (seg.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(seg[0].ux, seg[0].uy);
      for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i].ux, seg[i].uy);
      for (let i = seg.length - 1; i >= 0; i--)
        ctx.lineTo(seg[i].lx, seg[i].ly);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // 4. Chia đoạn theo signals
    //    - Trước signal đầu: neutralFill
    //    - MUA → BÁN tiếp theo: buyFillColor (xanh)
    //    - BÁN → MUA tiếp theo: sellFillColor (đỏ)
    const xMin = points[0].ux;
    const xMax = points[points.length - 1].ux;

    if (sigPixels.length === 0) {
      // Không có signal nào → tô toàn bộ neutral
      drawSegment(xMin, xMax, neutralFill);
      return;
    }

    // Đoạn trước signal đầu tiên
    drawSegment(xMin, sigPixels[0].x, neutralFill);

    // Các đoạn giữa các signal
    for (let i = 0; i < sigPixels.length; i++) {
      const seg = sigPixels[i];
      const nextX = i + 1 < sigPixels.length ? sigPixels[i + 1].x : xMax;
      // Màu phụ thuộc vào loại signal BẮT ĐẦU đoạn
      const color = seg.type === "buy" ? buyFillColor : sellFillColor;
      drawSegment(seg.x, nextX, color);
    }
  };

  setTimeout(drawFill, 0);
  const ro = new ResizeObserver(drawFill);
  ro.observe(container);
  chart.timeScale().subscribeVisibleLogicalRangeChange(drawFill);

  const cleanup = () => {
    chart.timeScale().unsubscribeVisibleLogicalRangeChange(drawFill);
    ro.disconnect();
    canvas.remove();
  };

  return { upperSeries, lowerSeries, cleanup, drawFill };
}
