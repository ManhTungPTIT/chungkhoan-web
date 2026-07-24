// Dựng dữ liệu cho chart "MÃ RỔ VN30" — 4 panel dùng chung trục Y (danh sách mã).
// Backend (/vn30-basket) đã quy đổi đơn vị và sắp theo % giảm dần; util này chỉ
// ánh xạ khoá, chọn màu, và tính max từng trục X (mỗi panel một thang riêng).

// Màu tăng/giảm LẤY ĐÚNG bộ của sectorChange / marketStatus để cùng khái niệm
// không hiện hai màu khác nhau giữa các chart.
export const UP_COLOR = "#1d9a45";
export const DOWN_COLOR = "#e53935";
export const FLAT_COLOR = "#d3a719";
export const VALUE_COLOR = "#6b2fa8"; // cột tím "giá trị khớp lệnh"
export const PRICE_COLOR = "#e8b100"; // đường vàng "giá hiện tại"

export function buildVn30Basket(payload) {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  return rows.map((r) => ({
    symbol: r.symbol || "",
    changePct: Number(r.change_pct) || 0,
    valueTy: Number(r.value_ty) || 0,
    priceNghin: Number(r.price_nghin) || 0,
    status: r.status || "flat",
  }));
}

export function statusColor(status) {
  if (status === "up") return UP_COLOR;
  if (status === "down") return DOWN_COLOR;
  return FLAT_COLOR;
}

// Trục tiền làm tròn lên bội 100 cho nhãn chẵn; tối thiểu 100 để rows rỗng không
// ra trục 0 (chia cho 0 khi scale).
export function valueAxisMax(rows) {
  const max = Math.max(0, ...rows.map((r) => r.valueTy));
  return Math.max(100, Math.ceil(max / 100) * 100);
}

// Trục giá làm tròn lên bội 50.
export function priceAxisMax(rows) {
  const max = Math.max(0, ...rows.map((r) => r.priceNghin));
  return Math.max(50, Math.ceil(max / 50) * 50);
}

// Trục % ĐỐI XỨNG quanh 0, làm tròn lên bội 5 — mốc 0% đứng yên một chỗ, không
// nhảy theo dữ liệu từng phiên. Lấy từ trị tuyệt đối lớn nhất của cả hai chiều.
export function pctAxisMax(rows) {
  const max = Math.max(0, ...rows.map((r) => Math.abs(r.changePct)));
  return Math.max(5, Math.ceil(max / 5) * 5);
}

// Dùng dấu chấm thập phân như bản mẫu (32.49), không phải dấu phẩy vi-VN. Giá
// trị VN30 tối đa ~900 (3 chữ số) nên không cần dấu phân tách nghìn.
export function fmtTy(ty) {
  return String(ty);
}

export function fmtPrice(nghin) {
  return String(nghin);
}

export function fmtPct(pct) {
  return `${pct > 0 ? "+" : ""}${pct}%`;
}
