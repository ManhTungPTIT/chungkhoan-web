import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API: /index-overview → { generated_at, so_phien_tb, indices:[{ten_san,
// diem_hien_tai, diem_dong_cua_phien_truoc, gia_tri_khop_lenh, thanh_khoan_pct,
// diem_tang_giam, pct}] }
//
// so_phien_tb = số phiên nền dùng để tính thanh khoản; 0 nghĩa là BE chưa quét
// xong sector_flow_history → mọi thanh_khoan_pct sẽ là null.
const fetchIndexOverview = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/index-overview`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    so_phien_tb: Number(data?.so_phien_tb) || 0,
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
