import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Bản đồ sức mạnh dòng tiền — endpoint riêng /power: chỉ rổ VN100 đã lọc sẵn
// ở backend, tươi theo chu kỳ nền ~20s (nhanh hơn /vn100 vốn cache ~1 tiếng),
// payload nhỏ (symbol/price/change_pct/value).
const fetchPower = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/power`,
  );

  return data.data.map((item) => ({
    ...item,
    price: Number(item.price),
    change_pct: Number(item.change_pct),
  }));
};

export function usePower() {
  return useQuery({
    queryKey: ["power"],
    queryFn: () => fetchPower(),
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
  });
}
