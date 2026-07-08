import { useEffect, useState } from "react";
import { subscribeQuote } from "../untils/quoteStream";

/**
 * Quote realtime mới nhất của một mã qua WebSocket /ws/quotes.
 * Trả {price, time, volume?} — CÙNG shape với quote poll của useQuotes —
 * hoặc null khi: chưa có tick, mất kết nối, symbol rỗng, vừa đổi mã.
 * Caller (index.jsx) dùng `streamQuote ?? quotePoll` nên null = fallback poll.
 */
export function useQuoteStream(symbol) {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    // Đổi mã → xóa quote mã cũ NGAY, không chờ tick mã mới (tránh merge
    // giá mã cũ vào nến mã mới trong khoảnh khắc chuyển).
    setQuote(null);
    if (!symbol) return undefined;
    return subscribeQuote(symbol, setQuote);
  }, [symbol]);

  return quote;
}
