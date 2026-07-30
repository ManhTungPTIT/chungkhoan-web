import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// GET /sector-flow-consistency → { generated_at, sessions, dates:[...],
//   rows:[{ group, icb_code, scores:[...], mean, std, ratio, positive_sessions }] }
// BE đọc cache RAM nên rẻ, nhưng dữ liệu là NẾN NGÀY ĐÃ ĐÓNG — trong phiên nó
// gần như không đổi (chỉ đổi khi refresh 15:05 nuốt thêm nến hôm nay). Vì vậy
// nhịp refetch thưa hơn hẳn các chart realtime khác trong repo.
const fetchSectorFlowConsistency = async (sessions) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/sector-flow-consistency`,
    { params: { sessions } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    sessions: data?.sessions ?? sessions,
    dates: Array.isArray(data?.dates) ? data.dates : [],
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useSectorFlowConsistency(sessions = 30) {
  return useQuery({
    queryKey: ["sector-flow-consistency", sessions],
    queryFn: () => fetchSectorFlowConsistency(sessions),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });
}
