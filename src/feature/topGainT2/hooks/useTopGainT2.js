import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả: { generated_at, window,
//            rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang, diem}] }
// rows = rổ vn100 lọc value hôm nay > 1 tỷ + chỉ mã tăng giá; pct_tang so nến đã
// đóng lùi (window + 1) phiên; xếp giảm dần theo diem = pct_tang ×
// log10(thanh khoản Tỷ + 1), top 20 (mặc định của endpoint).
const fetchTopGainT2 = async (window) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/top-gain-tplus`,
    { params: { window } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    window: Number(data?.window ?? window),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useTopGainT2(window = 2) {
  return useQuery({
    queryKey: ["top-gain-tplus", window],
    queryFn: () => fetchTopGainT2(window),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
