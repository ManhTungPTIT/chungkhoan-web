import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả: { generated_at, symbols:[...], series:{t2,t3,t5}, max_value }
// symbols = top mã đang buy, xếp theo mức tăng T+5 giảm dần.
const fetchTplusWave = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/tplus-wave`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    symbols: Array.isArray(data?.symbols) ? data.symbols : [],
    series: {
      t2: data?.series?.t2 ?? [],
      t3: data?.series?.t3 ?? [],
      t5: data?.series?.t5 ?? [],
    },
    max_value: Number(data?.max_value ?? 0),
  };
};

export function useTplusWave() {
  return useQuery({
    queryKey: ["tplus-wave"],
    queryFn: fetchTplusWave,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
