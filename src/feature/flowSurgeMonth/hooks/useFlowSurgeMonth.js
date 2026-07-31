import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart DÒNG TIỀN TĂNG ĐỘT BIẾN SO VỚI BÌNH QUÂN 1 THÁNG — như flow-surge nhưng
// chặt hơn (tiền hôm nay ≥ 5 tỷ, đủ ≥ 20 phiên nền ≈ 1 tháng giao dịch).
// Xếp theo diem = pct_tang × log10(gia_tri_khop_lenh + 1) × (1 + pct_gia / 100).
// `pct_gia` (% tăng giá hôm nay) chỉ nghiêng nhẹ thứ hạng và KHÔNG có cột riêng
// trên chart — cần soi thì đọc thẳng field này.
// API: /flow-surge-month → { generated_at, avg_window, time_bucket, baseline_factor,
//                            rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang, pct_gia, diem}] }
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
