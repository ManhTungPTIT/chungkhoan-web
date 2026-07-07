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

// Đầu khung nến chứa thời điểm `time` (unix giây) theo interval.
// Token interval khớp TimelineStock/BE: 1m 5m 15m 30m 1h 1d 1w 1mth.
export function bucketStart(time, interval) {
  const seconds = INTERVAL_SECONDS[interval];
  if (seconds) return Math.floor(time / seconds) * seconds;

  if (interval === "1w") {
    // Tuần bắt đầu thứ Hai. Epoch (01/01/1970) là thứ Năm → ngày thứ d kể từ
    // epoch cách thứ Hai gần nhất trước đó (d + 3) % 7 ngày.
    const days = Math.floor(time / DAY);
    return (days - ((days + 3) % 7)) * DAY;
  }
  if (interval === "1mth") {
    const d = new Date(time * 1000);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000;
  }
  // Interval lạ → coi như khung ngày để không crash
  return Math.floor(time / DAY) * DAY;
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
