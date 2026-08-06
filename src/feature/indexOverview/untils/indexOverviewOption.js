// Chuẩn hoá payload /index-overview thành dữ liệu series cho echarts cột nhóm.
// Màu ĐIỀU KIỆN: cột điểm/% xanh khi ≥0, đỏ khi <0 (thanh khoản luôn tím).

export const LIQUIDITY_COLOR = "#6b1f9c"; // tím — tổng giá trị giao dịch
export const DIEM_POS_COLOR = "#4caf50"; // xanh nhạt — điểm tăng
export const PCT_POS_COLOR = "#1b7a3a";  // xanh đậm — % tăng
export const NEG_COLOR = "#e23b3b";      // đỏ — giảm

// Mốc "thanh khoản đúng bằng nền gần đây". CHỈ còn dùng để tô màu cột % trong
// BẢNG — chart vẽ giá trị khớp lệnh tuyệt đối nên không có mốc nền nào nữa.
export const BASELINE_PCT = 100;

export const LIQUIDITY_LABEL = "Thanh khoản (nghìn tỷ)";
export const DIEM_LABEL = "Điểm tăng giảm";
export const PCT_LABEL = "% Tăng giảm";

// Đơn vị hậu tố theo tên series — tooltip gộp 3 series khác đơn vị trong cùng
// một khung nên phải ghi rõ từng dòng, không suy ra được từ vị trí cột.
const UNIT = {
  [LIQUIDITY_LABEL]: " nghìn tỷ",
  [DIEM_LABEL]: " điểm",
  [PCT_LABEL]: "%",
};

export function signColor(value, positiveColor) {
  if (value === null || value === undefined) return "transparent";
  return value >= 0 ? positiveColor : NEG_COLOR;
}

const bar = (value, color) =>
  value === null || value === undefined
    ? { value: null }
    : {
        value,
        itemStyle: { color },
        // label.position dạng HÀM bị ECharts bỏ qua → phải đặt ngay trên data
        // item: cột âm mà giữ "top" thì nhãn nằm đè vạch 0 của cột dương.
        ...(value < 0 ? { label: { position: "bottom" } } : {}),
      };

// indices: [{ten_san, diem_hien_tai, diem_dong_cua_phien_truoc, gia_tri_giao_dich,
//            gia_tri_khop_lenh, gia_tri_thoa_thuan, thanh_khoan_pct,
//            diem_tang_giam, pct}]
//
// Cột thanh khoản vẽ `gia_tri_giao_dich` = khớp lệnh + THỎA THUẬN (NGHÌN TỶ, số
// tuyệt đối) chứ không phải `thanh_khoan_pct` — bảng bên dưới vẫn giữ cột % TB N
// phiên. Board của vendor chỉ có khớp lệnh nên cột cũ hụt ~10-14% so với tổng
// giao dịch thật của sàn (xem index_overview_service.put_through_values).
//
// Lùi về `gia_tri_khop_lenh` khi BE chưa có trường mới: lệch deploy FE/BE thì
// cột hụt một chút vẫn hơn là mất hẳn cột.
export const liquidityValue = (row) =>
  row?.gia_tri_giao_dich ?? row?.gia_tri_khop_lenh;

export function buildBarSeries(indices) {
  const rows = Array.isArray(indices) ? indices : [];
  return {
    categories: rows.map((r) => r.ten_san),
    thanhKhoanData: rows.map((r) => bar(liquidityValue(r), LIQUIDITY_COLOR)),
    diemData: rows.map((r) => bar(r.diem_tang_giam, signColor(r.diem_tang_giam, DIEM_POS_COLOR))),
    pctData: rows.map((r) => bar(r.pct, signColor(r.pct, PCT_POS_COLOR))),
  };
}

// Chỗ trống trên đầu cột để nhãn giá trị không đè viền khung vẽ.
const HEADROOM = 1.2;
// Vạch 0 không được đẩy quá cao, nếu không phần dương của khung bẹp hết.
const MAX_ZERO_FRAC = 0.85;

const numbers = (values) =>
  (values || []).filter((v) => typeof v === "number" && Number.isFinite(v));

/** Biên (đã cộng chỗ cho nhãn) mà một trục PHẢI phủ được. */
function need(values) {
  const nums = numbers(values);
  return { hi: Math.max(0, ...nums) * HEADROOM, lo: Math.min(0, ...nums) * HEADROOM };
}

/** Bo số lên mốc tròn gần nhất để nhãn trục đọc được (16,4 → 20). */
function niceCeil(value) {
  if (!(value > 0)) return 0;
  const base = 10 ** Math.floor(Math.log10(value));
  const f = value / base;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => f <= c + 1e-9);
  return (step ?? 10) * base;
}

/** min/max cho HAI trục Y dùng chung MỘT khung vẽ, sao cho vạch 0 của cả hai
 * nằm trên cùng một đường.
 *
 * ECharts không tự làm việc này — mỗi trục co theo dữ liệu của riêng nó. Phiên
 * đỏ (nghìn tỷ dương, điểm/% âm) để trục tự tính thì trục phải chỉ trải [âm, 0]
 * nên cột % treo lơ lửng ở nóc khung, còn cột điểm mọc từ giữa khung: hai cột
 * cùng dấu mà trông như ngược dấu.
 *
 * NEO theo trục TRÁI: nó chở dữ liệu trộn dấu (nghìn tỷ luôn dương + điểm có
 * thể âm) nên vị trí vạch 0 của nó là cái đắt nhất để nhượng; trục phải chỉ có
 * % — cùng dấu với điểm — nên bám theo rất ít tốn chỗ. Lấy vạch 0 sâu nhất
 * trong hai trục thì ngược lại: trục trái phải nống lên gấp 2-3 lần cho vừa.
 *
 * Trả `{}` cho trục không có số liệu nào → ECharts tự co như mặc định.
 */
export function alignedAxisRange(leftValues, rightValues) {
  const left = need(leftValues);
  const right = need(rightValues);
  const spanOf = (s) => s.hi - s.lo;
  const zeroFrac = (s) => (spanOf(s) > 0 ? -s.lo / spanOf(s) : 0);
  // Trục trái rỗng (chưa có điểm lẫn giá trị khớp lệnh) → neo tạm theo trục phải.
  const z = Math.min(MAX_ZERO_FRAC, zeroFrac(spanOf(left) > 0 ? left : right));
  const fit = (s) => {
    // Không có số âm (phiên xanh — và LUÔN đúng với cột nghìn tỷ): vạch 0 nằm
    // đáy khung nên hai trục tự khớp, tranh thủ bo max lên mốc tròn.
    if (z === 0) {
      const max = niceCeil(s.hi);
      return max > 0 ? { min: 0, max } : {};
    }
    const span = Math.max(s.hi / (1 - z), -s.lo / z);
    if (!(span > 0)) return {};
    // KHÔNG làm tròn: sai số 0,01 trên trục % (thang ~2) đủ để lệch vạch 0 thấy
    // được. Nhãn trục đã được fmt bo về 2 chữ số khi hiển thị.
    return { min: -span * z, max: span * (1 - z) };
  };
  return { left: fit(left), right: fit(right) };
}

// MỘT khung vẽ, toạ độ cố định bằng px chứ không phần trăm: grid.containLabel
// với nhãn trục dài sẽ nuốt vùng vẽ. `right` rộng hơn `left` vì còn trục % thứ
// hai. Tổng cần <= chiều cao .index-overview__chart trong indexOverview.scss.
export const GRID = { top: 46, left: 52, right: 50, bottom: 26 };
export const CHART_HEIGHT = 300;

/** Option ECharts đầy đủ. Tách khỏi component để test/SSR-render được — cùng
 * khuôn "untils giữ logic thuần" của các chart khác trong repo.
 *
 * BA cột trong MỘT khung, HAI trục Y: trái cho nghìn tỷ + điểm (hai thang cùng
 * độ lớn, 0–30), phải cho % (0–2). Mỗi cột có nhãn giá trị kèm đơn vị nên nhãn
 * trục chỉ là giàn giáo — không cần tròn tuyệt đối, đổi lại vạch 0 khớp nhau
 * (xem alignedAxisRange).
 */
export function buildChartOption(indices, fmt, width = 0) {
  const rows = Array.isArray(indices) ? indices : [];
  const s = buildBarSeries(rows);
  const range = alignedAxisRange(
    [...rows.map((r) => r.gia_tri_khop_lenh), ...rows.map((r) => r.diem_tang_giam)],
    rows.map((r) => r.pct),
  );
  // `width` là bề ngang container (px), TÙY CHỌN — không truyền thì hành vi y như
  // cũ. Dưới 520px: legend gãy 2 dòng đè vào vùng vẽ (grid.top 46 không đủ) và
  // nhãn cột của 12 cột × fontSize 10 dính nhau — nâng top, co chữ, ẩn nhãn đè.
  const compact = width > 0 && width < 520;
  const barLabel = (formatter) => ({
    show: true,
    position: "top",
    fontSize: compact ? 8 : 10,
    formatter,
  });
  // Nhãn đè nhau thì ẩn bớt thay vì chồng chữ ("-14,0,74%") — bảng dưới chart
  // lặp lại đủ mọi con số nên không mất thông tin.
  const labelLayout = compact ? { hideOverlap: true } : undefined;

  return {
    tooltip: {
      // trigger "axis": gộp khung rồi thì hover một sàn phải đọc được cả 3 chỉ
      // số cùng lúc, không phải trỏ đúng từng cột.
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        if (!list.length) return "";
        const lines = list.map(
          (p) => `${p.marker} ${p.seriesName}: ${fmt(p.value)}${UNIT[p.seriesName] ?? ""}`,
        );
        return [`<b>${list[0].name}</b>`, ...lines].join("<br/>");
      },
    },
    legend: {
      top: 6,
      data: [LIQUIDITY_LABEL, DIEM_LABEL, PCT_LABEL],
      ...(compact
        ? { itemWidth: 14, itemHeight: 8, itemGap: 8, textStyle: { fontSize: 10 } }
        : {}),
    },
    grid: compact ? { ...GRID, top: 70 } : GRID,
    xAxis: {
      type: "category",
      data: s.categories,
      axisTick: { alignWithLabel: true },
    },
    yAxis: [
      {
        type: "value",
        ...range.left,
        axisLine: { show: false },
        axisLabel: { formatter: (v) => fmt(v) },
        splitLine: { lineStyle: { color: "#eee" } },
      },
      {
        type: "value",
        position: "right",
        ...range.right,
        axisLine: { show: false },
        axisLabel: { formatter: (v) => `${fmt(v)}%` },
        // Tắt splitLine trục phải: hai lưới lệch nhau chồng lên nhau rối mắt.
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: LIQUIDITY_LABEL,
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 40,
        data: s.thanhKhoanData,
        label: barLabel((p) => (p.value == null ? "" : fmt(p.value))),
        labelLayout,
        itemStyle: { color: LIQUIDITY_COLOR },
      },
      {
        name: DIEM_LABEL,
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 40,
        data: s.diemData,
        label: barLabel((p) => fmt(p.value)),
        labelLayout,
        // Màu thật nằm trên từng data item (tô theo dấu); thiếu itemStyle mức
        // SERIES thì chip legend lấy màu mặc định của ECharts — xanh dương /
        // vàng-lục, chẳng khớp cột nào trong chart.
        itemStyle: { color: DIEM_POS_COLOR },
      },
      {
        name: PCT_LABEL,
        type: "bar",
        yAxisIndex: 1,
        barMaxWidth: 40,
        data: s.pctData,
        label: barLabel((p) => (p.value == null ? "" : `${fmt(p.value)}%`)),
        labelLayout,
        itemStyle: { color: PCT_POS_COLOR },
      },
    ],
  };
}
