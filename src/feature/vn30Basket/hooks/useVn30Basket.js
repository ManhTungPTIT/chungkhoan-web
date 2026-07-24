import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart "MÃ RỔ VN30" — API /vn30-basket trả { generated_at, rows }.
// rows: [{ symbol, change_pct, value_ty, price_nghin, status }] đã sắp theo %
// giảm dần.
const fetchVn30Basket = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/vn30-basket`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    rows: Array.isArray(data?.rows) ? data.rows : [],
  };
};

export function useVn30Basket() {
  return useQuery({
    queryKey: ["vn30-basket"],
    queryFn: fetchVn30Basket,
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
  });
}
