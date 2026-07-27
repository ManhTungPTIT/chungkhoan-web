# Đồng bộ header các biểu đồ theo ảnh mẫu (ChartHeader dùng chung) + các fix layout

## Vấn đề

Header của ~21 biểu đồ trong `feature/marketCharts` (trang `/chart/market`) không
đồng nhất và không khớp bộ ảnh thiết kế: mỗi feature tự dựng header riêng — có cái
là `<h1>` căn giữa trên nền trắng (foreignBuy/Sell, topValue/Volume/Decline), có
cái là thanh gradient chỉ có `<h2>` (topGainT2/T3/Week, flowSurge, potentialFlow),
không cái nào có **badge icon tròn + tên biểu đồ** như ảnh mẫu.

Ràng buộc người dùng: bám **đúng chữ trong ảnh**, **chỉ hiển thị tên** (bỏ phụ đề/
đơn vị), **hạn chế thay đổi kích thước header**.

## Giải pháp

### 1. Component dùng chung `ChartHeader`

`src/components/ChartHeader.jsx` + `chartHeader.scss`. Props:

- `id` — id cho `<h2>` (aria-labelledby của card)
- `icon` — node react-icons (bộ `react-icons/bs`) trong badge tròn
- `title` — chuỗi / node / mảng dòng (mảng = xuống dòng)
- `variant` — theme gradient: `navy` (mặc định) · `purple` · `blue` · `market`
  (xanh lá–teal) · `teal`
- `accent` — màu icon/điểm nhấn badge (override `--ch-accent`)
- `control` — node bên phải (dropdown, cụm nút…) — `flex: 0 0 auto`, không co
- `eyebrow` / `subtitle` — có hỗ trợ nhưng **hiện không dùng** (yêu cầu chỉ hiện tên)

Bố cục: `badge (2.5–3.1rem) + text (flex:1, min-width:0, tên tự xuống dòng) +
control (margin-left:auto)`. `flex:1 + min-width:0` ở khối text để **tên không
tràn đè lên nút**.

Hai component bảng dùng chung cũng nhận header qua prop:
`ValueShareBarChart` (bullBear, priceBand) và `StackedSessionBarChart`
(sectorFlowValue, sectorFlowShare) — thêm `headerIcon/headerTitle/headerVariant/
headerAccent`.

### 2. Mapping ảnh → feature (tên + icon + variant)

| Feature | Tên | Icon (bs) | Variant/Accent |
|---|---|---|---|
| potentialFlow | TOP CỔ PHIẾU DẪN ĐẦU VỀ SỨC MẠNH TĂNG GIÁ | LightningChargeFill | navy / tím (giữ dropdown "Top 20 mã") |
| tplusWave (radar) | BẢN ĐỒ SỨC MẠNH TĂNG GIÁ CỔ PHIẾU | GraphUpArrow | navy / lá (header thêm mới ở composite) |
| topGainT2/T3 | NHÓM TĂNG MẠNH NHẤT (NGẮN HẠN: T+2/T+3) | GraphUpArrow | purple / vàng |
| topGainWeek | TOP TĂNG MẠNH NHẤT **TUẦN** | GraphUpArrow | navy / vàng |
| flowSurge | TOP BIẾN ĐỘNG TĂNG MẠNH NHẤT **HÔM NAY** | GraphUpArrow | navy / vàng |
| indexOverview | TOÀN CẢNH CHỈ SỐ | BarChartLineFill | blue |
| marketStatus | BỨC TRANH THỊ TRƯỜNG | PieChartFill | market |
| foreignBuy/Sell | TOP MUA/BÁN RÒNG KHỐI NGOẠI | BarChartFill / GraphDownArrow | purple / lá·đỏ |
| moneyflow | PHÂN BỔ DÒNG VỐN THEO LĨNH VỰC | PieChartFill | teal (giữ toggle Biểu đồ/Bảng) |
| putThrough | DÒNG TIỀN THỰC HIỆN THEO MÃ | CashStack | blue (giữ toggle Biểu đồ/Bảng) |
| sectorFlowValue/Share | TỔNG GIÁ TRỊ / CƠ CẤU TỶ TRỌNG … 5 PHIÊN | CashCoin / PieChartFill | navy |
| sectorBreadth | BẢN ĐỒ DÒNG TIỀN | Bullseye | navy / lá |
| sectorChange | BỨC TRANH BIẾN ĐỘNG DÒNG TIỀN | GraphUpArrow | navy / hồng |
| topValue/Volume | TOP 20 MÃ DẪN ĐẦU VỀ GIÁ TRỊ/KHỐI LƯỢNG GIAO DỊCH | Coin / BarChartFill | navy |
| topDecline | TOP 20 MÃ GIẢM MẠNH NHẤT (THEO % GIẢM) | TrophyFill | navy / vàng |
| bullBear / priceBand | CƠ CẤU DÒNG TIỀN PHE BÒ… / DÒNG TIỀN THEO NHÓM GIÁ | CurrencyExchange / Stack | navy |

Card có `overflow:hidden` → header (không radius riêng) bị cắt theo góc bo card.
Card có padding thì header dùng margin âm để **tràn ra sát mép** (bleed).

### 3. Hoà giải CSS composite (`marketCharts.scss`)

`marketCharts.scss` có sẵn hệ "ép header mỏng" cho markup cũ (`height:2.5rem;
overflow:hidden; padding:0.15rem; align-items:flex-end` + ép nền navy) — nó **cắt
badge và ẩn nút** của header mới. Đã sửa mọi block đụng độ về `min-height:3.6rem;
align-items:center; padding:0.5rem 1rem; overflow:visible`, bỏ ép nền để **màu
variant hiện đúng**, và thêm 1 block chung `.market-chart-pair .chart-header`
(badge 2.5rem, cỡ tên gọn, control giữ hiển thị).

### 4. Các fix layout kèm theo (cùng phiên)

- **Treemap moneyflow/putThrough co về dải mỏng**: `min-height` trên flex
  container không tạo chiều cao xác định → canvas ECharts (`height:100%`) sập.
  Cho `.tm-chart { flex:none; height:30rem }` để canvas nở đủ.
- **Cặp potentialFlow ↔ radar cao bằng nhau**: bỏ `align-self:start`, panel radar
  thành flex-column + `.tplus-chart { flex:1; min-height:0 }` → **bảng trái quyết
  định chiều cao**, radar co theo. Radar `RADAR_RADIUS_RATIO` và cỡ chữ chỉnh cho
  vừa khung, giữ **chung một thang đo** cho T+2/T+3/T+5 (không chuẩn hoá riêng).
- **Nút header đè tên**: `.chart-header__text { flex:1 1 auto; min-width:0 }`.
- **Số trục foreignBuy/Sell đè nhau**: trục giá trị bỏ thập phân (`fmt(tick, 0)`)
  + giảm cỡ chữ trục `0.68rem → 0.6rem`.
- **topDecline gói trong một màn hình**: `--td-row-h:
  clamp(0.9rem, calc((100dvh - 21rem)/20), 1.75rem)` + giảm padding ngoài. Bản
  composite giữ `--td-row-h:1.05rem` riêng.
- **potentialFlow typography**: `--pf-row-h` 1.9→2.2rem (full) / 1.15→1.45rem
  (composite), cỡ chữ mã/số nhích đều cho dễ đọc.

## Kiểm chứng

`npm run build` xanh sau mỗi bước. Không tự chụp được màn hình trong môi trường
(route sau `PrivateRoute`, `/auth/me` cần backend `localhost:3000`) — xác nhận
trực quan trên dev server đang chạy.
