import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart DÒNG TIỀN TĂNG ĐỘT BIẾN SO VỚI BÌNH QUÂN 1 THÁNG — như flow-surge nhưng
// chặt hơn (tiền hôm nay ≥ 5 tỷ, đủ ≥ 20 phiên nền).
// API: /flow-surge-month → { generated_at, avg_window, rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang}] }
const fetchFlowSurgeMonth = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/flow-surge-month`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    avg_window: Number(data?.avg_window ?? 20),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useFlowSurgeMonth() {
  return useQuery({
    queryKey: ["flow-surge-month"],
    queryFn: fetchFlowSurgeMonth,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
