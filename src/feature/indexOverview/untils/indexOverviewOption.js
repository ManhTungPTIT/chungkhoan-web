// Chuẩn hoá payload /index-overview thành dữ liệu series cho echarts cột nhóm.
// Màu ĐIỀU KIỆN: cột điểm/% xanh khi ≥0, đỏ khi <0 (thanh khoản luôn tím).

export const LIQUIDITY_COLOR = "#6b1f9c"; // tím — độ thanh khoản
export const DIEM_POS_COLOR = "#4caf50"; // xanh nhạt — điểm tăng
export const PCT_POS_COLOR = "#1b7a3a";  // xanh đậm — % tăng
export const NEG_COLOR = "#e23b3b";      // đỏ — giảm

// Mốc "thanh khoản đúng bằng nền gần đây". Cột cao hơn mốc = tiền vào mạnh hơn
// thường lệ; thấp hơn = chợ vắng.
export const BASELINE_PCT = 100;

export function signColor(value, positiveColor) {
  if (value === null || value === undefined) return "transparent";
  return value >= 0 ? positiveColor : NEG_COLOR;
}

const bar = (value, color) =>
  value === null || value === undefined
    ? { value: null }
    : { value, itemStyle: { color } };

// indices: [{ten_san, diem_hien_tai, diem_dong_cua_phien_truoc, gia_tri_khop_lenh,
//            thanh_khoan_pct, diem_tang_giam, pct}]
export function buildBarSeries(indices) {
  const rows = Array.isArray(indices) ? indices : [];
  return {
    categories: rows.map((r) => r.ten_san),
    thanhKhoanData: rows.map((r) => bar(r.thanh_khoan_pct, LIQUIDITY_COLOR)),
    diemData: rows.map((r) => bar(r.diem_tang_giam, signColor(r.diem_tang_giam, DIEM_POS_COLOR))),
    pctData: rows.map((r) => bar(r.pct, signColor(r.pct, PCT_POS_COLOR))),
  };
}

/** Nhãn cột thanh khoản — số phiên nền đến từ payload, không hardcode vì cửa sổ
 * phụ thuộc lượng nến sector_flow_history quét được. */
export function liquidityLabel(soPhienTb) {
  return soPhienTb > 0
    ? `Thanh khoản (% TB ${soPhienTb} phiên)`
    : "Thanh khoản (% TB)";
}

// Bố cục HAI KHUNG VẼ chồng dọc. Toạ độ cố định bằng px chứ không phần trăm:
// grid.containLabel với nhãn trục dài sẽ nuốt gần hết vùng vẽ của khung nhỏ.
// Tổng cần <= chiều cao .index-overview__chart trong indexOverview.scss.
export const GRID_TOP = { top: 44, height: 132 };
export const GRID_BOTTOM = { top: 218, height: 96 };
export const CHART_HEIGHT = 360;

/** Option ECharts đầy đủ. Tách khỏi component để test/SSR-render được — cùng
 * khuôn "untils giữ logic thuần" của các chart khác trong repo.
 *
 * KHÔNG dùng trục Y kép: thang thanh khoản (0–200%) gấp gần chục lần thang điểm
 * (−30..30). Chung một trục thì hai cột dưới bẹp thành gạch chân; hai trục
 * chồng lên nhau thì hai cột cao bằng nhau trông như "bằng nhau" trong khi đơn
 * vị chẳng liên quan gì. Hai khung riêng là cách duy nhất đọc đúng cả hai.
 */
export function buildChartOption(indices, soPhienTb, fmt) {
  const s = buildBarSeries(indices);
  const tkLabel = liquidityLabel(soPhienTb);
  const byName = Object.fromEntries((indices || []).map((r) => [r.ten_san, r]));
  const barLabel = (formatter) => ({ show: true, position: "top", fontSize: 10, formatter });

  return {
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        if (p.seriesName !== tkLabel) {
          const unit = p.seriesName === "% Tăng giảm" ? "%" : " điểm";
          return `<b>${p.name}</b><br/>${p.seriesName}: ${fmt(p.value)}${unit}`;
        }
        // Số tuyệt đối không còn là cột nào nữa — giữ ở đây để vẫn tra được.
        const row = byName[p.name] || {};
        return (
          `<b>${p.name}</b><br/>Thanh khoản: ${fmt(p.value)}% so với nền` +
          `<br/>Giá trị khớp lệnh: ${fmt(row.gia_tri_khop_lenh)} nghìn tỷ`
        );
      },
    },
    legend: { top: 6, data: [tkLabel, "Điểm tăng giảm", "% Tăng giảm"] },
    grid: [
      { left: 52, right: 16, ...GRID_TOP },
      { left: 52, right: 16, ...GRID_BOTTOM },
    ],
    xAxis: [
      // Khung trên ẩn nhãn sàn — khung dưới đã ghi, lặp lại chỉ tốn chỗ.
      { gridIndex: 0, type: "category", data: s.categories, axisTick: { alignWithLabel: true }, axisLabel: { show: false } },
      { gridIndex: 1, type: "category", data: s.categories, axisTick: { alignWithLabel: true } },
    ],
    yAxis: [
      {
        gridIndex: 0,
        type: "value",
        axisLine: { show: false },
        axisLabel: { formatter: "{value}%" },
        splitLine: { lineStyle: { color: "#eee" } },
      },
      { gridIndex: 1, type: "value", axisLine: { show: false }, splitLine: { lineStyle: { color: "#eee" } } },
    ],
    series: [
      {
        name: tkLabel,
        type: "bar",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: s.thanhKhoanData,
        label: barLabel((p) => (p.value == null ? "" : `${fmt(p.value, 0)}%`)),
        itemStyle: { color: LIQUIDITY_COLOR },
        markLine: {
          silent: true,
          symbol: "none",
          data: [{ yAxis: BASELINE_PCT }],
          lineStyle: { color: "#9aa3b5", type: "dashed" },
          label: { formatter: "nền", fontSize: 10, color: "#6b7386" },
        },
      },
      {
        name: "Điểm tăng giảm",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: s.diemData,
        label: barLabel((p) => fmt(p.value)),
      },
      {
        name: "% Tăng giảm",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: s.pctData,
        label: barLabel((p) => (p.value == null ? "" : `${fmt(p.value)}%`)),
      },
    ],
  };
}
