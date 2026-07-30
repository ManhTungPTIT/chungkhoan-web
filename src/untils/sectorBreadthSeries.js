// Dựng dữ liệu cho hai chart theo ngành. Dùng chung để chúng luôn cùng một thứ
// tự ngành và cùng một bảng màu trạng thái giá.

// Màu 5 trạng thái LẤY ĐÚNG bộ của marketStatus / bull-bear: kịch trần tím, tăng
// xanh lá, đứng vàng, giảm đỏ, kịch sàn xanh lam. Đổi ở đây thì phải đổi cả ba
// chỗ, nếu không cùng một khái niệm lại hiện hai màu khác nhau.
export const STATE_META = [
  { key: "limit_up", label: "Mã trần", color: "#8e24aa" },
  { key: "up", label: "Mã tăng", color: "#1d9a45" },
  { key: "flat", label: "Mã đứng giá", color: "#F6BD51" },
  { key: "down", label: "Mã giảm giá", color: "#e53935" },
  { key: "limit_down", label: "Mã sàn", color: "#1565c0" },
];

export const UP_COLOR = "#1d9a45";
export const DOWN_COLOR = "#e53935";
export const VALUE_COLOR = "#6b2fa8";

// Khúc hẹp hơn ngưỡng này thì bỏ nhãn %, chữ sẽ đè lên nhau.
export const MIN_LABEL_PCT = 6;

// Tên ngành ICB dài tới 40+ ký tự. Cắt ở TẦNG DỮ LIỆU chứ không nhờ
// `overflow: truncate` của ECharts: trong rich text nó không ăn, tên dài tràn ra
// đè lên cột số bên cạnh.
const MAX_NAME_CHARS = 22;

export function shortenName(name) {
  return name.length > MAX_NAME_CHARS
    ? `${name.slice(0, MAX_NAME_CHARS - 1).trimEnd()}…`
    : name;
}

const VND_TO_TY = 1e9;
const VND_TO_NGHIN = 1000;

/**
 * payload của /sector-breadth → dữ liệu vẽ.
 *
 * Nhãn ngành kèm SỐ MÃ ("Ngân hàng (25)") vì tỷ lệ % của ngành ít mã rất dễ gây
 * hiểu nhầm — ngành 5 mã thì một mã đã là 20%. Người đọc phải thấy mẫu số.
 */
export function buildSectorBreadth(payload) {
  const industries = Array.isArray(payload?.industries) ? payload.industries : [];
  return industries
    .filter((g) => g && Number(g.count) > 0)
    .map((g) => ({
      name: g.name || "",
      icb_code: String(g.icb_code ?? ""),
      count: Number(g.count) || 0,
      label: `${g.name || ""} (${Number(g.count) || 0})`,
      shortLabel: `${shortenName(g.name || "")} (${Number(g.count) || 0})`,
      pcts: Object.fromEntries(
        STATE_META.map((s) => [s.key, Number(g.pcts?.[s.key]) || 0]),
      ),
      counts: Object.fromEntries(
        STATE_META.map((s) => [s.key, Number(g.counts?.[s.key]) || 0]),
      ),
      valueTy: Math.round((Number(g.value) || 0) / VND_TO_TY),
      avgPriceNghin:
        Math.round(((Number(g.avg_price) || 0) / VND_TO_NGHIN) * 10) / 10,
      changePct: Number(g.change_pct) || 0,
    }));
}

// Không có hàm sắp xếp ở đây: thứ tự ngành do BE quyết (tổng GT khớp lệnh giảm
// dần) và cả hai chart dùng NGUYÊN thứ tự đó. Sắp lại ở FE là hai chart lệch
// hàng nhau, mà `valueTy` ở đây đã làm tròn về tỷ nên sort lại còn đảo cả các
// ngành sát nhau.

export function fmtTy(ty) {
  return ty.toLocaleString("vi-VN");
}

export function fmtPct(pct) {
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

// ===== Né chồng nhãn trên chart "tổng hợp tăng giảm" =====
//
// Nhãn vàng (giá trung bình) và nhãn tím (giá trị khớp lệnh) cùng nằm trên trục
// tiền và cùng đặt bên phải mốc của mình. Giá trung bình chỉ vài chục nghìn còn
// giá trị khớp lệnh tới hàng nghìn tỷ, nên trên thang 0–6.000 tỷ CẢ HAI mốc đều
// dính sát mép trái — ngành nào giao dịch ít (vài tỷ) là hai nhãn đè lên nhau.
//
// Cách xử lý: giữ nguyên nhãn vàng, ĐẨY nhãn tím sang phải vừa đủ để hết chồng.

// Bề rộng trung bình một ký tự ở cỡ chữ 9px của ECharts.
const CHAR_PX = 5.2;
// Khoảng hở tối thiểu giữa hai nhãn.
export const LABEL_GAP_PX = 6;
// Khoảng cách mặc định từ mốc tới nhãn.
const BASE_DISTANCE_PX = 5;
const AVG_LABEL_DISTANCE_PX = 4;

/**
 * Khoảng cách (px) cần đặt cho nhãn tím của TỪNG hàng.
 *
 * plotWidthPx / axisMax dùng để quy giá trị trục ra pixel; thiếu thì trả khoảng
 * cách mặc định (chưa đo được khung vẽ, ví dụ lần render đầu).
 */
export function valueLabelDistances(rows, plotWidthPx, axisMax) {
  if (!(plotWidthPx > 0) || !(axisMax > 0)) {
    return rows.map(() => BASE_DISTANCE_PX);
  }
  const pxPerUnit = plotWidthPx / axisMax;
  return rows.map((r) => {
    const avgLabelStart = r.avgPriceNghin * pxPerUnit + AVG_LABEL_DISTANCE_PX;
    const avgLabelEnd = avgLabelStart + String(r.avgPriceNghin).length * CHAR_PX;
    const valueLabelStart = r.valueTy * pxPerUnit + BASE_DISTANCE_PX;
    const overlap = avgLabelEnd + LABEL_GAP_PX - valueLabelStart;
    return overlap > 0 ? BASE_DISTANCE_PX + overlap : BASE_DISTANCE_PX;
  });
}
