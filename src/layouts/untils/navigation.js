// Đích điều hướng dùng chung cho sidebar (bản web) và bottom tab (bản app).
//
// `BOTS` dùng ở hai nơi: sidebar bản web (MainLayout.jsx) và tấm trượt chọn BOT
// của bản app (layouts/components/BotSheet.jsx). Cả hai đều hiện `label` đầy đủ.

/**
 * Ba loại BOT, thứ tự hiển thị đúng như sidebar bản web.
 */
export const BOTS = [
  { value: "trend", label: "BOT Trend" },
  { value: "t", label: "BOT T+" },
  { value: "long", label: "BOT Dài hạn" },
];

/**
 * Đường dẫn khi đổi BOT, GIỮ NGUYÊN mã đang xem.
 *
 * Điều hướng cứng sang `/?bot=...` sẽ xoá `symbol` trên URL → feature/chart/index.jsx
 * tự reset về VNINDEX, khiến biểu đồ "giật" khỏi mã người dùng đang xem.
 *
 * Chỉ mang theo `symbol` chứ không copy toàn bộ query hiện tại: nút đổi BOT có thể
 * được bấm từ trang khác (/chart/filter, /chart/market) và tham số của những trang
 * đó không có ý nghĩa gì ở "/". Trang "/" chỉ đọc `symbol` và `bot`
 * (feature/chart/index.jsx:81, :186) nên không mất gì.
 *
 * @param {string} search location.search hiện tại, vd "?symbol=HPG&bot=t"
 * @param {string} botValue "trend" | "t" | "long"
 * @returns {string}
 */
export function botTargetPath(search, botValue) {
  const current = new URLSearchParams(search);
  const params = new URLSearchParams();

  const symbol = current.get("symbol");
  if (symbol) params.set("symbol", symbol);
  params.set("bot", botValue);

  return `/?${params.toString()}`;
}

/**
 * Tab nào đang được chọn, suy từ đường dẫn.
 *
 * Hàm thuần để test được mà không phải dựng router.
 *
 * @param {string} pathname
 * @returns {"bot" | "filter" | "market" | "account" | null}
 */
export function activeTabKey(pathname) {
  if (pathname === "/") return "bot";
  if (pathname === "/chart/filter") return "filter";
  // startsWith: /chart/market còn có hash và các biến thể con.
  if (pathname.startsWith("/chart/market")) return "market";
  // startsWith: bản app tách trang tài khoản thành hub /info + các màn con /info/*, tab
  // dưới phải sáng ở cả bốn đường dẫn đó.
  if (pathname.startsWith("/info")) return "account";
  return null;
}
