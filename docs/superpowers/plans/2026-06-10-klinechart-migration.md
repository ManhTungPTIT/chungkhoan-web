# KLineChart Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay engine vẽ chart từ `lightweight-charts` v5 sang `klinecharts` v9, giữ nguyên toàn bộ UI/hành vi (nến, EMA 10/20/50, Bollinger + fill theo tín hiệu, markers mua/bán, pane MCDX).

**Architecture:** Viết lại `src/feature/chart/layouts/chart.jsx` thuần KLineChart. Phần riêng (Bollinger fill theo tín hiệu, MCDX, marker mua/bán) đăng ký qua `registerIndicator`/`registerOverlay` trong thư mục mới `src/feature/chart/klinecharts/`. Props của `TradingChart` không đổi nên `index.jsx` giữ nguyên. Spec: `docs/superpowers/specs/2026-06-10-klinechart-migration-design.md`.

**Tech Stack:** React 19, Vite, `klinecharts@^9.8.12` (KHÔNG dùng tag `latest` — đang trỏ v10 beta), vitest.

**Lưu ý chung cho mọi task:**
- API trả `time` là unix **giây**; KLineChart dùng `timestamp` **ms** → luôn nhân 1000.
- Trong KLineChart v9: `xAxis.convertToPixel(dataIndex)` nhận **chỉ số nến**, `yAxis.convertToPixel(giá)` nhận giá trị.
- `calc` của indicator phải trả mảng **cùng độ dài** với `dataList`, phần tử thiếu dữ liệu là `{}`.
- Working tree đang có sửa đổi dở ở 3 file chart — plan này sẽ ghi đè `chart.jsx`; KHÔNG đụng tới các file ngoài phạm vi từng task.

---

### Task 1: Cài klinecharts v9

**Files:**
- Modify: `package.json` (qua npm, không sửa tay)

- [ ] **Step 1: Cài đặt pin v9**

Run: `npm install klinecharts@^9.8.12`

- [ ] **Step 2: Xác minh phiên bản**

Run: `npm ls klinecharts`
Expected: `klinecharts@9.8.12` (hoặc 9.8.x cao hơn, KHÔNG phải 10.x)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add klinecharts v9 dependency"
```

---

### Task 2: Custom indicator BBS (Bollinger + fill theo tín hiệu)

**Files:**
- Create: `src/feature/chart/klinecharts/bbSignalIndicator.js`
- Test: `src/feature/chart/klinecharts/__tests__/bbSignalIndicator.test.js`

- [ ] **Step 1: Viết test fail cho `calcBBValues`**

Tạo `src/feature/chart/klinecharts/__tests__/bbSignalIndicator.test.js`:

```js
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { calcBBValues } from "../bbSignalIndicator";

// close = 1..25 — mean và population-sd của 1..20 tính tay được
const candles = Array.from({ length: 25 }, (_, i) => ({ close: i + 1 }));
// population variance của 1..20 = (20² - 1) / 12 = 33.25
const SD = Math.sqrt(33.25);

describe("calcBBValues", () => {
  it("trả mảng cùng độ dài dataList, {} cho nến chưa đủ period", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out).toHaveLength(25);
    expect(out[0]).toEqual({});
    expect(out[18]).toEqual({});
    expect(out[19].upper).toBeDefined();
  });

  it("tính đúng band tại nến thứ 20 (close = 1..20, mean 10.5)", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out[19].upper).toBeCloseTo(10.5 + 2 * SD, 6);
    expect(out[19].lower).toBeCloseTo(10.5 - 2 * SD, 6);
  });

  it("cửa sổ trượt: nến thứ 21 dùng close = 2..21 (mean 11.5, sd không đổi)", () => {
    const out = calcBBValues(candles, 20, 2);
    expect(out[20].upper).toBeCloseTo(11.5 + 2 * SD, 6);
    expect(out[20].lower).toBeCloseTo(11.5 - 2 * SD, 6);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run src/feature/chart/klinecharts/__tests__/bbSignalIndicator.test.js`
Expected: FAIL — `Cannot find module '../bbSignalIndicator'` (hoặc tương đương)

- [ ] **Step 3: Viết `bbSignalIndicator.js`**

Tạo `src/feature/chart/klinecharts/bbSignalIndicator.js`:

```js
import { registerIndicator } from "klinecharts";

const NEUTRAL_FILL = "rgba(180,180,220,0.08)"; // trước signal đầu tiên
const BUY_FILL = "rgba(38,166,154,0.18)"; // từ signal MUA
const SELL_FILL = "rgba(239,83,80,0.18)"; // từ signal BÁN

// Calc thuần — export riêng để unit test không cần chart/DOM.
// Trả mảng thẳng hàng với dataList: {} khi chưa đủ period, ngược lại { upper, lower }.
export function calcBBValues(dataList, period = 20, multiplier = 2) {
  return dataList.map((_, i) => {
    if (i < period - 1) return {};
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += dataList[j].close;
    const avg = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++)
      variance += (dataList[j].close - avg) ** 2;
    const sd = Math.sqrt(variance / period);
    return { upper: avg + multiplier * sd, lower: avg - multiplier * sd };
  });
}

// Màu fill tại 1 nến = theo signal gần nhất tại-hoặc-trước nến đó
// (signals đã sort tăng theo time; time unix giây, timestamp ms)
function fillColorAt(timestamp, signals) {
  let color = NEUTRAL_FILL;
  for (const s of signals) {
    if (s.time * 1000 > timestamp) break;
    color = s.type === "buy" ? BUY_FILL : SELL_FILL;
  }
  return color;
}

registerIndicator({
  name: "BBS",
  shortName: "BOLL",
  precision: 2,
  calcParams: [20, 2],
  figures: [
    { key: "upper", title: "UP: ", type: "line" },
    { key: "lower", title: "DN: ", type: "line" },
  ],
  styles: {
    lines: [
      { color: "rgba(255,255,255,0.7)", size: 1 },
      { color: "rgba(255,255,255,0.7)", size: 1 },
    ],
  },
  calc: (dataList, { calcParams }) =>
    calcBBValues(dataList, calcParams[0], calcParams[1]),
  // Vẽ fill giữa 2 band, chia màu theo đoạn tín hiệu.
  // return false để thư viện vẽ tiếp 2 đường band (figures) đè lên fill.
  draw: ({ ctx, kLineDataList, indicator, visibleRange, xAxis, yAxis }) => {
    const signals = [...(indicator.extendData ?? [])].sort(
      (a, b) => a.time - b.time,
    );
    const result = indicator.result;

    // Gom các nến visible liên tiếp cùng màu thành 1 polygon
    let seg = [];
    let segColor = null;
    const flush = () => {
      if (seg.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].yUp);
        for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k].x, seg[k].yUp);
        for (let k = seg.length - 1; k >= 0; k--)
          ctx.lineTo(seg[k].x, seg[k].yLow);
        ctx.closePath();
        ctx.fillStyle = segColor;
        ctx.fill();
      }
      seg = [];
    };

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const data = result[i];
      const kline = kLineDataList[i];
      if (!data || data.upper == null || !kline) {
        flush();
        segColor = null;
        continue;
      }
      const color = fillColorAt(kline.timestamp, signals);
      const point = {
        x: xAxis.convertToPixel(i),
        yUp: yAxis.convertToPixel(data.upper),
        yLow: yAxis.convertToPixel(data.lower),
      };
      if (segColor !== null && color !== segColor) {
        seg.push(point); // điểm nối: khép đoạn cũ ngay tại nến chuyển màu
        flush();
      }
      segColor = color;
      seg.push(point);
    }
    flush();

    return false;
  },
});
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run src/feature/chart/klinecharts/__tests__/bbSignalIndicator.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/feature/chart/klinecharts/bbSignalIndicator.js src/feature/chart/klinecharts/__tests__/bbSignalIndicator.test.js
git commit -m "feat: BBS custom indicator - bollinger band + signal fill for klinecharts"
```

---

### Task 3: Custom indicator MCDX (Banker Fund)

**Files:**
- Create: `src/feature/chart/klinecharts/mcdxIndicator.js`
- Test: `src/feature/chart/klinecharts/__tests__/mcdxIndicator.test.js`

**Bối cảnh:** Logic lấy nguyên từ `calcMCDX` trong `src/feature/chart/untils/indicators.js` (hàm này sẽ bị xóa ở Task 6). Test so sánh với bản legacy được **copy verbatim vào test file** làm reference — nhờ vậy test vẫn đúng sau khi xóa hàm cũ.

- [ ] **Step 1: Viết test fail cho `calcMCDXValues`**

Tạo `src/feature/chart/klinecharts/__tests__/mcdxIndicator.test.js`:

```js
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { calcMCDXValues } from "../mcdxIndicator";
import { calcRSI, emaOf } from "../../untils/indicators";

// 80 nến deterministic, đủ vượt start=50 và shark (59)
const candles = Array.from({ length: 80 }, (_, i) => ({
  time: 1700000000 + i * 60,
  close: 100 + 10 * Math.sin(i / 5) + (i % 7),
}));

// Reference: copy verbatim từ calcMCDX cũ (untils/indicators.js trước migration)
function legacyMCDX(candles, bankerPeriod = 50, hotPeriod = 40, sharkPeriod = 10) {
  const start = Math.max(bankerPeriod, hotPeriod);
  if (candles.length <= start)
    return { banker: [], hotMoney: [], retail: [], sharkLine: [] };

  const scale = (rsi) => Math.min(20, Math.max(0, ((rsi - 50) / 50) * 20));
  const bankerRSI = calcRSI(candles, bankerPeriod);
  const hotRSI = calcRSI(candles, hotPeriod);

  const banker = [],
    hotMoney = [],
    retail = [],
    bankerValues = [];
  let prevB = -1;
  for (let i = start; i < candles.length; i++) {
    const b = scale(bankerRSI[i - bankerPeriod].value);
    const h = scale(hotRSI[i - hotPeriod].value);
    const time = candles[i].time;
    retail.push({ time, value: 20, color: "#43A047" });
    hotMoney.push({ time, value: h, color: "#FDD835" });
    banker.push({ time, value: b, color: b >= prevB ? "#E53935" : "#FB8C00" });
    bankerValues.push(b);
    prevB = b;
  }

  const sharkLine = emaOf(bankerValues, sharkPeriod).map((value, j) => ({
    time: candles[start + sharkPeriod - 1 + j].time,
    value,
  }));

  return { banker, hotMoney, retail, sharkLine };
}

describe("calcMCDXValues", () => {
  const out = calcMCDXValues(candles, 50, 40, 10);
  const legacy = legacyMCDX(candles, 50, 40, 10);

  it("thẳng hàng với dataList: {} cho 50 nến đầu", () => {
    expect(out).toHaveLength(80);
    expect(out[0]).toEqual({});
    expect(out[49]).toEqual({});
    expect(out[50].banker).toBeDefined();
  });

  it("banker/hot/retail khớp bản legacy", () => {
    for (let i = 50; i < 80; i++) {
      expect(out[i].retail).toBe(20);
      expect(out[i].banker).toBeCloseTo(legacy.banker[i - 50].value, 10);
      expect(out[i].hot).toBeCloseTo(legacy.hotMoney[i - 50].value, 10);
    }
  });

  it("đường Cá Mập bắt đầu từ nến 59 và khớp legacy", () => {
    expect(out[58].shark).toBeUndefined();
    legacy.sharkLine.forEach((s, j) => {
      expect(out[59 + j].shark).toBeCloseTo(s.value, 10);
    });
  });

  it("trả toàn {} khi không đủ dữ liệu", () => {
    const out2 = calcMCDXValues(candles.slice(0, 50), 50, 40, 10);
    expect(out2).toHaveLength(50);
    expect(out2.every((v) => Object.keys(v).length === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run src/feature/chart/klinecharts/__tests__/mcdxIndicator.test.js`
Expected: FAIL — `Cannot find module '../mcdxIndicator'`

- [ ] **Step 3: Viết `mcdxIndicator.js`**

Tạo `src/feature/chart/klinecharts/mcdxIndicator.js`:

```js
import { registerIndicator } from "klinecharts";
import { calcRSI, emaOf } from "../untils/indicators";

/**
 * MCDX (Banker Fund) — thang cố định 0–20, cột luôn đầy tới 20:
 *   retail : nền xanh lá cố định 20 (lớp dưới cùng)
 *   hot    : RSI(hotPeriod) quy về 0–20 — cột vàng, đè lên nền
 *   banker : RSI(bankerPeriod) quy về 0–20 — cột đỏ trên cùng,
 *            chuyển CAM khi giảm so với nến trước
 *   shark  : EMA(sharkPeriod) của banker — đường "Cá Mập" xanh dương
 * Mỗi RSI chỉ tính phần vượt trên 50: (rsi - 50) / 50 * 20, kẹp 0–20.
 */
// Calc thuần — export riêng để unit test không cần chart/DOM.
export function calcMCDXValues(
  dataList,
  bankerPeriod = 50,
  hotPeriod = 40,
  sharkPeriod = 10,
) {
  const start = Math.max(bankerPeriod, hotPeriod);
  const result = dataList.map(() => ({}));
  if (dataList.length <= start) return result;

  const scale = (rsi) => Math.min(20, Math.max(0, ((rsi - 50) / 50) * 20));
  const bankerRSI = calcRSI(dataList, bankerPeriod);
  const hotRSI = calcRSI(dataList, hotPeriod);

  const bankerValues = [];
  for (let i = start; i < dataList.length; i++) {
    const banker = scale(bankerRSI[i - bankerPeriod].value);
    result[i] = {
      retail: 20,
      hot: scale(hotRSI[i - hotPeriod].value),
      banker,
    };
    bankerValues.push(banker);
  }

  emaOf(bankerValues, sharkPeriod).forEach((value, j) => {
    result[start + sharkPeriod - 1 + j].shark = value;
  });

  return result;
}

registerIndicator({
  name: "MCDX",
  shortName: "MCDX",
  precision: 2,
  calcParams: [50, 40, 10],
  minValue: 0,
  maxValue: 20,
  figures: [
    {
      key: "retail",
      title: "Retail: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#43A047" }),
    },
    {
      key: "hot",
      title: "Hot: ",
      type: "bar",
      baseValue: 0,
      styles: () => ({ color: "#FDD835" }),
    },
    {
      key: "banker",
      title: "Banker: ",
      type: "bar",
      baseValue: 0,
      // đỏ khi tăng/đi ngang, cam khi giảm so với nến trước (khớp bản cũ)
      styles: ({ prev, current }) => ({
        color:
          prev.indicatorData?.banker != null &&
          current.indicatorData.banker < prev.indicatorData.banker
            ? "#FB8C00"
            : "#E53935",
      }),
    },
    {
      key: "shark",
      title: "Shark: ",
      type: "line",
      styles: () => ({ color: "#1E88E5", size: 2 }),
    },
  ],
  calc: (dataList, { calcParams }) =>
    calcMCDXValues(dataList, calcParams[0], calcParams[1], calcParams[2]),
});
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run src/feature/chart/klinecharts/__tests__/mcdxIndicator.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/feature/chart/klinecharts/mcdxIndicator.js src/feature/chart/klinecharts/__tests__/mcdxIndicator.test.js
git commit -m "feat: MCDX custom indicator for klinecharts"
```

---

### Task 4: Overlay signalMarker (mũi tên mua/bán + text)

**Files:**
- Create: `src/feature/chart/klinecharts/signalMarkerOverlay.js`

Module này chỉ vẽ (không có logic tính) → không unit test, nghiệm thu thủ công ở Task 6.

- [ ] **Step 1: Viết `signalMarkerOverlay.js`**

Tạo `src/feature/chart/klinecharts/signalMarkerOverlay.js`:

```js
import { registerOverlay } from "klinecharts";

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
```

- [ ] **Step 2: Xác nhận module import sạch (register không lỗi)**

Run: `npx vitest run` (2 test file hiện có vẫn pass — import chain không vỡ)
Expected: PASS toàn bộ

- [ ] **Step 3: Commit**

```bash
git add src/feature/chart/klinecharts/signalMarkerOverlay.js
git commit -m "feat: buy/sell signal marker overlay for klinecharts"
```

---

### Task 5: Viết lại chart.jsx

**Files:**
- Modify: `src/feature/chart/layouts/chart.jsx` (thay toàn bộ nội dung)

Props giữ nguyên `{ candles, signals, infoHeight }` — không sửa `index.jsx`. Pattern vòng đời giữ như bản cũ: mỗi lần `candles`/`signals` đổi thì dispose + dựng lại toàn bộ.

- [ ] **Step 1: Thay toàn bộ nội dung `chart.jsx`**

```jsx
import { useEffect, useRef } from "react";
import { init, dispose } from "klinecharts";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import "../klinecharts/signalMarkerOverlay";

export default function TradingChart({ candles, signals, infoHeight = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const chart = init(container);

    chart.setStyles({
      grid: {
        horizontal: { color: "#f0f0f0" },
        vertical: { color: "#f0f0f0" },
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
      }));
    chart.applyNewData(dataList);

    // EMA built-in 10/20/50 — thư viện tự tính, đè lên pane nến
    chart.createIndicator(
      {
        name: "EMA",
        calcParams: [10, 20, 50],
        styles: {
          lines: [{ color: "blue" }, { color: "purple" }, { color: "red" }],
        },
      },
      true,
      { id: "candle_pane" },
    );

    // Bollinger + fill xanh/đỏ theo tín hiệu — signals truyền qua extendData
    chart.createIndicator({ name: "BBS", extendData: signals }, true, {
      id: "candle_pane",
    });

    // MCDX — pane riêng bên dưới
    chart.createIndicator("MCDX", false);

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

    return () => {
      ro.disconnect();
      dispose(container);
    };
  }, [candles, signals]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `calc(100vh - ${infoHeight}px)`,
        background: "#fff",
      }}
    />
  );
}
```

- [ ] **Step 2: Lint + chạy dev server xác minh trực quan**

Run: `npm run lint` — Expected: không lỗi mới ở các file vừa tạo/sửa.

Run: `npm run dev`, mở browser, đối chiếu với bản cũ:
- Nến hiển thị, màu tăng `#26a69a` / giảm `#ef5350`
- 3 đường EMA: xanh dương (10), tím (20), đỏ (50)
- 2 đường band Bollinger trắng mờ + fill giữa 2 band: xám trước signal đầu, xanh sau signal MUA, đỏ sau signal BÁN — đổi màu đúng tại vị trí marker
- Markers: tam giác xanh dương hướng lên dưới nến + "XANH <giá>"; tam giác hồng hướng xuống trên nến + "ĐỎ <giá>"
- Pane MCDX dưới cùng: nền xanh lá đầy tới 20, cột vàng, cột đỏ/cam, đường Cá Mập xanh dương
- Pan/zoom: fill và markers di chuyển khớp theo nến (không lệch, không vẽ thừa)
- Bật/tắt sidebar và đổi mã trên panel: chart resize không vỡ

Nếu API v9 khác với code (ví dụ chữ ký `styles` callback của figure): tra cứu types tại `node_modules/klinecharts/index.d.ts` và sửa cho khớp — KHÔNG đổi hành vi đã mô tả.

- [ ] **Step 3: Commit**

```bash
git add src/feature/chart/layouts/chart.jsx
git commit -m "feat: rewrite TradingChart with klinecharts v9"
```

---

### Task 6: Dọn dẹp — xóa code lightweight-charts và hàm calc thừa

**Files:**
- Delete: `src/feature/chart/layouts/bollingerBand.jsx`
- Modify: `src/feature/chart/untils/indicators.js` (xóa `calcSMA`, `calcBB`, `calcMCDX`)
- Modify: `package.json` (gỡ `lightweight-charts`)

- [ ] **Step 1: Xóa `bollingerBand.jsx`**

```bash
git rm src/feature/chart/layouts/bollingerBand.jsx
```

- [ ] **Step 2: Xóa 3 hàm khỏi `indicators.js`**

Trong `src/feature/chart/untils/indicators.js`, xóa toàn bộ 3 hàm (cả comment ngay trên mỗi hàm):
- `calcSMA` — không ai dùng
- `calcBB` — đã chuyển vào `calcBBValues` của BBS
- `calcMCDX` — đã chuyển vào `calcMCDXValues` của MCDX

GIỮ NGUYÊN: `emaOf`, `calcEMA`, `calcMACD`, `calcRSI`, `toDateString`, `generateSignals`.

- [ ] **Step 3: Xác nhận không còn ai tham chiếu**

Run: `npx eslint src` và grep:

```bash
grep -rn "lightweight-charts\|calcSMA\|calcBB\b\|calcMCDX\|bollingerBand" src
```

Expected: không còn kết quả nào (ngoài `calcBBValues`/`calcMCDXValues` — khác tên, `\b` đã loại).

- [ ] **Step 4: Gỡ dependency**

Run: `npm uninstall lightweight-charts`

- [ ] **Step 5: Test + build toàn bộ**

Run: `npx vitest run` — Expected: PASS toàn bộ (7 tests)
Run: `npm run build` — Expected: build thành công, không cảnh báo import thiếu

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove lightweight-charts and unused calc functions"
```

---

### Task 7: Nghiệm thu cuối

- [ ] **Step 1: So sánh side-by-side với bản cũ**

```bash
git stash          # nếu còn thay đổi dở
git log --oneline  # ghi lại hash HEAD hiện tại
```

Mở bản cũ ở commit trước Task 1 (`git checkout <hash-trước-migration>` ở worktree/clone khác, hoặc dựa vào screenshot chụp trước đó) và đối chiếu checklist trực quan ở Task 5 Step 2. Đặc biệt: vị trí đổi màu fill và giá trị các đường EMA tại cùng 1 nến (hover crosshair đọc giá trị).

- [ ] **Step 2: Xác nhận info panel**

Info panel phía trên chart hiển thị đúng: giá/ngày chuyển XANH-ĐỎ (từ `generateSignals` — không đổi) và giá hiện tại.

- [ ] **Step 3: Hoàn tất**

Nếu tất cả khớp → migration xong. Nếu lệch → ghi lại điểm lệch cụ thể (giá trị nào, nến nào) trước khi sửa.
