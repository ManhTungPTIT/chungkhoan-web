import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Một request phục vụ CẢ HAI chart "5 phiên gần nhất" (giá trị và tỷ trọng):
// payload đã có sẵn `values` lẫn `pcts`. Hai chart dùng chung queryKey nên React
// Query gộp thành một lần gọi dù cùng hiển thị trên một trang.
// API: /sector-flow?sessions=N →
//   { sessions: [unix...], totals: [VND...],
//     industries: [{ name, icb_code, values: [VND...], pcts: [%...], total }] }
const fetchSectorFlow = async (sessions) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/sector-flow`,
    { params: { sessions } },
  );
  return {
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    totals: Array.isArray(data?.totals) ? data.totals : [],
    industries: Array.isArray(data?.industries) ? data.industries : [],
  };
};

export function useSectorFlow(sessions = 5) {
  return useQuery({
    queryKey: ["sector-flow", sessions],
    queryFn: () => fetchSectorFlow(sessions),
    // Dữ liệu chỉ đổi 1 lần/ngày (job nền quét nến ngày toàn thị trường) nên
    // không cần nhịp 60s như các chart realtime.
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}
