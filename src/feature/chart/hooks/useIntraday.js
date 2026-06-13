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
  };
}

const fetchIntraday = async (symbol) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/api/python/intraday`,
    {
      params: { symbol },
    },
  );

  return Object.values(data.data).map(normalizeCandle);
};

export function useIntraday(symbol = "VNINDEX") {
  return useQuery({
    queryKey: ["intraday", symbol],
    queryFn: () => fetchIntraday(symbol),
    refetchInterval: 60 * 1000,
    staleTime: 2 * 60 * 1000, //thoi gian du cho data coi nhu la moi
  });
}
