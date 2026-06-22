// Ánh xạ tín hiệu mua/bán từ backend → nhãn + class hiển thị cho panel VN100.
// Chỉ tin tín hiệu THẬT ("buy"/"sell"). Mọi giá trị khác (null khi backend
// chưa có tín hiệu cho mã đó) → trạng thái trung tính "—": KHÔNG đoán theo giá.
export function signalDisplay(signal) {
  if (signal === "buy") return { label: "Mua", className: "hold" };
  if (signal === "sell") return { label: "Bán", className: "sell" };
  return { label: "—", className: "neutral" };
}
