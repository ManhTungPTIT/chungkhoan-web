import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API: /index-overview → { generated_at, indices:[{ten_san, diem_hien_tai,
// diem_dong_cua_phien_truoc, gia_tri_khop_lenh, diem_tang_giam, pct}] }
const fetchIndexOverview = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/index-overview`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    indices: Array.isArray(data?.indices) ? data.indices : [],
  };
};

export function useIndexOverview() {
  return useQuery({
    queryKey: ["index-overview"],
    queryFn: fetchIndexOverview,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
