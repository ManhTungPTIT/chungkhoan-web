import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart DÒNG TIỀN TĂNG ĐỘT BIẾN — toàn board xếp theo diem = (thanh khoản hôm nay
// / nền cùng khung giờ) × log10(thanh khoản Tỷ + 1). Hai cột vẽ ra CHÍNH LÀ hai
// thừa số: cột xanh `pct_tang` là tỷ số đó dạng % ((ratio − 1) × 100), cột tím
// `gia_tri_khop_lenh` là con số nằm trong log10.
// API: /flow-surge → { generated_at, avg_window, time_bucket, baseline_factor,
//                      rows:[{symbol, gia_tri_khop_lenh, gia_hien_tai, pct_tang, diem}] }
const fetchFlowSurge = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/flow-surge`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    avg_window: Number(data?.avg_window ?? 20),
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useFlowSurge() {
  return useQuery({
    queryKey: ["flow-surge"],
    queryFn: fetchFlowSurge,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
