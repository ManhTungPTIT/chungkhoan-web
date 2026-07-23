import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart "DÒNG TIỀN PHE BÒ VÀ PHE GẤU" — cộng giá trị khớp lệnh toàn thị trường
// theo 5 phe. API: /bull-bear → { generated_at, total_value,
// groups: [{ key, label, value, pct }] } — groups đã đúng THỨ TỰ CỘT cố định.
const fetchBullBear = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/bull-bear`,
  );
  return {
    generated_at: data?.generated_at ?? null,
    total_value: Number(data?.total_value ?? 0),
    groups: Array.isArray(data?.groups) ? data.groups : [],
  };
};

export function useBullBear() {
  return useQuery({
    queryKey: ["bull-bear"],
    queryFn: fetchBullBear,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
