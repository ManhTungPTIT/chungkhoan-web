import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchIntraday = async (symbol) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/intraday`,
    {
      params: { symbol },
    },
  );

  return Object.values(data.data).map((item) => ({
    ...item,
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
  }));
};

export function useIntraday(symbol = "VNINDEX") {
  return useQuery({
    queryKey: ["intraday", symbol],
    queryFn: () => fetchIntraday(symbol),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}
