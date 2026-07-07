import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";

// API trả time là unix giây hoặc chuỗi ngày "YYYY-MM-DD", OHLC dạng chuỗi
// → chuẩn hóa time về unix giây, OHLC về number cho mọi consumer
// (chart.jsx lọc bỏ nến có time không phải number → chart trắng nếu thiếu bước này)
function normalizeTimeToSeconds(time) {
  if (typeof time === "number") {
    // Backend có thể trả unix giây (10 chữ số) hoặc mili-giây (13 chữ số).
    return time > 1e12 ? Math.floor(time / 1000) : time;
  }
  return Math.floor(new Date(time).getTime() / 1000);
}

export function normalizeCandle(item) {
  return {
    ...item,
    time: normalizeTimeToSeconds(item.time),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
    // volume cho biểu đồ Volume; thiếu/"nan" → 0 để không vẽ cột rác
    volume: Number.isFinite(Number(item.volume)) ? Number(item.volume) : 0,
  };
}

export const fetchIntraday = async (symbol, interval = "1d") => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/intraday`,
    {
      params: { symbol, interval },
    },
  );

  // vnstock pad nến giờ nghỉ/lễ bằng "nan" → Number("nan")=NaN; một nến NaN
  // làm hỏng thang giá klinecharts → chart trắng. Lọc bỏ nến OHLC không hợp lệ.
  const raw = Object.values(data.data ?? {});
  const valid = raw
    .map(normalizeCandle)
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close),
    );

  if (raw.length > 0 && valid.length === 0) {
    console.warn("Intraday data exists but all candles are invalid", {
      symbol,
      interval,
      sample: raw.slice(0, 3),
    });
  }

  return valid;
};

export function useIntraday(symbol = "VNINDEX", interval = "1d") {
  return useQuery({
    queryKey: ["intraday", symbol, interval],
    queryFn: () => fetchIntraday(symbol, interval),
    // Backend /intraday chậm ~2-3s mỗi lần gọi. Cache để bớt gọi lại:
    // staleTime: trong 5' coi data là mới → xem lại mã vừa xem là tức thì,
    // không refetch ngầm (không nhấp nháy). gcTime: giữ cache 30' kể cả khi
    // rời mã, nên quay lại trong 30' vẫn còn data.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Giữ nến của mã CŨ trong lúc tải mã mới → biểu đồ không trắng. Trong
    // giai đoạn này isPlaceholderData=true để UI hiện overlay "đang cập nhật".
    placeholderData: keepPreviousData,
    // KHÔNG refetchInterval: lịch sử chỉ tải 1 lần/mã; giá realtime đi qua
    // useQuotes (1 endpoint chung mọi mã) và merge bằng useLiveCandles.
  });
}
