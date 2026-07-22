import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart T+3 độc lập — gọi endpoint với window=3.
// API trả: { generated_at, window, rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang}] }
const fetchTopGainT3 = async (window) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/top-gain-tplus`,
    { params: { window } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    window: Number(data?.window ?? window),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useTopGainT3(window = 3) {
  return useQuery({
    queryKey: ["top-gain-tplus", window],
    queryFn: () => fetchTopGainT3(window),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
