# Bỏ REST poll `/quotes`, chỉ dùng WS làm nguồn giá realtime cho chart

## Vấn đề

Chart hiện lấy giá realtime từ 2 nguồn song song: WS `/ws/quotes` (ưu tiên,
tức thời) và REST poll `/quotes` mỗi 5s (`useQuotes.js`, fallback khi WS
rớt — `index.jsx`: `streamQuote ?? quotes?.[chanelCode]`). REST poll tồn tại
vì trước đây nguồn WS (DNSE) từng chết hoàn toàn (tài khoản "Not authorized"
mọi topic, datafeed v1 ngừng hỗ trợ). Đã migrate sang DNSE OpenAPI v2 và xác
nhận tick cổ phiếu chảy ổn định trong giờ GD thật — REST poll không còn cần
thiết làm nguồn dữ liệu chính, chỉ còn là gọi API thừa mỗi 5s cho mọi client.

`/intraday` (lịch sử nến) KHÔNG đổi — vẫn là nguồn seed lịch sử duy nhất.

## Giải pháp

1. **Bỏ hẳn REST poll khỏi luồng vẽ chart**: `index.jsx` không còn gọi
   `useQuotes()`; `liveQuote` chỉ còn `isPlaceholderData ? null : streamQuote`.
   `useLiveCandles`/`mergeQuoteIntoCandles` không đổi logic — chỉ đổi nguồn
   input.

2. **Tách `normalizeQuote` khỏi `useQuotes.js`** sang file thuần
   `untils/normalizeQuote.js` (không phụ thuộc axios/react-query) — vì
   `quoteStream.js` (WS) đang import hàm này từ `hooks/useQuotes.js`, và
   `useQuotes.js` (chứa `fetchQuotes`/hook poll) sẽ bị xoá hoàn toàn.

3. **Xoá `useQuotes.js`** (hook poll + `fetchQuotes` + axios call) — không
   còn ai dùng sau bước 1-2.

4. **Thêm trạng thái kết nối WS** vào `quoteStream.js`: module đã có
   `ws.onopen`/`ws.onclose` nhưng không expose ra ngoài. Thêm
   `subscribeConnectionStatus(callback)` (pub/sub như `listeners`), gọi
   `callback(true)` khi `ws.onopen`, `callback(false)` khi `ws.onclose`. Gọi
   ngay với trạng thái hiện tại lúc đăng ký (như `TickHub.subscribe` bên BE
   đã làm với mailbox) để consumer không phải đợi sự kiện đầu tiên.

5. **Hook `useQuoteConnectionStatus()`** (file mới) bọc
   `subscribeConnectionStatus`, trả về `isDisconnected: boolean` — **debounce
   5 giây**: chỉ chuyển sang `true` (báo lỗi) nếu mất kết nối liên tục ≥5s;
   nối lại trong lúc chờ (backoff 1s/2s/4s bình thường) thì không bao giờ
   hiện banner. Trả về `false` (coi như đang kết nối) trong 5s đầu kể từ khi
   rớt, và ngay khi có tín hiệu `true` (đã kết nối) bất kỳ lúc nào.

6. **`index.jsx`**: thay `isQuotesError` bằng `isDisconnected` (từ hook mới)
   trong `DataStatusBanner`: `isError={isHistoryError || isDisconnected}`.
   Component `DataStatusBanner.jsx` KHÔNG đổi (vẫn nhận `isError`/`hasData`).

## Hành vi khi WS rớt tạm thời

Chart đứng yên (không cập nhật giá) cho tới khi WS tự nối lại (backoff có
sẵn, không đổi). KHÔNG mất dữ liệu vĩnh viễn — `/intraday` vẫn là nguồn sự
thật cho các nến đã đóng; chỉ nến đang hình thành không cập nhật realtime
trong lúc mất kết nối, tự bắt kịp ngay tick đầu tiên sau khi nối lại. Nghỉ
trưa (11:30-13:00, không có tick) không phải mất kết nối — WS vẫn mở, chỉ
đơn giản không có tick nào tới, hành vi này không đổi so với hiện tại.

## Tổ chức file test (dọn theo cấu trúc mới)

`hooks/__tests__/useQuotes.test.js` hiện chứa 3 nhóm test không liên quan
chặt: `normalizeQuote`, `fetchQuotes`, và `useLiveCandles` (hook). Xoá cả
file, chuyển:
- `normalizeQuote` → `untils/__tests__/normalizeQuote.test.js` (theo vị trí
  mới của hàm).
- `fetchQuotes` → xoá hẳn (tính năng bị xoá).
- `useLiveCandles` (hook) → `hooks/__tests__/useLiveCandles.test.js` (file
  mới — hook này chưa có file test riêng, hiện đang tạm trú trong
  `useQuotes.test.js`).

`untils/__tests__/liveCandle.test.js` (test hàm thuần `mergeQuoteIntoCandles`/
`bucketStart`) không đổi — không trùng phạm vi với test hook `useLiveCandles`
ở trên.

## Ngoài phạm vi

- `/intraday`, `useIntraday.js`: không đổi.
- Backend (`tick_hub.py`, `/ws/quotes`, `/quotes` REST endpoint): không đổi
  — endpoint `/quotes` vẫn tồn tại ở BE (dùng cho mục đích khác nếu có,
  vd `fetchQuotes` không còn ai gọi từ chart nhưng endpoint BE không bị xoá).
- Cơ chế reconnect/backoff của `quoteStream.js` (1s→30s, market-closed retry
  60s, idle-close 30s): không đổi, chỉ thêm broadcast trạng thái.
