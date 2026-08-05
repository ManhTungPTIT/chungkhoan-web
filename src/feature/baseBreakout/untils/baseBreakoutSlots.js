// Toạ độ các chỗ đặt chữ trên ẢNH NỀN của chart "TOP MÃ VƯỢT NỀN TÍCH LŨY 30
// PHIÊN".
//
// Có HAI ảnh nền, không phải một ảnh co giãn:
//   - desktop `base-breakout-bg.jpg`        1672×941  (ngang, 15 bong bóng)
//   - mobile  `base-breakout-bg-mobile.png` 1080×1200 (dọc,   15 bong bóng)
// Ảnh ngang ép vào bề ngang điện thoại thì chữ trong bong bóng nhỏ tới mức không
// đọc nổi, buộc phải cuộn ngang — đúng thứ bản dọc sinh ra để tránh.
//
// Cả hai ảnh vẽ CHẾT tiêu đề, thẻ thống kê (kèm icon + nhãn), hộp chú thích,
// thang 4 band và các quả bong bóng. Lớp React chỉ phủ CHỮ lên.
//
// Mọi toạ độ là PHẦN TRĂM của khung ảnh tương ứng, đo bằng script xử lý ảnh trên
// chính file nền — KHÔNG ước lượng bằng mắt. Lệch vài pixel là chữ tràn khỏi
// bong bóng, mà lỗi kiểu đó rất khó thấy: chữ vẫn "gần đúng" chỗ nên trông như
// lỗi font. Xem ghi chú cuối file khi thay ảnh.

const pct = (px, total) => Number(((px / total) * 100).toFixed(3));

/**
 * Dựng một layout hoàn chỉnh từ số đo pixel thô.
 *
 * `rank` (hạng chiều cao, 0 = quả cao nhất) tính TỪ CHÍNH `cy`, không chép tay:
 * thêm/bớt bong bóng thì không phải ngồi đánh số lại, và không thể đánh sai.
 */
function buildLayout({ id, image, width, height, bubbles, tiles, badge, fonts }) {
  const heightOrder = [...bubbles]
    .map((b, index) => ({ index, cy: b.cy }))
    .sort((a, b) => a.cy - b.cy)
    .map((b) => b.index);

  return {
    id,
    image,
    width,
    height,
    fonts,
    bubbles: bubbles.map((b, index) => ({
      index,
      x: pct(b.cx, width),
      y: pct(b.cy, height),
      w: pct(b.w, width),
      rank: heightOrder.indexOf(index),
    })),
    tiles: tiles.map((t) => ({
      key: t.key,
      unit: t.unit,
      x: pct((t.x0 + t.x1) / 2, width),
      y: pct(t.y, height),
      w: pct(t.x1 - t.x0, width),
    })),
    badge: badge
      ? {
          x: pct((badge.x0 + badge.x1) / 2, width),
          y: pct((badge.y0 + badge.y1) / 2, height),
          w: pct(badge.x1 - badge.x0, width),
          // Ảnh nền nào ĐÃ VẼ SẴN icon lịch/đồng hồ thì đặt `icons: false` —
          // component bỏ icon React đi, nếu không sẽ có hai bộ icon chồng nhau.
          icons: badge.icons !== false,
        }
      : null,
  };
}

// ─── Desktop: 1672×941, 15 bong bóng ───────────────────────────────────────
//
// Số đo dưới đây ứng với bản nền dải-tím (thay ngày 2026-08-05), KHÔNG dùng lại
// được cho bản cũ: mọi quả bóng và cả hàng thẻ đều đã dịch chỗ.
//
// Đường MẶT NƯỚC (y 689–703) là màu lam bão hoà chạy suốt bề ngang nên nối các
// quả bóng chạm nó thành MỘT khối liên thông (quả xanh dương giữa hình từng bị
// đo ra bề rộng 1252px). Phải xoá dải đó khỏi mask trước khi dò khối.
//
// Quả đầu tiên (xanh nhạt, ngoài cùng trái) vẫn phải đo RIÊNG: màu nhạt và vệt
// sáng giữa quả gần như trắng nên mask ngưỡng-bão-hoà bị thủng. Luật riêng dùng
// được: quét theo HÀNG với g > r và g > b rồi lấy hàng rộng nhất — ra 68px tại
// y=623.
export const DESKTOP_LAYOUT = buildLayout({
  id: "desktop",
  image: "desktop",
  width: 1672,
  height: 941,
  bubbles: [
    { cx: 180.8, cy: 623.0, w: 68 },
    { cx: 336.0, cy: 495.0, w: 95 },
    { cx: 406.5, cy: 637.0, w: 76 },
    { cx: 509.0, cy: 365.0, w: 117 },
    { cx: 573.0, cy: 565.0, w: 91 },
    { cx: 687.0, cy: 601.0, w: 83 },
    { cx: 755.5, cy: 434.0, w: 110 },
    { cx: 936.5, cy: 362.0, w: 118 },
    { cx: 943.0, cy: 604.0, w: 85 },
    { cx: 1044.0, cy: 785.0, w: 77 },   // quả XÁM nằm dưới mặt nước
    { cx: 1161.5, cy: 399.0, w: 102 },
    { cx: 1218.0, cy: 613.0, w: 83 },
    { cx: 1384.0, cy: 332.0, w: 131 },
    { cx: 1399.5, cy: 619.0, w: 80 },
    { cx: 1546.5, cy: 502.0, w: 90 },
  ],
  // Thẻ cao 152–256, icon tròn bên trái, nhãn bake ở dải 181–197 → số đặt ở 226
  // (giữa khoảng trống còn lại). x0 = mép phải icon, x1 = mép phải thẻ.
  tiles: [
    { key: "count", x0: 114, x1: 261, y: 226, unit: null },
    { key: "totalValue", x0: 375, x1: 507, y: 226, unit: "TỶ" },
    { key: "avgBreakout", x0: 619, x1: 786, y: 226, unit: null },
    { key: "avgLiquidity", x0: 902, x1: 1093, y: 226, unit: "LẦN TB 20P" },
    { key: "strongFlow", x0: 1212, x1: 1377, y: 226, unit: "MÃ" },
  ],
  // Dải tím chạy suốt đầu hình (x 14–1656, y 11–98) đã VẼ SẴN icon lịch (x
  // 1485–1505, y 33–52) và icon đồng hồ (x 1486–1504, y 61–80) xếp dọc. Ô chữ
  // bắt đầu ngay sau icon và canh đúng hai tâm icon đó → `icons: false`.
  badge: { x0: 1513, x1: 1652, y0: 33, y1: 80, icons: false },
  fonts: {
    // Sàn 0.9cqw: theo tỉ lệ thuần quả bé nhất ra cỡ chữ ~10px, không đọc nổi.
    minBubble: "0.9cqw",
    tileValue: "1.85cqw",
    tileUnit: "0.78cqw",
    // 1.05cqw ≈ 17.6px, xấp xỉ chiều cao icon bake (20px) nên hai dòng chữ không
    // bị lép so với icon. Đổi cỡ này thì phải đổi luôn `gap` của
    // .base-breakout__badge--bare: hai dòng phải cách nhau đúng 28px.
    badge: "1.05cqw",
    // Khoảng cách hai dòng ngày/giờ, chọn để mỗi dòng ngang tâm icon bake.
    badgeGap: "0.62cqw",
  },
});

// ─── Mobile: 1080×1200, 15 bong bóng ───────────────────────────────────────
//
// Bản nền dọc mới (thay 2026-08-05) KHÔNG còn là bản 1080×1920 với 9 quả to:
// nó nhồi đúng 15 quả như bản ngang vào một dải cao ~350px, nên quả bé nhất chỉ
// rộng 42px trên ảnh. Kèm theo đó là ô badge ngày/giờ (bản cũ không có) và hàng
// thẻ 2 cột × 3 hàng đặt ở chỗ khác hẳn.
//
// ⚠️ Bề ngang canvas dọc bám theo bề ngang máy, nên chữ trong bong bóng co theo
// máy: xem `minBubble` bên dưới.
//
// Cũng như bản ngang, dải mặt nước (y 1019–1030) nối các quả chạm nó thành một
// khối — phải xoá dải đó khỏi mask trước khi dò khối liên thông.
export const MOBILE_LAYOUT = buildLayout({
  id: "mobile",
  image: "mobile",
  width: 1080,
  height: 1200,
  bubbles: [
    { cx: 128.5, cy: 979.0, w: 42 },
    { cx: 226.0, cy: 893.0, w: 59 },
    { cx: 269.5, cy: 989.0, w: 48 },
    { cx: 334.5, cy: 817.0, w: 74 },
    { cx: 375.0, cy: 942.0, w: 57 },
    { cx: 446.5, cy: 963.0, w: 52 },
    { cx: 489.0, cy: 857.0, w: 69 },
    { cx: 603.0, cy: 809.0, w: 73 },
    { cx: 607.0, cy: 965.0, w: 53 },
    { cx: 670.5, cy: 1079.0, w: 48 },   // quả XÁM nằm dưới mặt nước
    { cx: 744.5, cy: 839.0, w: 64 },
    { cx: 779.5, cy: 972.0, w: 52 },
    { cx: 884.0, cy: 798.0, w: 83 },
    { cx: 893.5, cy: 974.0, w: 50 },
    { cx: 986.0, cy: 904.0, w: 57 },
  ],
  // Thẻ xếp lưới 2 cột × 3 hàng (ô thứ 6 là hộp CHÚ THÍCH, không có số). Ảnh
  // sinh ra các thẻ KHÔNG bằng nhau — hàng 1 thụt vào trong, hai thẻ cùng hàng
  // lệch nhau vài px — nên mỗi thẻ đo riêng thay vì suy ra từ một lưới đều.
  // x0 = mép phải icon, x1 = mép phải thẻ, y = giữa khoảng trống dưới nhãn bake.
  tiles: [
    { key: "count", x0: 221, x1: 499, y: 257, unit: null },
    { key: "totalValue", x0: 756, x1: 1005, y: 255, unit: "TỶ" },
    { key: "avgBreakout", x0: 201, x1: 519, y: 461, unit: null },
    { key: "avgLiquidity", x0: 709, x1: 1047, y: 456, unit: "LẦN TB 20P" },
    { key: "strongFlow", x0: 206, x1: 521, y: 665, unit: "MÃ" },
  ],
  // Dải tím đầu hình (x 15–1064, y 15–71) đã vẽ sẵn icon lịch (x 955–967,
  // y 29–41) và đồng hồ (cùng x, y 47–59) — giống bản ngang, ô chữ nằm ngay sau
  // icon nên `icons: false`.
  badge: { x0: 975, x1: 1058, y0: 29, y1: 59, icons: false },
  fonts: {
    // Sàn theo PX chứ không cqw: khung dọc hẹp nên vài phần trăm cqw chỉ còn
    // 2–3px trên điện thoại — vô dụng làm sàn.
    //
    // ⚠️ 3px là mức LỚN NHẤT còn gọn trong quả bé nhất (42/1080 = 3.9% bề ngang)
    // khi canvas rộng ~370px, tức trên điện thoại thật: quả đó chỉ còn ~14px,
    // mà "+3.87%" ở 5px đã rộng ~17px nên chọc hẳn ra ngoài mép quả.
    //
    // Đây là hệ quả TRỰC TIẾP của ảnh nền — 15 quả nhồi vào khung dọc thì không
    // cỡ chữ nào vừa quả mà lại đọc được, nên đã CHỌN "vừa quả" (chữ ở mấy quả
    // bé thành vệt mờ) thay vì "đọc được nhưng tràn". Muốn chữ to lại thì phải
    // đổi ảnh (ít quả hơn / quả to hơn) chứ không phải chỉnh số ở đây; bản dọc
    // cũ 9 quả to nên sàn 8px vẫn gọn.
    minBubble: "3px",
    tileValue: "3.7cqw",
    tileUnit: "1.6cqw",
    // Ô chữ chỉ rộng 83px trên ảnh → "04/08/2026" bắt buộc ≤ ~1.4cqw.
    badge: "1.3cqw",
    badgeGap: "0.37cqw",
  },
});

/** Breakpoint đổi layout — trùng mốc mobile sẵn có của marketCharts.scss. */
export const MOBILE_QUERY = "(max-width: 760px)";

// ⚠️ Thay ảnh nền thì chạy lại script đo rồi cập nhật width/height, bubbles,
// tiles, badge của layout tương ứng — và sửa `aspect-ratio` trong
// baseBreakout.scss cho khớp. Chỉnh tay theo cảm giác sẽ lệch dần và rất khó
// phát hiện.
