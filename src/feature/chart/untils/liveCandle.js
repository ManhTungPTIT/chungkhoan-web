// Gộp giá realtime (snapshot /quotes) vào mảng nến lịch sử (/intraday).
// Mọi tính toán theo UTC để khớp normalizeCandle ("YYYY-MM-DD" → 00:00 UTC).

const INTERVAL_SECONDS = {
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "30m": 30 * 60,
  "1h": 60 * 60,
  "1d": 24 * 60 * 60,
};

const DAY = 24 * 60 * 60;

// Nến ngày/tuần/tháng neo theo NGÀY GIAO DỊCH giờ VN (UTC+7): vnstock đóng dấu
// nến ngày tại nửa đêm giờ VN (= 17:00 UTC hôm trước), còn quote realtime khi
// thiếu time riêng lại rơi về thời điểm snapshot "bây giờ" (giờ UTC trong phiên).
// Nếu chia khung theo ngày UTC thì một ngày giao dịch VN bị tách làm hai khung
// → sinh nến "ma". Cộng offset VN trước khi floor để cả hai về cùng khung, rồi
// trừ lại offset để mốc trả về vẫn là nửa đêm giờ VN (khớp stamp của nến ngày).
const VN_OFFSET = 7 * 60 * 60;

// Khung neo theo NGÀY GIAO DỊCH (ngày/tuần/tháng) — chỉ các khung này dính hiện
// tượng "nến ma" khi restamp giá phiên cũ sang mốc nửa đêm giờ VN của ngày mới.
const DAY_FRAME_INTERVALS = new Set(["1d", "1w", "1mth"]);

// "Nến ma": quote sắp được NỐI như một phiên (ngày/tuần/tháng) MỚI nhưng thực ra
// KHÔNG mang dữ liệu phiên mới — /quotes cuối tuần / trước giờ mở cửa / nghỉ lễ
// trả lại nguyên giá chốt phiên trước (đã xác nhận: volume trùng khít nến cuối).
// Nối vào sẽ tạo nến phẳng O=H=L=C sao chép phiên trước → lệch SMA20/MACD →
// generateSignals lật SELL/BUY GIẢ, khác hẳn tín hiệu panel (BE đã chặn bằng
// signal_service._phantom_candle). Đây là cùng một bug nến ma, chặn ở phía FE.
//
// Chặn khi khung là ngày/tuần/tháng VÀ:
//   - đầu khung rơi vào T7/CN (không thể có phiên giao dịch mới), HOẶC
//   - giá quote trùng close nến cuối (board đang trả lại giá phiên trước).
// FE chỉ có `price` (close) từ /quotes nên so close; BE có đủ OHLC nên so cả 3 —
// chấp nhận sai số hiếm: phiên thật mà giá khớp đầu tiên đúng bằng close hôm
// trước sẽ hiện nến trễ 1 nhịp tới tick đổi giá (giống đánh đổi của BE).
function isPhantomAppend(interval, last, price, quoteBucket) {
  if (!DAY_FRAME_INTERVALS.has(interval)) return false;
  const vnDay = new Date((quoteBucket + VN_OFFSET) * 1000).getUTCDay(); // 0=CN … 6=T7
  if (vnDay === 0 || vnDay === 6) return true;
  return Math.abs(price - last.close) < 1e-6;
}

// Đầu khung nến chứa thời điểm `time` (unix giây) theo interval.
// Token interval khớp TimelineStock/BE: 1m 5m 15m 30m 1h 1d 1w 1mth.
export function bucketStart(time, interval) {
  const seconds = INTERVAL_SECONDS[interval];
  // Khung nội ngày (phút/giờ): floor theo giây, độc lập múi giờ.
  if (seconds && interval !== "1d") return Math.floor(time / seconds) * seconds;

  const vn = time + VN_OFFSET; // quy về "giờ VN" trước khi cắt khung theo ngày

  if (interval === "1w") {
    // Tuần bắt đầu thứ Hai. Epoch (01/01/1970) là thứ Năm → ngày thứ d kể từ
    // epoch cách thứ Hai gần nhất trước đó (d + 3) % 7 ngày.
    const days = Math.floor(vn / DAY);
    return (days - ((days + 3) % 7)) * DAY - VN_OFFSET;
  }
  if (interval === "1mth") {
    const d = new Date(vn * 1000);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000 - VN_OFFSET;
  }
  // "1d" và interval lạ → khung ngày giờ VN
  return Math.floor(vn / DAY) * DAY - VN_OFFSET;
}

/**
 * Trả về mảng nến mới đã gộp quote {price, time, volume?}:
 *  - quote cùng khung với nến cuối → cập nhật close, nới high/low
 *  - quote sang khung mới → append nến seed từ price (OHLC = price)
 *  - quote cũ hơn nến cuối / không hợp lệ / chưa có lịch sử → giữ nguyên
 *
 * So khung bằng bucketStart cả hai phía nên nến nguồn không stamp đúng đầu
 * khung (vd nến tuần stamp giữa tuần) vẫn nhận ra đúng.
 *
 * `volume` của quote là khối lượng CỘNG DỒN trong ngày → chỉ ghi vào nến
 * khung 1d; các khung khác giữ volume cũ (0 với nến mới append).
 *
 * Không có gì thay đổi thì trả về ĐÚNG reference cũ để consumer (useMemo
 * signals, chart redraw) không chạy lại vô ích.
 */
export function mergeQuoteIntoCandles(candles, quote, interval) {
  if (
    !quote ||
    !Number.isFinite(quote.price) ||
    !Number.isFinite(quote.time)
  ) {
    return candles ?? [];
  }

  const { price, time, volume } = quote;
  const dayVolume =
    interval === "1d" && Number.isFinite(volume) ? volume : null;
  const quoteBucket = bucketStart(time, interval);

  if (!candles?.length) {
    return [
      {
        time: quoteBucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: dayVolume ?? 0,
      },
    ];
  }

  const last = candles[candles.length - 1];
  const lastBucket = bucketStart(last.time, interval);

  if (quoteBucket < lastBucket) return candles;

  if (quoteBucket === lastBucket) {
    const next = {
      ...last,
      close: price,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      ...(dayVolume !== null ? { volume: dayVolume } : {}),
    };
    if (
      next.close === last.close &&
      next.high === last.high &&
      next.low === last.low &&
      next.volume === last.volume
    ) {
      return candles;
    }
    return [...candles.slice(0, -1), next];
  }

  // Sang khung mới nhưng là nến ma (giá phiên cũ bị restamp sang ngày mới) →
  // giữ nguyên candles, không nối. Trả đúng reference cũ để consumer khỏi re-render.
  if (isPhantomAppend(interval, last, price, quoteBucket)) return candles;

  return [
    ...candles,
    {
      time: quoteBucket,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: dayVolume ?? 0,
    },
  ];
}
