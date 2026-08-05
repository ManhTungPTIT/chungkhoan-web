import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../untils/axiosClient";

// Nhịp 12s cho trễ tối đa ~12 giây khi phiên bị đá ở máy khác. Đổi số này thì
// đổi luôn phần nghiệm thu trong specs 2026-08-05-session-instant-kick-design.md.
const HEARTBEAT_MS = 12_000;

/**
 * Hỏi BE "phiên này còn sống không" theo nhịp.
 *
 * Cần thiết vì server KHÔNG đẩy được tin cho máy bị đá (chart_back là Express
 * thuần, không WS/SSE), mà màn hình chính lấy dữ liệu từ BE Python nên tự nó
 * chẳng bao giờ gọi tới chart_back — không có nhịp này thì phiên chết có thể sống
 * hiển thị vô hạn.
 *
 * KHÔNG xử lý lỗi ở đây: 401 rơi vào interceptor của axiosClient, nó thử refresh,
 * refresh trả SESSION_SUPERSEDED rồi tự dọn token và chuyển về /login kèm lý do.
 * Tự gọi clearTokens() ở đây là đua với interceptor.
 */
export function useSessionGuard(enabled) {
  return useQuery({
    queryKey: ["session-alive"],
    queryFn: async () => (await axiosClient.get("/auth/session")).data,
    enabled,
    refetchInterval: HEARTBEAT_MS,
    // Tab ẩn thì thôi — quay lại tab là react-query refetch ngay vì đã stale.
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 0,
  });
}
