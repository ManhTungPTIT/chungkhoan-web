import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả: { generated_at, window, rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang}] }
// rows = mã đang HOLD đúng T+2, xếp theo % tăng giảm dần.
const fetchTopGainT2 = async (window) => {
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

export function useTopGainT2(window = 2) {
  return useQuery({
    queryKey: ["top-gain-tplus", window],
    queryFn: () => fetchTopGainT2(window),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
