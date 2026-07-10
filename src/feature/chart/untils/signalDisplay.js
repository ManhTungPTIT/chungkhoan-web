// Ánh xạ tín hiệu mua/bán từ backend → nhãn + class hiển thị cho panel VN100.
// Chỉ tin tín hiệu THẬT ("buy"/"sell"). Mọi giá trị khác (null khi backend
// chưa có tín hiệu cho mã đó) → trạng thái trung tính "—": KHÔNG đoán theo giá.
export function signalDisplay(signal) {
  if (signal === "buy") return { label: "BUY", className: "hold" };
  if (signal === "sell") return { label: "SELL", className: "sell" };
  return { label: "—", className: "neutral" };
}

// Mã đang ở pha "nắm giữ": đã báo MUA nhưng đã qua ngày báo. Backend set cờ
// `signal_hold` (xem signal_service.attach_signals) — KHÔNG suy từ signal_sessions
// vì phiên hôm nay trước giờ mở có sessions=0 giống hệt ngày báo.
export function isHolding(item) {
  return item?.signal === "buy" && Boolean(item?.signal_hold);
}

// Chuỗi cột T+: chỉ hiện số khi đã có ≥1 phiên MỞ sau ngày báo; chưa có (0/null/
// chưa qua giờ mở) → "-". Khớp yêu cầu: trước phiên chưa cộng, sau phiên mới cộng.
export function formatTPlus(sessions) {
  const n = Number(sessions);
  return Number.isFinite(n) && n >= 1 ? `T+${n}` : "-";
}
