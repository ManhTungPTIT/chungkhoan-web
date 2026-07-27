import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart TOP TĂNG MẠNH NHẤT TUẦN — cả rổ vn100 sắp theo % tăng của 5 phiên đã
// đóng gần nhất (KHÔNG tính phiên hôm nay); % so close phiên đầu cửa sổ.
// API: /top-gain-period?period=week → { generated_at, period, start, sessions, rows:[...] }
const fetchTopGainWeek = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/top-gain-period`,
    { params: { period: "week" } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    start: data?.start ?? null,
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useTopGainWeek() {
  return useQuery({
    queryKey: ["top-gain-period", "week"],
    queryFn: fetchTopGainWeek,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
