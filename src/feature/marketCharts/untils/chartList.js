// Danh sách biểu đồ của trang /chart/market — nguồn DUY NHẤT cho nút nổi
// "Danh sách các biểu đồ". Thứ tự khớp thứ tự các <section> trong index.jsx để
// menu nhảy đọc theo mạch cuộn của trang.
//
// `id` phải trùng thuộc tính id của <section> tương ứng: cả nút nhảy lẫn
// useEffect xử lý location.hash đều tra bằng document.getElementById.
export const MARKET_CHART_PATH = "/chart/market";

export const MARKET_CHARTS = [
  { id: "power-map", label: "BẢN ĐỒ SỨC MẠNH DÒNG TIỀN" },
  { id: "tplus-wave", label: "BẢN ĐỒ SỨC MẠNH TĂNG GIÁ CỔ PHIẾU" },
  { id: "potential-flow", label: "BỘ LỌC MÃ TIỀM NĂNG LƯỚT T+" },
  { id: "top-gain-t2", label: "BỘ LỌC MÃ TĂNG MẠNH NHẤT (NGẮN HẠN: T+2)" },
  { id: "top-gain-t3", label: "BỘ LỌC MÃ TĂNG MẠNH NHẤT (NGẮN HẠN: T+3)" },
  { id: "top-gain-week", label: "BỘ LỌC MÃ TĂNG MẠNH NHẤT TUẦN" },
  { id: "flow-surge", label: "CÁC MÃ ĐỘT BIẾN DÒNG TIỀN MẠNH NHẤT HÔM NAY" },
  { id: "index-overview", label: "TOÀN CẢNH CHỈ SỐ" },
  { id: "market-status", label: "BỨC TRANH THỊ TRƯỜNG" },
  { id: "foreign-buy", label: "TOP MUA RÒNG KHỐI NGOẠI" },
  { id: "foreign-sell", label: "TOP BÁN RÒNG KHỐI NGOẠI" },
  { id: "money-flow", label: "PHÂN BỔ DÒNG VỐN THEO NGÀNH" },
  { id: "put-through", label: "CÁC MÃ GIAO DỊCH THỎA THUẬN (TỶ)" },
  { id: "bull-bear", label: "DÒNG TIỀN PHE BÒ VÀ PHE GẤU" },
  { id: "price-band", label: "DÒNG TIỀN THEO NHÓM GIÁ CỔ PHIẾU" },
  { id: "sector-flow-value", label: "GIÁ TRỊ TIỀN KHỚP LỆNH 5 PHIÊN GẦN NHẤT (ĐV: TỶ)" },
  { id: "sector-flow-share", label: "TỶ TRỌNG GIÁ TRỊ TIỀN KHỚP LỆNH 5 PHIÊN GẦN NHẤT" },
  { id: "sector-breadth", label: "BẢN ĐỒ DÒNG TIỀN TÍCH CỰC- TIÊU CỰC THEO NGÀNH" },
  { id: "sector-change", label: "DIỄN GIẢI CHI TIẾT DÒNG TIỀN TÍCH CỰC - TIÊU CỰC NGÀNH" },
  { id: "vn30-basket", label: "MÃ RỔ VN30" },
  { id: "flow-surge-month", label: "DÒNG TIỀN TĂNG ĐỘT BIẾN SO VỚI BÌNH QUÂN 1 THÁNG" },
  { id: "top-value", label: "TOP 20 MÃ DẪN ĐẦU VỀ GIÁ TRỊ GIAO DỊCH" },
  { id: "top-volume-view", label: "TOP 20 MÃ DẪN ĐẦU VỀ KHỐI LƯỢNG GIAO DỊCH" },
  { id: "sector-flow-surge", label: "NGÀNH CÓ DÒNG TIỀN TĂNG ĐỘT BIẾN" },
  { id: "top-advance", label: "TOP 20 MÃ TĂNG MẠNH NHẤT (THEO % TĂNG)" },
  { id: "top-decline", label: "TOP 20 MÃ GIẢM MẠNH NHẤT (THEO % GIẢM)" },
  { id: "foreign-trading-history", label: "GIAO DỊCH KHỐI NGOẠI 30 PHIÊN GẦN NHẤT" },
  { id: "sector-flow-consistency", label: "DÒNG TIỀN THEO NGÀNH" },
  { id: "base-breakout", label: "TOP MÃ VƯỢT NỀN TÍCH LŨY 30 PHIÊN" },
  { id: "heatmap", label: "BẢN ĐỒ NHIỆT THỊ TRƯỜNG" },
  // "market-overview" đã bị gỡ: section tương ứng trong index.jsx đang comment
  // nên mục này chỉ nhảy tới hư không (và nay còn là ô tích không điều khiển gì).
];

/** Cuộn tới một biểu đồ theo id. Trả true nếu tìm thấy section (để caller biết
 * có cần đợi trang render xong rồi thử lại không). */
export function scrollToChart(id) {
  const target = typeof document !== "undefined" && document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  return true;
}
