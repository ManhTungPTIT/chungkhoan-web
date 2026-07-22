import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Dữ liệu thật: board thị trường /vn100 (VNALL + HNX, đã lọc value + gắn signal).
// Trả mảng row board thô; component map/scale qua buildPotentialView.
const fetchBoard = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/vn100`,
  );
  return Array.isArray(data?.data) ? data.data : [];
};

export function usePotentialFlow() {
  return useQuery({
    queryKey: ["potential-flow"],
    queryFn: fetchBoard,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
