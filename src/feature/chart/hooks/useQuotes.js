import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Snapshot giá hiện tại của TẤT CẢ mã trong MỘT request — thay cho việc mỗi
// client refetch cả lịch sử /intraday mỗi 5s. BE chạy job nền gọi nguồn dữ
// liệu 1 lần/chu kỳ rồi serve snapshot từ RAM, nên endpoint này rẻ dù bao
// nhiêu user cùng poll.
//
// Contract BE:  GET /quotes  →
// { "time": "2026-07-07T10:30:00+07:00",
//   "data": { "AAA": { "price": 62.9, "volume": 5000, "time": 1751856245? }, ... } }
//   - time (ngoài): thời điểm snapshot — áp cho mọi mã không có time riêng
//   - price:  giá khớp gần nhất, CÙNG ĐƠN VỊ với nến /intraday của mã đó
//             (BE đã quy đổi: cổ phiếu nghìn đồng, index điểm); <= 0 bị loại
//   - volume: KL cộng dồn trong ngày (tùy chọn)
//   - time (từng mã, tùy chọn): unix giây hoặc chuỗi parse được bởi new Date()

export function normalizeQuote(item, fallbackTime) {
  if (!item) return null;
  const price = Number(item.price);
  const rawTime = item.time ?? fallbackTime;
  const time =
    typeof rawTime === "number"
      ? rawTime
      : Math.floor(new Date(rawTime).getTime() / 1000);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(time))
    return null;

  const volume = Number(item.volume);
  return {
    price,
    time,
    ...(Number.isFinite(volume) ? { volume } : {}),
  };
}

export const fetchQuotes = async () => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_PYTHON_API_URL}/quotes`,
  );
  return Object.entries(data.data ?? {}).reduce((quotes, [symbol, raw]) => {
    const quote = normalizeQuote(raw, data.time);
    if (quote) quotes[symbol.toUpperCase()] = quote;
    return quotes;
  }, {});
};

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
    // queryKey cố định → mọi component dùng chung 1 query, React Query tự
    // dedupe trong browser; poll 5s, tab ẩn thì ngừng cho đỡ tốn.
    refetchInterval: 5 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 4 * 1000,
  });
}
