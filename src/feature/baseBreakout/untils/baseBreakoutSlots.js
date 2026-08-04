// Toạ độ các chỗ đặt chữ trên ẢNH NỀN của chart "TOP MÃ VƯỢT NỀN TÍCH LŨY 30
// PHIÊN".
//
// Có HAI ảnh nền, không phải một ảnh co giãn:
//   - desktop `base-breakout-bg.jpg`        1672×941  (ngang, 15 bong bóng)
//   - mobile  `base-breakout-bg-mobile.png` 1080×1920 (dọc,   9 bong bóng)
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
        }
      : null,
  };
}

// ─── Desktop: 1672×941, 15 bong bóng ───────────────────────────────────────
//
// Quả đầu tiên (xanh nhạt, ngoài cùng trái) phải đo RIÊNG: màu nhạt và vệt sáng
// bóng giữa quả gần như trắng nên mask ngưỡng-bão-hoà bị thủng, phép dò chung bỏ
// sót. Cách đo dùng được: quét theo HÀNG với luật màu riêng (g > r và g > b) rồi
// lấy hàng rộng nhất — ra thân liền mạch y 567–639, rộng nhất 66px tại y=603.
// (Lần đầu đo bằng khối liên thông ra 57px, tức HỤT 14%: chữ vẫn "vừa" theo số
// đo nhưng thực tế chọc ra khỏi mép quả.)
export const DESKTOP_LAYOUT = buildLayout({
  id: "desktop",
  image: "desktop",
  width: 1672,
  height: 941,
  bubbles: [
    { cx: 182.5, cy: 603.0, w: 66 },
    { cx: 337.2, cy: 479.9, w: 96 },
    { cx: 405.6, cy: 617.1, w: 76 },
    { cx: 500.2, cy: 351.5, w: 117 },
    { cx: 565.0, cy: 549.9, w: 90 },
    { cx: 679.1, cy: 582.3, w: 80 },
    { cx: 746.8, cy: 419.9, w: 111 },
    { cx: 925.4, cy: 347.1, w: 116 },
    { cx: 932.3, cy: 587.0, w: 87 },
    { cx: 1035.4, cy: 764.4, w: 80 },   // quả XÁM nằm dưới mặt nước
    { cx: 1149.4, cy: 385.5, w: 102 },
    { cx: 1204.6, cy: 593.6, w: 82 },
    { cx: 1366.3, cy: 328.1, w: 140 },
    { cx: 1384.5, cy: 596.2, w: 80 },
    { cx: 1532.7, cy: 487.1, w: 94 },
  ],
  // Thẻ cao 125–224, icon tròn bên trái, nhãn bake ở dải 144–161 → số đặt ở 193
  // (giữa khoảng trống còn lại). x0 = mép phải icon, x1 = mép phải thẻ.
  tiles: [
    { key: "count", x0: 113, x1: 255, y: 193, unit: null },
    { key: "totalValue", x0: 359, x1: 487, y: 193, unit: "TỶ" },
    { key: "avgBreakout", x0: 592, x1: 783, y: 193, unit: null },
    { key: "avgLiquidity", x0: 887, x1: 1090, y: 193, unit: "LẦN TB 20P" },
    { key: "strongFlow", x0: 1196, x1: 1362, y: 193, unit: "MÃ" },
  ],
  // Đo bằng cách tìm đoạn chạy dài liền mạch màu tím: hình con bò bên cạnh cũng
  // tím nhưng đứt quãng nên bị loại.
  badge: { x0: 1486, x1: 1645, y0: 20, y1: 109 },
  fonts: {
    // Sàn 0.9cqw: theo tỉ lệ thuần quả bé nhất ra cỡ chữ ~10px, không đọc nổi.
    minBubble: "0.9cqw",
    tileValue: "1.85cqw",
    tileUnit: "0.78cqw",
    badge: "0.95cqw",
  },
});

// ─── Mobile: 1080×1920, 9 bong bóng ────────────────────────────────────────
//
// Quả xanh-tím ngoài cùng trái bị phép dò chung TÁCH ĐÔI (màu nhạt, mask đứt
// quãng) → đo riêng trong cửa sổ cục bộ: thân liền mạch từ y≈995 tới y≈1155,
// rộng nhất 156px tại y=1075.
//
// Ảnh này KHÔNG có ô badge ngày/giờ, nên `badge: null` — component tự bỏ qua.
export const MOBILE_LAYOUT = buildLayout({
  id: "mobile",
  image: "mobile",
  width: 1080,
  height: 1920,
  bubbles: [
    { cx: 139.6, cy: 1061.2, w: 156 },
    { cx: 263.8, cy: 1270.5, w: 100 },
    { cx: 402.2, cy: 1064.8, w: 120 },
    { cx: 404.7, cy: 1356.9, w: 99 },
    { cx: 585.4, cy: 1211.5, w: 119 },
    { cx: 692.9, cy: 1385.5, w: 90 },
    { cx: 746.9, cy: 1072.6, w: 108 },
    { cx: 863.0, cy: 1229.1, w: 104 },
    { cx: 939.2, cy: 874.8, w: 188 },
  ],
  // Thẻ xếp lưới 2 cột × 3 hàng. Vùng chữ: cột trái x 150–524, cột phải
  // x 648–1022 (đều bắt đầu sau icon tròn). Mỗi HÀNG có mốc y riêng — nhãn bake
  // kết thúc ở 283 / 425 / 567, đáy thẻ ở 352 / 494 / 636.
  tiles: [
    { key: "count", x0: 150, x1: 524, y: 318, unit: null },
    { key: "totalValue", x0: 648, x1: 1022, y: 318, unit: "TỶ" },
    { key: "avgBreakout", x0: 150, x1: 524, y: 460, unit: null },
    { key: "avgLiquidity", x0: 648, x1: 1022, y: 460, unit: "LẦN TB 20P" },
    { key: "strongFlow", x0: 150, x1: 524, y: 602, unit: "MÃ" },
  ],
  badge: null,
  fonts: {
    // Sàn theo PX chứ không cqw: khung dọc hẹp nên 0.9cqw chỉ còn ~3.5px trên
    // điện thoại — vô dụng làm sàn.
    //
    // 8px là mức LỚN NHẤT còn gọn trong quả bé nhất. Chốt bằng ảnh chụp chứ
    // không bằng phép so bề rộng: bong bóng TRÒN nên dòng dưới cùng ("(2.85x)")
    // nằm thấp hơn tâm, chỗ đó quả đã thóp lại. Chữ chiếm quá ~72% bề ngang lớn
    // nhất là chọc ra mép dù số đo vẫn báo "vừa" — 9px đã lên 77%, 10px lên 86%.
    minBubble: "8px",
    // Khung hẹp nên cùng một cỡ chữ thật lại ứng với cqw lớn hơn nhiều.
    tileValue: "3.7cqw",
    tileUnit: "1.6cqw",
    badge: "2cqw",
  },
});

/** Breakpoint đổi layout — trùng mốc mobile sẵn có của marketCharts.scss. */
export const MOBILE_QUERY = "(max-width: 760px)";

// ⚠️ Thay ảnh nền thì chạy lại script đo rồi cập nhật width/height, bubbles,
// tiles, badge của layout tương ứng — và sửa `aspect-ratio` trong
// baseBreakout.scss cho khớp. Chỉnh tay theo cảm giác sẽ lệch dần và rất khó
// phát hiện.
