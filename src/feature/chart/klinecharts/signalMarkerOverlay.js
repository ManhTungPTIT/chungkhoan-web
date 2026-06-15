// "klinecharts" (entry CJS/UMD) không expose named export registerOverlay
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerOverlay } from "klinecharts/dist/index.esm.js";

const BUY_COLOR = "#1565C0"; // MUA: badge xanh dương
const SELL_COLOR = "#E91E63"; // BÁN: badge hồng
const TEXT_COLOR = "#ffffff";

const GAP = 18; // khoảng cách đỉnh mũi tên ↔ điểm giá
const ARROW_HALF_W = 6; // nửa bề rộng đáy tam giác (px)
const ARROW_H = 6; // chiều cao mũi tên (px)

const PADDING_X = 5; // đệm trái/phải trong badge
const PADDING_Y = 5; // đệm trên/dưới trong badge
const LABEL_SIZE = 10; // cỡ chữ nhãn (MUA/BÁN)
const PRICE_SIZE = 10; // cỡ chữ giá
const GAP_LINES = 2; // khoảng cách giữa 2 dòng
const RADIUS = 2; // bán kính bo góc badge
const MIN_W = 30; // bề rộng tối thiểu badge

const BADGE_H = PADDING_Y * 2 + LABEL_SIZE + GAP_LINES + PRICE_SIZE;

// Ước lượng bề rộng chuỗi text để badge ôm vừa chữ (klinecharts không tự
// đo text khi vẽ rect nền riêng) — hệ số 0.62 xấp xỉ font sans-serif.
const estimateWidth = (str, size) => String(str).length * size * 0.62;

// Marker tín hiệu dạng badge bo góc + mũi tên trỏ vào nến.
// buy  = "MUA" badge xanh dương, nằm DƯỚI điểm giá, mũi tên trỏ lên.
// sell = "BÁN" badge hồng, nằm TRÊN điểm giá, mũi tên trỏ xuống.
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
    const label = isBuy ? "MUA" : "BÁN";
    const priceStr = String(signal.price);
    const dir = isBuy ? 1 : -1; // buy vẽ phía dưới, sell vẽ phía trên

    // Mũi tên: đỉnh sát điểm giá, đáy hướng về phía badge
    const tipY = coord.y + dir * GAP;
    const baseY = tipY + dir * ARROW_H;

    // Badge nối tiếp sau đáy mũi tên; tính mép trên rect theo hướng
    const badgeW = Math.max(
      MIN_W,
      Math.max(
        estimateWidth(label, LABEL_SIZE),
        estimateWidth(priceStr, PRICE_SIZE),
      ) +
        PADDING_X * 2,
    );
    const rectTop = dir === 1 ? baseY : baseY - BADGE_H;

    const labelY = rectTop + PADDING_Y;
    const priceY = labelY + LABEL_SIZE + GAP_LINES;

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
        type: "rect",
        attrs: {
          x: coord.x - badgeW / 2,
          y: rectTop,
          width: badgeW,
          height: BADGE_H,
        },
        styles: { style: "fill", color, borderRadius: RADIUS },
        ignoreEvent: true,
      },
      {
        type: "text",
        attrs: {
          x: coord.x,
          y: labelY,
          text: label,
          align: "center",
          baseline: "top",
        },
        styles: {
          color: TEXT_COLOR,
          size: LABEL_SIZE,
          backgroundColor: "transparent",
        },
        ignoreEvent: true,
      },
      {
        type: "text",
        attrs: {
          x: coord.x,
          y: priceY,
          text: priceStr,
          align: "center",
          baseline: "top",
        },
        styles: {
          color: TEXT_COLOR,
          size: PRICE_SIZE,
          backgroundColor: "transparent",
        },
        ignoreEvent: true,
      },
    ];
  },
});
