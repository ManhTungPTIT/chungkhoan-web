import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả time là unix giây hoặc chuỗi ngày "YYYY-MM-DD", OHLC dạng chuỗi
// → chuẩn hóa time về unix giây, OHLC về number cho mọi consumer
// (chart.jsx lọc bỏ nến có time không phải number → chart trắng nếu thiếu bước này)
export function normalizeCandle(item) {
  return {
    ...item,
    time:
      typeof item.time === "number"
        ? item.time
        : Math.floor(new Date(item.time).getTime() / 1000),
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
  return Object.values(data.data)
    .map(normalizeCandle)
    .filter(
      (c) =>
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close),
    );
};

export function useIntraday(symbol = "VNINDEX", interval = "1d") {
  return useQuery({
    queryKey: ["intraday", symbol, interval],
    queryFn: () => fetchIntraday(symbol, interval),
    refetchInterval: 60 * 1000,
    staleTime: 2 * 60 * 1000, //thoi gian du cho data coi nhu la moi
  });
}
