import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// API trả: { generated_at, windows, symbols, series:{t<n>}, max_value, zones }
// `windows` = chuỗi cửa sổ T+ muốn xem, vd "2,3,5" hoặc "2,4,7".
const fetchTplusWave = async (windows) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/tplus-wave`,
    { params: { windows } },
  );
  return {
    generated_at: data?.generated_at ?? null,
    windows: Array.isArray(data?.windows) ? data.windows : undefined,
    symbols: Array.isArray(data?.symbols) ? data.symbols : [],
    series: data?.series ?? {},
    max_value: Number(data?.max_value ?? 0),
    // Radar chia vùng: top mã RIÊNG của từng cửa sổ (BE mới); thiếu → undefined.
    zones: data?.zones,
  };
};

export function useTplusWave(windows = "2,3,5") {
  return useQuery({
    queryKey: ["tplus-wave", windows],
    queryFn: () => fetchTplusWave(windows),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
