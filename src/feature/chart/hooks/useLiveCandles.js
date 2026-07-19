import { useRef } from "react";
import { mergeQuoteIntoCandles } from "../untils/liveCandle";

const EMPTY = [];

/**
 * Gộp giá realtime (WS /ws/quotes qua useQuoteStream) vào lịch sử nến (useIntraday) và TÍCH LUỸ
 * kết quả giữa các tick: nến đang hình thành giữ được high/low trong khung,
 * các nến đã append phía client không mất đi khi tick mới tới.
 *
 * Reset về lịch sử gốc khi: đổi mã, đổi khung, hoặc lịch sử refetch
 * (baseCandles đổi reference) — lúc đó data server là nguồn đúng nhất.
 *
 * Ghi ref trong lúc render là an toàn ở đây vì mergeQuoteIntoCandles
 * idempotent (merge cùng quote 2 lần trả về đúng reference cũ) → StrictMode
 * double-render không tạo khác biệt.
 */
export function useLiveCandles(baseCandles, quote, symbol, interval) {
  const base = baseCandles ?? EMPTY;
  const ref = useRef(null);

  if (
    !ref.current ||
    ref.current.base !== base ||
    ref.current.symbol !== symbol ||
    ref.current.interval !== interval
  ) {
    ref.current = { base, symbol, interval, merged: base };
  }

  if (quote) {
    ref.current.merged = mergeQuoteIntoCandles(
      ref.current.merged,
      quote,
      interval,
    );
  }

  return ref.current.merged;
}
