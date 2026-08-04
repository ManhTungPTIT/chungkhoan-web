import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart TOP MÃ VƯỢT NỀN TÍCH LŨY 30 PHIÊN — mã đi ngang trong nền hẹp 30 phiên
// rồi vừa vượt lên trên đỉnh nền, có thanh khoản xác nhận.
// API: /base-breakout → {
//   generated_at, base_window, avg_window, time_bucket, baseline_factor,
//   rows: [{ symbol, gia_hien_tai, bien_do_nen, vuot_nen, tang_tu_day,
//            tl_thanh_khoan, gia_tri_khop_lenh, diem }],
//   summary: { count, total_gtgd_ty, avg_vuot_nen, avg_tl_thanh_khoan,
//              strong_flow_count }
// }
// `rows` đã sắp theo `diem` giảm dần và cắt sẵn 15 mã (số bong bóng trên ảnh
// nền); `summary` thì tính trên TOÀN BỘ mã qua lọc — hai con số khác nhau là
// đúng, đừng "sửa" cho khớp.
const fetchBaseBreakout = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/base-breakout`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    base_window: Number(data?.base_window ?? 30),
    avg_window: Number(data?.avg_window ?? 20),
    rows: Array.isArray(data?.rows) ? data.rows : [],
    summary: data?.summary ?? null,
  };
};

export function useBaseBreakout() {
  return useQuery({
    queryKey: ["base-breakout"],
    queryFn: fetchBaseBreakout,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
