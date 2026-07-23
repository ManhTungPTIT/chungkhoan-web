import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// GET /sectors trả mảng ngành ICB cấp 3 đã sort giảm dần theo total_value:
//   [{ group, icb_code, total_value, symbol_count }]
// total_value = luỹ kế giá trị KHỚP LỆNH của rổ VN100 (không gồm thoả thuận).
// Chấp nhận cả dạng bọc { data: [...] } cho khớp các endpoint khác.
const fetchSectorFlow = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/sectors`,
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// queryKey riêng (không dùng chung với useSector của feature stock) để nhịp
// refetch của trang này độc lập với bộ lọc cổ phiếu.
export function useMoneyFlowSector() {
  return useQuery({
    queryKey: ["money-flow-sector"],
    queryFn: fetchSectorFlow,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
