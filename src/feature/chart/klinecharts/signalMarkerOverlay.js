// "klinecharts" (entry CJS/UMD) không expose named export registerOverlay
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerOverlay } from "klinecharts/dist/index.esm.js";

const BUY_COLOR = "#1565C0";
const SELL_COLOR = "#C2185B";
const ARROW_HALF_W = 5; // nửa bề rộng đáy tam giác (px)
const GAP = 4; // khoảng cách đỉnh mũi tên ↔ điểm giá

// Marker tín hiệu: buy = tam giác hướng lên DƯỚI điểm giá + "XANH <giá>",
// sell = tam giác hướng xuống TRÊN điểm giá + "ĐỎ <giá>".
// Loại/giá của signal truyền qua overlay.extendData.
registerOverlay({
  name: "signalMarker",
  totalStep: 2,
  lock: true,
  createPointFigures: ({ overlay, coordinates }) => {
    const coord = coordinates[0];
    if (!coord) return [];
    const signal = overlay.extendData ?? {};
    const isBuy = signal.type === "buy";
    const color = isBuy ? BUY_COLOR : SELL_COLOR;
    const dir = isBuy ? 1 : -1; // buy vẽ phía dưới, sell vẽ phía trên

    const tipY = coord.y + dir * GAP;
    const baseY = tipY + dir * ARROW_HALF_W * 2;
    const textY = baseY + dir * 2;

    return [
      {
        type: "polygon",
        attrs: {
          coordinates: [
            { x: coord.x, y: tipY },
            { x: coord.x - ARROW_HALF_W, y: baseY },
            { x: coord.x + ARROW_HALF_W, y: baseY },
          ],
        },
        styles: { style: "fill", color },
        ignoreEvent: true,
      },
      {
        type: "text",
        attrs: {
          x: coord.x,
          y: textY,
          text: `${isBuy ? "XANH" : "ĐỎ"} ${signal.price}`,
          align: "center",
          baseline: isBuy ? "top" : "bottom",
        },
        styles: { color, size: 10, backgroundColor: "transparent" },
        ignoreEvent: true,
      },
    ];
  },
});
