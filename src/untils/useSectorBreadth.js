import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Một request phục vụ CẢ HAI chart theo ngành (xu hướng tích cực/tiêu cực và
// tổng hợp tăng giảm) — chung queryKey nên React Query gộp thành một lần gọi.
// API: /sector-breadth → { industries: [{ name, icb_code, count, counts, pcts,
//   value, volume, avg_price, change_pct }] }
const fetchSectorBreadth = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/sector-breadth`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    industries: Array.isArray(data?.industries) ? data.industries : [],
  };
};

export function useSectorBreadth() {
  return useQuery({
    queryKey: ["sector-breadth"],
    queryFn: fetchSectorBreadth,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
