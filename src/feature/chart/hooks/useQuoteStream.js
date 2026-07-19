import { useEffect, useState } from "react";
import { subscribeQuote } from "../untils/quoteStream";

/**
 * Quote realtime mới nhất của một mã qua WebSocket /ws/quotes.
 * Trả {price, time, volume?} hoặc null khi: chưa có tick, mất kết nối,
 * symbol rỗng, vừa đổi mã. Không còn REST poll dự phòng — null nghĩa là
 * chưa có giá để hiển thị (xem useQuoteConnectionStatus cho banner lỗi).
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
