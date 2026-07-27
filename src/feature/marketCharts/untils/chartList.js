// Danh sách biểu đồ của trang /chart/market — nguồn DUY NHẤT cho nút nổi
// "Danh sách các biểu đồ". Thứ tự khớp thứ tự các <section> trong index.jsx để
// menu nhảy đọc theo mạch cuộn của trang.
//
// `id` phải trùng thuộc tính id của <section> tương ứng: cả nút nhảy lẫn
// useEffect xử lý location.hash đều tra bằng document.getElementById.
export const MARKET_CHART_PATH = "/chart/market";

export const MARKET_CHARTS = [
  { id: "potential-flow", label: "Mã cổ phiếu tiềm năng" },
  { id: "tplus-wave", label: "Bản đồ sức mạnh tăng giá cổ phiếu" },
  { id: "top-gain-t2", label: "Nhóm tăng mạnh nhất T+2" },
  { id: "top-gain-t3", label: "Nhóm tăng mạnh nhất T+3" },
  { id: "top-gain-week", label: "Top tăng mạnh nhất tuần" },
  { id: "flow-surge", label: "Dòng tiền tăng đột biến hôm nay" },
  { id: "index-overview", label: "Chỉ số chung 3 sàn" },
  { id: "market-status", label: "Diễn biến thị trường" },
  { id: "foreign-buy", label: "Giá trị nước ngoài mua ròng cao nhất" },
  { id: "foreign-sell", label: "Giá trị nước ngoài bán ròng cao nhất" },
  { id: "money-flow", label: "Tỷ trọng dòng tiền theo ngành" },
  { id: "put-through", label: "Dòng tiền giao dịch thỏa thuận" },
  { id: "bull-bear", label: "Dòng tiền phe bò và phe gấu" },
  { id: "price-band", label: "Dòng tiền theo nhóm giá cổ phiếu" },
  { id: "sector-flow-value", label: "Giá trị khớp lệnh 5 phiên theo ngành" },
  { id: "sector-flow-share", label: "Tỷ trọng khớp lệnh 5 phiên theo ngành" },
  { id: "sector-breadth", label: "Xu hướng tích cực tiêu cực ngành" },
  { id: "sector-change", label: "Tổng hợp tăng giảm theo ngành" },
  { id: "vn30-basket", label: "Mã rổ VN30" },
  { id: "flow-surge-month", label: "Dòng tiền tăng đột biến so với bình quân 1 tháng" },
  { id: "top-value", label: "Giá trị tiền khớp lệnh cao nhất (Tỷ)" },
  { id: "top-volume-view", label: "Khối lượng khớp lệnh cao nhất" },
  { id: "sector-flow-surge", label: "Ngành có dòng tiền tăng đột biến" },
  { id: "top-decline", label: "Top giảm cao nhất" },
  { id: "heatmap", label: "Bản đồ nhiệt thị trường" },
  { id: "power-map", label: "Bản đồ sức mạnh dòng tiền" },
  { id: "market-overview", label: "Bản đồ toàn cảnh thị trường" },
];

/** Cuộn tới một biểu đồ theo id. Trả true nếu tìm thấy section (để caller biết
 * có cần đợi trang render xong rồi thử lại không). */
export function scrollToChart(id) {
  const target = typeof document !== "undefined" && document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  return true;
}
