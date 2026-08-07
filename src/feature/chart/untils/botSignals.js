import { generateSignals, generateSignalsT, generateSignalsLong } from "./indicators";

// Ba BOT trên sidebar, chọn qua query `/?bot=...`. Bảng này là nguồn DUY NHẤT
// ánh xạ bot → thuật toán; đừng chép thêm bảng thứ hai ở chỗ khác.
export const SIGNAL_GENERATORS = {
  trend: generateSignals, // BOT Trend (mặc định)
  t: generateSignalsT, // BOT T+
  long: generateSignalsLong, // BOT Dài hạn
};

/** Hàm sinh tín hiệu cho bot đang chọn. Thiếu bot hoặc bot lạ → BOT Trend. */
export function signalGeneratorForBot(bot) {
  return SIGNAL_GENERATORS[bot] ?? generateSignals;
}

/**
 * Có được phép lấy tín hiệu từ panel `/vn100` cho bot này không?
 *
 * `/vn100` chỉ tính MỘT thuật toán — `signal_service.compute_signals` là
 * SMA20 + MACD cross, đúng bằng `generateSignals` của BOT Trend — và payload
 * không có trường nào phân biệt bot. Tin nó khi đang xem BOT T+/Dài hạn thì đổi
 * bot xong panel vẫn đứng yên ở số của BOT Trend (đúng lỗi đã sửa 2026-08-03;
 * VNINDEX trông vẫn đúng chỉ vì nó không nằm trong bảng /vn100).
 *
 * Suy thẳng từ `signalGeneratorForBot` để hai nơi không thể lệch nhau khi thêm
 * bot mới.
 */
export function usesBackendPanelSignal(bot) {
  return signalGeneratorForBot(bot) === generateSignals;
}

/**
 * Đắp lớp phủ tín hiệu của BOT đang chọn lên rows của /vn100.
 *
 * `/vn100` chỉ mang tín hiệu của BOT Trend (backend chỉ tính một thuật toán) nên
 * bot khác phải lấy từ /signals?bot= rồi ghép vào đây theo mã.
 *
 * Đổi tên khoá về đúng shape `signal_*` mà mọi thứ đọc board đang nhận (Panel,
 * sessionPhase, countPhases, pnlPct, sortRowsBySignal) — nhờ vậy không chỗ nào
 * trong số đó phải biết tới khái niệm bot.
 *
 * Mã vắng trong lớp phủ (thiếu nến nền, hoặc T+ không suy được `open`) → mọi
 * field tín hiệu về rỗng. KHÔNG được để lại số của Trend: màn hình sẽ hiện tín
 * hiệu của bot này bằng dữ liệu của bot kia mà không ai biết.
 */
export function mergeBotSignals(rows, overlay, bot) {
  if (bot === "trend") return rows;
  const data = overlay || {};
  return (rows || []).map((row) => {
    const o = data[row?.symbol];
    return {
      ...row,
      signal: o?.signal ?? null,
      signal_date: o?.date ?? null,
      signal_price: o?.price ?? null,
      signal_sessions: o?.sessions ?? null,
      signal_hold: o?.hold ?? false,
      signal_stale: o?.stale ?? false,
    };
  });
}
