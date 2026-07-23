import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Ngưỡng mặc định 20 tỷ — trùng mặc định của BE, để đây cho FE nói rõ trên UI.
export const DEFAULT_MIN_TY = 20;

// GET /put-through?min_value=<tỷ đồng> → [{ symbol, exchange, value, volume,
// deal_count, group, icb_code }] đã gom theo mã, lọc ngưỡng, sort giảm dần.
const fetchPutThrough = async (minTy) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/put-through`,
    { params: { min_value: minTy } },
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export function usePutThrough(minTy = DEFAULT_MIN_TY) {
  return useQuery({
    queryKey: ["put-through", minTy],
    queryFn: () => fetchPutThrough(minTy),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
