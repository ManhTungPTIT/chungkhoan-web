import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả về mảng ngành: [{ group, icb_code, symbols:[{symbol, change_pct, market_cap}] }]
// Chấp nhận cả dạng bọc { data: [...] } để khớp các endpoint khác trong dự án.
const fetchHeatmap = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/heatmap`,
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export function useHeatmap() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
