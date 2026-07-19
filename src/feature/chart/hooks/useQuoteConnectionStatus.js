import { useEffect, useRef, useState } from "react";
import { subscribeConnectionStatus } from "../untils/quoteStream";

const GRACE_MS = 5000;

/**
 * true khi WS mất kết nối LIÊN TỤC ≥5s (debounce) — dùng để báo banner lỗi
 * mà không nhấp nháy theo mỗi lần backoff reconnect (1s/2s/4s) bình thường.
 * Nối lại bất cứ lúc nào trong 5s đầu → không bao giờ báo lỗi.
 */
export function useQuoteConnectionStatus() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const unsubscribe = subscribeConnectionStatus((connected) => {
      clearTimer();
      if (connected) {
        setIsDisconnected(false);
        return;
      }
      timerRef.current = setTimeout(() => setIsDisconnected(true), GRACE_MS);
    });

    return () => {
      clearTimer();
      unsubscribe();
    };
  }, []);

  return isDisconnected;
}
