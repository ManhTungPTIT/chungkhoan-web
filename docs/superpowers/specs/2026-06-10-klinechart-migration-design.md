# Thiết kế: Migration chart.jsx từ lightweight-charts sang KLineChart

**Ngày:** 2026-06-10
**Trạng thái:** Đã duyệt thiết kế, chờ implementation plan

## Mục tiêu

Thay engine vẽ chart từ `lightweight-charts` v5 sang `klinecharts` v9 để:

1. **Đảm bảo tính chính xác** của các đường indicator hiển thị (EMA, Bollinger Band) bằng cách dùng built-in của thư viện thay vì tự tính.
2. **Giảm code tự tính toán** trong `untils/indicators.js` — chỉ giữ lại phần bắt buộc (tính tín hiệu mua/bán và MCDX).
3. **Xóa hack canvas overlay** trong `bollingerBand.jsx` (canvas absolute + ResizeObserver + subscribeVisibleLogicalRangeChange + setTimeout) — phần fill chuyển vào custom indicator vẽ trong canvas của chính chart.

**Giữ nguyên toàn bộ UI/hành vi hiện tại:** nến, EMA 10/20/50, Bollinger Band + tô màu xanh/đỏ theo đoạn tín hiệu, markers mua/bán kèm text, pane MCDX (Banker Fund), info panel phía trên chart.

## Quyết định đã chốt

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Phiên bản | `klinecharts@^9.8.12` (pin, KHÔNG dùng tag `latest`) | npm tag `latest` đang trỏ `10.0.0-beta3` — v10 còn beta; v9 stable, docs đầy đủ |
| MA hay EMA | Giữ **EMA** 10/20/50 như hiện tại | Không làm thay đổi tín hiệu/đường vẽ so với bản đang chạy |
| Phạm vi giữ | Toàn bộ (MCDX, markers, fill BB theo tín hiệu, info panel) | Yêu cầu của user |
| Cách migrate | Viết lại `chart.jsx` thuần KLineChart, một lần (không chạy song song 2 thư viện) | Ít công nhất, props không đổi nên rủi ro khoanh vùng trong 1 component |
| `lightweight-charts` | Gỡ khỏi `package.json` | Chỉ còn `chart.jsx` + `bollingerBand.jsx` dùng, cả hai đều thay/xóa |

## Kiến trúc & cấu trúc file

```
feature/chart/
├── index.jsx                      # GIỮ NGUYÊN — vẫn tính generateSignals, truyền candles + signals
├── layouts/
│   ├── chart.jsx                  # VIẾT LẠI — init KLineChart, tạo indicator/overlay
│   ├── bollingerBand.jsx          # XÓA
│   └── panel.jsx                  # giữ nguyên
├── klinecharts/                   # MỚI — extension của KLineChart, register 1 lần ở module scope
│   ├── bbSignalIndicator.js       # registerIndicator "BBS"
│   ├── mcdxIndicator.js           # registerIndicator "MCDX"
│   └── signalMarkerOverlay.js     # registerOverlay "signalMarker"
└── untils/
    └── indicators.js              # dọn gọn (xem bảng bên dưới)
```

### `chart.jsx` mới

Props không đổi: `{ candles, signals, infoHeight }` — `index.jsx` không phải sửa.

Trong `useEffect([candles, signals])`:

1. `init(container)` tạo chart; cleanup effect gọi `dispose()`. Mỗi lần data đổi dựng lại toàn bộ chart (giữ đúng pattern bản cũ — đơn giản, không tối ưu sớm).
2. Map data: `candles → [{ timestamp: time * 1000, open, high, low, close }]` — API trả `time` unix **giây**, KLineChart cần **ms**. Guard: bỏ qua bản ghi có `time` không phải số.
3. Style chart: nền trắng, lưới `#f0f0f0`, nến tăng `#26a69a` / giảm `#ef5350`, crosshair thường — khớp bản cũ.
4. Tạo indicator:
   - **EMA built-in**, `calcParams: [10, 20, 50]`, overlay lên pane nến (`candle_pane`). Màu: 10 xanh dương, 20 tím, 50 đỏ — khớp bản cũ.
   - **BBS** (custom) — overlay lên pane nến, truyền `signals` qua `extendData`.
   - **MCDX** (custom) — pane riêng bên dưới.
5. Mỗi signal → 1 overlay `signalMarker`.
6. Container giữ `height: calc(100vh - infoHeight)`; thêm `ResizeObserver` trên container gọi `chart.resize()` (KLineChart v9 không tự autoSize).

### `bbSignalIndicator.js`

- `registerIndicator` tên `BBS`, `calcParams: [20, 2]`.
- **`calc`**: SMA + độ lệch chuẩn trượt trên `close` (population std — khớp `calcBB` cũ), trả mảng thẳng hàng với dataList, nến chưa đủ period → `null`, đủ → `{ upper, lower }`.
- **`figures`**: 2 đường `upper`/`lower` trắng mờ `rgba(255,255,255,0.7)`, lineWidth 1 — thư viện tự vẽ.
- **`draw`**: vẽ fill rồi `return false` (để figures vẽ đè lên sau):
  - Lấy `signals` từ `indicator.extendData`.
  - Tọa độ: `xAxis.convertToPixel(...)` / `yAxis.convertToPixel(...)`.
  - Chỉ duyệt nến trong `visibleRange`.
  - Chia màu theo đoạn: trước signal đầu tiên = `rgba(180,180,220,0.08)` (xám); từ signal `buy` đến signal kế = `rgba(38,166,154,0.18)` (xanh); từ signal `sell` đến signal kế = `rgba(239,83,80,0.18)` (đỏ). Logic giữ nguyên từ `bollingerBand.jsx` cũ.

### `mcdxIndicator.js`

- `registerIndicator` tên `MCDX`, `calcParams: [50, 40, 10]` (bankerPeriod, hotPeriod, sharkPeriod), `minValue: 0`, `maxValue: 20` (thang cố định).
- **`calc`**: chuyển nguyên logic `calcMCDX` hiện tại (import `calcRSI`, `emaOf` từ `indicators.js`). Công thức không đổi: RSI(50)/RSI(40) quy thang `(rsi - 50) / 50 * 20` kẹp 0–20; shark = EMA(10) của banker. Trả per-bar `{ retail: 20, hot, banker, shark }`; bar thiếu dữ liệu → `null`.
- **`figures`** theo thứ tự đè (sau đè trước):
  1. bar `retail` — xanh lá `#43A047`, value cố định 20 (nền)
  2. bar `hot` — vàng `#FDD835`
  3. bar `banker` — đỏ `#E53935`, chuyển cam `#FB8C00` khi giảm so với nến trước (color callback so sánh với bar trước)
  4. line `shark` — xanh dương `#1E88E5`, lineWidth 2
- Tạo ở pane riêng bên dưới pane nến.

### `signalMarkerOverlay.js`

- `registerOverlay` tên `signalMarker`; mỗi signal 1 overlay, 1 point `{ timestamp: time * 1000, value: price }`, `lock: true` (không tương tác).
- `createPointFigures`:
  - `buy`: tam giác hướng lên **dưới** nến, màu `#1565C0`, text `XANH <giá>`
  - `sell`: tam giác hướng xuống **trên** nến, màu `#C2185B`, text `ĐỎ <giá>`
  - Loại signal truyền qua `extendData` của overlay.

### `indicators.js` sau dọn dẹp

| Hàm | Số phận | Lý do |
|---|---|---|
| `emaOf`, `calcRSI` | Giữ | `mcdxIndicator.js` cần |
| `calcEMA`, `calcMACD` | Giữ | `generateSignals` cần (chỉ phục vụ tính tín hiệu, không phục vụ vẽ) |
| `generateSignals`, `toDateString` | Giữ | info panel + markers + fill |
| `calcSMA` | Xóa | không ai dùng |
| `calcBB` | Xóa | logic chuyển vào `calc` của BBS |
| `calcMCDX` | Xóa | logic chuyển vào `calc` của MCDX indicator |

Công thức tín hiệu mua/bán **không đổi**: MUA khi `close > EMA20` và MACD cắt lên Signal; BÁN khi close cắt xuống EMA20 và MACD cắt xuống Signal.

## Luồng dữ liệu (không đổi)

`useIntraday` (react-query, refetch 60s) → `index.jsx` tính `generateSignals(candles)` cho info panel → props `candles, signals` xuống `chart.jsx` → effect dispose + dựng lại chart.

## Xử lý lỗi & edge case

- `candles = []` (đang tải): init chart trống, `applyNewData([])` an toàn; signals rỗng → fill toàn xám, không marker.
- Dưới 35 nến (không đủ signal) / dưới 51 nến (không đủ MCDX): hàm calc trả `null` cho bar thiếu, KLineChart bỏ qua.
- `time` thiếu/không phải số: bỏ qua bản ghi khi map sang `timestamp`.

## Kiểm thử

- **Unit test (vitest, mới):** export riêng hàm calc thuần của BBS và MCDX (không phụ thuộc DOM/chart):
  - BB: đối chiếu với giá trị tính tay trên dataset nhỏ.
  - MCDX: đối chiếu output với `calcMCDX` cũ trên cùng dataset **trước khi xóa** hàm cũ.
- **Nghiệm thu thủ công (`npm run dev`):** so sánh side-by-side với bản cũ (git stash/checkout tạm): đường EMA trùng, fill đổi màu đúng tại vị trí marker, pane MCDX giống hệt, markers đúng vị trí/màu/text, resize sidebar + panel không vỡ layout, info panel hiển thị đúng giá/ngày chuyển tín hiệu.

## Ngoài phạm vi

- Không đổi công thức tín hiệu, không thêm indicator mới, không thêm toolbar/công cụ vẽ của KLineChart.
- Không tối ưu việc dựng lại chart mỗi lần refetch (giữ pattern hiện tại).
- Không đụng `panel.jsx`, `index.jsx` (ngoài việc không phải sửa), admin, hooks.
