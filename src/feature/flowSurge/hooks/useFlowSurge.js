import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart DÒNG TIỀN TĂNG ĐỘT BIẾN — toàn board sắp theo % tăng dòng tiền hôm nay.
// API: /flow-surge → { generated_at, avg_window, rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang}] }
const fetchFlowSurge = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/flow-surge`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    avg_window: Number(data?.avg_window ?? 20),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useFlowSurge() {
  return useQuery({
    queryKey: ["flow-surge"],
    queryFn: fetchFlowSurge,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
