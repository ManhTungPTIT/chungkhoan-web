# Thiết kế: Viết lại logic tín hiệu Mua/Bán (`generateSignals`)

- **Ngày:** 2026-06-15
- **File ảnh hưởng:** `src/feature/chart/untils/indicators.js`
- **Trạng thái:** Đã duyệt thiết kế, chờ lập kế hoạch triển khai

## 1. Bối cảnh & vấn đề

`generateSignals` trong `indicators.js` sinh tín hiệu mua/bán theo nguyên tắc
"đúng khoảnh khắc cắt": MUA khi giá **cắt lên** MA20 **VÀ** MACD **cắt lên** Signal
xảy ra trùng nhau trong cửa sổ `SIGNAL_WINDOW = 3` nến; BÁN là phiên bản đối xứng
xuống. Tín hiệu phát tại cây nến hoàn tất cặp cắt.

Luật này **bỏ sót lệnh bán** ở nhiều mã. Đã kiểm chứng trên dữ liệu thật mã **CLL**
(giá ~30, MACD dao động cực nhỏ ±0.02): sau lệnh BUY ngày **2026-04-09**, giá thủng
MA20 tới 4 lần (13/04, 21/04, 06/05, 13/05, 20/05) — đã vào vùng bán nhiều lần —
nhưng **không có lệnh SELL** mãi đến **2026-06-01** (cách 33 nến). Nguyên nhân: trong
giai đoạn đó MACD không cắt xuống Signal trong vòng 3 nến của các lần giá cắt MA20,
nên điều kiện "hai điểm cắt trùng cửa sổ" không bao giờ thỏa.

Đây là **lỗi thiết kế logic**, không phải lỗi tính chỉ số/index (đã rà: ánh xạ index
giữa `candles`, `ma20`, `macdLine`, `signal` đều đúng).

Triệu chứng người dùng báo: "giá đang vùng buy mà không báo đỏ" — panel ở `index.jsx`
hiển thị màu theo tín hiệu **cuối cùng** (buy → "Xanh", sell → "Đỏ"), nên khi lệnh
SELL bị bỏ sót, panel kẹt ở trạng thái "Xanh" dù giá đã rơi khỏi vùng mua.

## 2. Mục tiêu

- Mọi lần giá rơi khỏi vùng mua đều phải phát được lệnh bán ("Đỏ ra").
- Tín hiệu mua/bán **luôn xen kẽ**, không lặp cùng chiều, không bỏ sót lệnh ra.
- Loại bỏ sự mong manh "hai đường phải cắt trùng giờ trong cửa sổ cố định".
- Không thay đổi cấu trúc dữ liệu đầu ra để các consumer không phải sửa.

## 3. Giải pháp: máy trạng thái dựa trên TRẠNG THÁI nến

Thay cơ chế "phát hiện cạnh cắt trùng cửa sổ" bằng một **máy trạng thái** hai trạng
thái `flat` (đang ngoài) / `long` (đang giữ), duyệt tuần tự từng nến và xét *trạng thái*
của nến thay vì *cạnh cắt*.

### Luật

Bắt đầu ở trạng thái `flat`. Tại mỗi nến `k` (với `k ≥ 34`):

- **`flat` → BUY** khi `close(k) > MA20(k)` **VÀ** `MACD(k) > Signal(k)`
  → ghi tín hiệu `buy`, chuyển sang `long`.
- **`long` → SELL** khi `close(k) < MA20(k)`
  → ghi tín hiệu `sell`, chuyển sang `flat`.

Mỗi nến xét tối đa một lần chuyển trạng thái. Trong trạng thái `long`, nếu giá vẫn
≥ MA20 thì tiếp tục giữ (không phát gì). Trong trạng thái `flat`, nếu chưa hội đủ điều
kiện vào thì tiếp tục chờ.

### Ý nghĩa

- **Vào (xanh) thận trọng:** cần giá trên MA20 *và* MACD > Signal cùng lúc.
- **Ra (đỏ) dứt khoát:** giá thủng MA20 là báo đỏ ngay, không chờ MACD xác nhận.
- Máy trạng thái đảm bảo tín hiệu xen kẽ buy → sell → buy, không trùng lặp.

### Quyết định thiết kế đã chốt

Điều kiện bán đã cân nhắc 3 phương án và **chọn "giá thủng MA20"**:

| Phương án bán | Kết quả trên CLL |
|---|---|
| Cả hai cùng bearish (`giá<MA20 VÀ macd<signal`) | Vẫn kẹt: BUY 09/04 → SELL 01/06 (33 nến) — **không khắc phục** |
| Một trong hai gãy (`giá<MA20 HOẶC macd<signal`) | Khắc phục, nhưng nhạy với MACD nhiễu → ra/vào nhiều |
| **Giá thủng MA20 (đã chọn)** | **Khắc phục, ít nhạy với MACD nhiễu hơn** |

## 4. Phạm vi & ánh xạ index

- Cần tối thiểu **34 nến** để có đủ `Signal` của MACD; vòng lặp bắt đầu tại `k = 34`
  (giữ nguyên ngưỡng hiện tại).
- Tái dùng các helper sẵn có: `calcEMA(candles, 20)` cho MA20, `calcMACD(candles)` cho
  `macdLine`/`signal`. Ánh xạ index giữ nguyên như bản hiện tại:
  - `ma20[k-19].value` = MA20 tại nến `k`
  - `macdLine[k-25].value` = MACD tại nến `k`
  - `signal[k-33].value` = Signal tại nến `k`
- Vì chỉ đọc *trạng thái tại nến k* (không cần nến `k-1`), không còn nhu cầu so sánh
  cặp `(k-1, k)` như các hàm cross cũ.

## 5. Phần được xóa bỏ

- Hằng `SIGNAL_WINDOW`.
- Hàm `inWindow`.
- 4 hàm phát hiện cắt: `priceCrossUp`, `priceCrossDown`, `macdCrossUp`, `macdCrossDown`.
- Toàn bộ khối điều kiện "hai lần cắt trong cửa sổ" trong vòng lặp.

`emaOf`, `calcEMA`, `calcMACD`, `calcRSI`, `toDateString` **giữ nguyên**.

## 6. Hợp đồng đầu ra (không đổi)

`generateSignals(candles)` vẫn trả về mảng các phần tử:

```js
{ time, date, type: "buy" | "sell", price }
```

- `time`: `candles[k].time`
- `date`: `toDateString(candles[k].time)`
- `price`: `candles[k].close`

Nhờ vậy `index.jsx` (panel "Giá/Ngày chuyển Xanh/Đỏ", `lastSignal`), chart marker
overlay và mọi consumer khác **không cần sửa**.

## 7. Kiểm thử

- **Hồi quy thủ công đã chạy:** dữ liệu CLL thật → luật mới phát SELL ở mọi lần giá
  thủng MA20 (13/04, 21/04, 06/05, 13/05, 20/05, 01/06, 09/06), xóa khoảng trống 33 nến.
- **Unit test cần bổ sung** cho `generateSignals` (ví dụ trong
  `src/feature/chart/klinecharts/__tests__/` theo mẫu test sẵn có, hoặc cạnh `indicators.js`):
  1. Chuỗi nến dựng sẵn cho ra đúng một cặp BUY→SELL.
  2. Tín hiệu luôn xen kẽ: không bao giờ có hai `buy` (hoặc hai `sell`) liên tiếp.
  3. Đang `long`, giá thủng MA20 → phát `sell` ngay tại nến đó.
  4. Đang `flat`, giá trên MA20 nhưng MACD ≤ Signal → **không** phát `buy`.
  5. Ít hơn 34 nến → trả về mảng rỗng.

## 8. Rủi ro & đánh đổi

- Vào lệnh cần MACD xác nhận nên có thể **vào trễ** so với điểm giá cắt MA20 đầu tiên
  — chấp nhận được, đúng tinh thần "vào thận trọng".
- Bán chỉ theo giá nên ở mã nhiễu mạnh quanh MA20 có thể ra/vào hơi nhiều; vẫn tốt hơn
  nhiều so với bỏ sót lệnh bán như hiện tại.
