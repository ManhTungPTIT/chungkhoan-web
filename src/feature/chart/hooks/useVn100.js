import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchVn100 = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/vn100`,
  );

  return Object.values(data.data)
    .map((item) => ({
      ...item,
      price: Number(item.price),
      change_pct: Number(item.change_pct),
    }))
    .sort((a, b) => b.change_pct - a.change_pct);
};

export function useVn100() {
  return useQuery({
    queryKey: ["vn100"],
    queryFn: () => fetchVn100(),
    refetchInterval: 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
