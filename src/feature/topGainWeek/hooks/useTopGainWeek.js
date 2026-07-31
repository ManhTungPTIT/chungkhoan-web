import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart TOP TĂNG MẠNH NHẤT TUẦN — rổ vn100 lọc thanh khoản hôm nay > 1 tỷ + chỉ
// mã tăng giá, xếp theo diem = % tăng × log10(thanh khoản Tỷ + 1). % tính so
// close phiên ĐẦU cửa sổ (5 phiên đã đóng gần nhất, KHÔNG tính phiên hôm nay);
// gia_tri_khop_lenh là thanh khoản HÔM NAY (chính hệ số của diem), không phải
// số cộng dồn 5 phiên như trước 31/07.
// API: /top-gain-period?period=week → { generated_at, period, start, sessions, rows:[...] }
const fetchTopGainWeek = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/top-gain-period`,
    { params: { period: "week" } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    start: data?.start ?? null,
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useTopGainWeek() {
  return useQuery({
    queryKey: ["top-gain-period", "week"],
    queryFn: fetchTopGainWeek,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
