// Phần tính toán của trang bộ lọc (`layouts/FilterStockPage.jsx`, chung cho bản
// web lẫn bản app). Tách khỏi component để test được mà không phải dựng cả cây
// thẻ — và vì hồi hai bản còn là hai file, chép đôi đã làm chúng trôi khỏi nhau
// mà không ai thấy: cùng một cột nhưng ra hai con số khác nhau.
import { isHolding } from "../../chart/untils/signalDisplay";

/** 2026-08-03 → "03/08/2026". Giá trị không parse được thì trả nguyên xi. */
export function convertDay(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/** "21:27" — giờ tải dữ liệu, KHÔNG phải giờ phát tín hiệu (thứ đó không tồn tại). */
export function convertTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getSignalRank(row) {
  if (isHolding(row)) return 1;
  if (row?.signal === "buy") return 0;
  if (row?.signal === "hold") return 1;
  if (row?.signal === "sell") return 2;
  return 3;
}

// T+ dùng để xếp thứ tự trong cùng nhóm tín hiệu; thiếu dữ liệu → đẩy xuống cuối nhóm
function getSessionOrder(row) {
  const value = row?.signal_sessions;
  if (value == null) return Number.MAX_SAFE_INTEGER;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

export function sortRowsBySignal(rows) {
  return [...rows].sort(
    (a, b) =>
      getSignalRank(a) - getSignalRank(b) ||
      getSessionOrder(a) - getSessionOrder(b),
  );
}

/** Danh sách số trang hiển thị (tối đa `max` số, xoay quanh trang hiện tại). */
export function getPageNumbers(current, total, max = 5) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(max / 2));
  let end = start + max - 1;
  if (end > total) {
    end = total;
    start = end - max + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Ngày hôm nay dạng "YYYY-MM-DD" để so với `signal_date` của backend. */
export function todayIso(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export const PHASE = {
  BUY: "buy",
  HOLD: "hold",
  SELL: "sell",
  OUT: "out",
};

export const PHASE_LABEL = {
  [PHASE.BUY]: "Tín hiệu BUY",
  [PHASE.HOLD]: "Đang nắm giữ",
  [PHASE.SELL]: "Tín hiệu SELL",
  [PHASE.OUT]: "Đứng ngoài",
};

/**
 * Nhãn NGẮN cho badge trong bảng — tiếng Việt, không còn BUY/SELL.
 *
 * Badge mang PHA chứ không mang loại lệnh: mã đã qua ngày báo hiện "Nắm giữ" /
 * "Đứng ngoài" thay vì vẫn nói MUA/BÁN. Không mất thông tin — "Nắm giữ" chỉ đến
 * từ lệnh mua, "Đứng ngoài" chỉ đến từ lệnh bán.
 */
export const PHASE_BADGE = {
  [PHASE.BUY]: "MUA",
  [PHASE.HOLD]: "Nắm giữ",
  [PHASE.SELL]: "BÁN",
  [PHASE.OUT]: "Đứng ngoài",
};

/**
 * Pha của một mã — bốn pha LOẠI TRỪ NHAU, mã chưa có tín hiệu trả null.
 *
 * ⚠️ Vế SELL phải so NGÀY chứ không được suy từ `signal_sessions`: backend cố ý
 * tạo cờ `signal_hold` riêng vì `signal_sessions === 0` đúng cho CẢ ngày báo lẫn
 * sáng hôm sau trước giờ mở (xem signal_service.attach_signals). SELL không có cờ
 * tương đương nên ta lặp lại đúng luật backend dùng cho `signal_hold`:
 * `entry["date"] != today`.
 */
export function sessionPhase(row, today = todayIso()) {
  if (row?.signal === "buy") return row?.signal_hold ? PHASE.HOLD : PHASE.BUY;
  if (row?.signal === "sell") {
    return String(row?.signal_date ?? "").slice(0, 10) === today
      ? PHASE.SELL
      : PHASE.OUT;
  }
  return null;
}

/** Đếm số mã theo từng pha — nguồn cho bốn thẻ thống kê trên đầu trang. */
export function countPhases(rows, today = todayIso()) {
  const counts = { [PHASE.BUY]: 0, [PHASE.HOLD]: 0, [PHASE.SELL]: 0, [PHASE.OUT]: 0 };
  for (const row of rows ?? []) {
    const phase = sessionPhase(row, today);
    if (phase) counts[phase] += 1;
  }
  return counts;
}

/**
 * Lãi/lỗ so với GIÁ BÁO, tính bằng phần trăm. Null khi thiếu dữ liệu.
 *
 * ⚠️ Hai giá KHÁC ĐƠN VỊ: `price` từ price_board là VND thô (4500) còn
 * `signal_price` lấy từ nến lịch sử là nghìn đồng (4.30) — xem PRICE_BOARD_SCALE
 * bên backend. Không quy đổi trước khi trừ là ra con số vô nghĩa.
 *
 * KHÔNG dùng `change_pct`: đó là % so với tham chiếu hôm qua, không phải lãi/lỗ
 * của lệnh.
 */
export const PRICE_BOARD_SCALE = 1000;

export function pnlPct(row) {
  const base = Number(row?.signal_price);
  const nowPrice = Number(row?.price) / PRICE_BOARD_SCALE;
  if (!Number.isFinite(base) || !Number.isFinite(nowPrice) || base === 0) return null;
  return ((nowPrice - base) / base) * 100;
}

// Lớp phủ tín hiệu theo bot nay dùng chung cho CẢ trang bộ lọc lẫn Panel bên màn
// biểu đồ, nên nó nằm ở `feature/chart/untils/botSignals.js` — cùng chỗ với bảng
// ánh xạ bot → thuật toán. Re-export ở đây để trang bộ lọc vẫn lấy mọi thứ nó cần
// từ một chỗ.
export { mergeBotSignals } from "../../chart/untils/botSignals";
