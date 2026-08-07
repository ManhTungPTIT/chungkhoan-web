import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Lớp phủ tín hiệu của một BOT — endpoint /signals.
 *
 * `/vn100` chỉ mang tín hiệu của BOT Trend (backend chỉ tính một thuật toán),
 * nên bảng bộ lọc của T+ / Dài hạn phải lấy thêm lớp phủ này rồi ghép theo mã
 * (xem mergeBotSignals). Trả CHỈ phần tín hiệu — giá/%/ngành đã có từ /vn100.
 */
export const fetchBotSignals = async (bot) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/signals`,
    { params: { bot } },
  );
  // Mặc định {} chứ không undefined: chỗ merge phía sau khỏi phải chắn null,
  // và "chưa có mã nào" với "hỏng" được phân biệt bằng isError chứ không bằng
  // hình dạng dữ liệu.
  return data?.data ?? {};
};

export function useBotSignals(bot) {
  return useQuery({
    queryKey: ["signals", bot],
    queryFn: () => fetchBotSignals(bot),
    // BOT Trend đã nằm sẵn trong /vn100 → gọi nữa là tốn một request và một
    // lượt tính ở BE cho đúng thứ đang có trong tay.
    enabled: bot !== "trend",
    // Khớp ĐÚNG nhịp useVn100: lệch nhịp thì giá và tín hiệu trên cùng một dòng
    // đến từ hai thời điểm khác nhau.
    refetchInterval: 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
