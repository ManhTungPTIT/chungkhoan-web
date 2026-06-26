import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchMarketBreadth = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/homepage/market-breadth`,
  );

  return data;
};

export default function useMarketBreadth() {
  return useQuery({
    queryKey: ["marketBreadth"],
    queryFn: () => fetchMarketBreadth(),
  });
}
