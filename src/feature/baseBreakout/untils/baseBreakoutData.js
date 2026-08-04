/**
 * Gán mã vào các bong bóng vẽ sẵn trên ảnh nền.
 *
 * `bubbleSlots` truyền vào chứ không import cứng: bản desktop có 15 chỗ, bản
 * mobile chỉ 9 — số mã hiển thị do ẢNH NỀN quyết định.
 *
 * Hai bước, cố ý dùng HAI thước đo khác nhau:
 *   1. CHỌN mã   — theo `diem` (ĐiểmBậtNền) giảm dần. Backend đã sắp sẵn nên chỉ
 *      cắt 15 mã đầu; đây là thước đo chất lượng cú bứt phá.
 *   2. XẾP CHỖ   — theo `vuot_nen` giảm dần, thả vào bong bóng cao dần. Chiều
 *      cao trên ảnh là thứ người xem đọc được ngay, nên nó phải ứng với "vượt
 *      nền bao nhiêu", không phải với điểm (điểm là hàm tam giác chóp ở 2% —
 *      xếp theo điểm thì mã vượt 5% lại nằm thấp nhất, phản trực giác).
 *
 * Thiếu mã thì bong bóng thừa để TRỐNG chữ: chúng vẽ chết trong PNG nên không
 * ẩn được, và bịa số vào đó thì tệ hơn hẳn một quả bóng rỗng.
 */
export function assignBubbles(rows, bubbleSlots) {
  const slots = Array.isArray(bubbleSlots) ? bubbleSlots : [];
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const chosen = list.slice(0, slots.length);

  const byBreakout = [...chosen].sort(
    (a, b) => Number(b.vuot_nen ?? 0) - Number(a.vuot_nen ?? 0),
  );

  // rank 0 = bong bóng cao nhất → nhận mã vượt nền nhiều nhất.
  return slots.map((slot) => {
    const row = byBreakout[slot.rank] ?? null;
    return { ...slot, row, symbol: row?.symbol ?? null };
  });
}

const VN = "vi-VN";

/**
 * Số dùng được, hoặc null nếu thiếu.
 *
 * Phải chặn null/""/undefined RIÊNG: `Number(null)` và `Number("")` đều ra 0 và
 * lọt qua Number.isFinite, khiến trường thiếu hiện thành "+0.00%" — một con số
 * trông hợp lệ nhưng bịa.
 */
function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** 6245.4 → "6,245" (nghìn phân cách kiểu ảnh mẫu, không phải dấu chấm VN). */
export function fmtValueTy(ty) {
  const n = num(ty);
  return n === null ? "—" : Math.round(n).toLocaleString("en-US");
}

/** 2.0 → "+2.00%" */
export function fmtBreakout(pct) {
  const n = num(pct);
  return n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** 2.65 → "(2.65x)"; thiếu dữ liệu thì bỏ hẳn dòng chứ không hiện "(0.00x)". */
export function fmtRatio(ratio) {
  const n = num(ratio);
  return n === null ? "" : `(${n.toFixed(2)}x)`;
}

/**
 * `generated_at` của backend là NGÀY ("2026-08-04") — không có giờ. Badge cần cả
 * ngày lẫn giờ nên giờ lấy từ đồng hồ máy người xem tại lúc render; ngày vẫn ưu
 * tiên giá trị backend để không lệch khi máy client sai ngày.
 */
export function formatBadge(generatedAt, now = new Date()) {
  // 2 chữ số cho ngày/tháng: "04/08/2026" chứ không "4/8/2026" — hai dòng badge
  // xếp chồng nhau nên bề rộng phải đều, và khớp định dạng của ảnh mẫu.
  const asDay = (d) =>
    d.toLocaleDateString(VN, { day: "2-digit", month: "2-digit", year: "numeric" });

  const time = now.toLocaleTimeString(VN, { hour12: false });
  const parsed = generatedAt ? new Date(`${generatedAt}T00:00:00`) : null;
  const day =
    parsed && !Number.isNaN(parsed.getTime()) ? asDay(parsed) : asDay(now);
  return { day, time };
}

/** Các con số của 5 thẻ thống kê, theo đúng `key` khai trong TILE_SLOTS. */
export function tileValues(summary) {
  const s = summary || {};
  // Ở đây thiếu dữ liệu HIỆN 0 chứ không "—": đây là số đếm/tổng, "chưa có mã
  // nào qua lọc" chính là 0 — khác với dòng % của từng mã (thiếu = không biết).
  const n = (value) => num(value) ?? 0;
  return {
    count: String(n(s.count)),
    totalValue: fmtValueTy(n(s.total_gtgd_ty)),
    avgBreakout: `${n(s.avg_vuot_nen).toFixed(2)}%`,
    avgLiquidity: n(s.avg_tl_thanh_khoan).toFixed(2),
    strongFlow: String(n(s.strong_flow_count)),
  };
}
