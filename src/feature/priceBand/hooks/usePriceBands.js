import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart "DÒNG TIỀN THEO NHÓM GIÁ CỔ PHIẾU". API: /price-bands →
// { generated_at, total_value, groups: [{ key, label, value, pct }] }
// groups đã đúng thứ tự khoảng giá tăng dần.
const fetchPriceBands = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/price-bands`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    total_value: Number(data?.total_value ?? 0),
    groups: Array.isArray(data?.groups) ? data.groups : [],
  };
};

export function usePriceBands() {
  return useQuery({
    queryKey: ["price-bands"],
    queryFn: fetchPriceBands,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
