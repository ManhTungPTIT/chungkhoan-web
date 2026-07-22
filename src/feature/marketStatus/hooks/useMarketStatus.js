import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart "DIỄN BIẾN THỊ TRƯỜNG" — 5 nhóm loại trừ lẫn nhau (tăng trần/tăng giá/
// đứng giá/giảm giá/giảm sàn), đếm toàn thị trường (3 sàn gộp).
// API: /market-status → { generated_at, total, groups: { limit_up|up|flat|down|limit_down: { count, pct } } }
const fetchMarketStatus = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/market-status`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    total: Number(data?.total ?? 0),
    groups: data?.groups ?? {},
  };
};

export function useMarketStatus() {
  return useQuery({
    queryKey: ["market-status"],
    queryFn: fetchMarketStatus,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
