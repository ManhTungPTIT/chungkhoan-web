import { createContext, useContext } from "react";

// Trạng thái hiện/ẩn đi bằng context thay vì props: trang có gần 30 <section>,
// truyền tay thì mỗi biểu đồ mới lại thêm một chỗ dễ quên.
const ChartVisibilityContext = createContext(null);

export function ChartVisibilityProvider({ visible, children }) {
  return (
    <ChartVisibilityContext.Provider value={visible}>{children}</ChartVisibilityContext.Provider>
  );
}

/**
 * Một ô biểu đồ trên trang /chart/market.
 *
 * Bị bỏ tích thì CHỈ ẩn về mặt giao diện (`display: none`) — section vẫn nằm
 * trong cây React nên biểu đồ bên trong vẫn poll API và giữ dữ liệu mới. Tích
 * lại là hiện ra tức thì: không dựng lại chart, không chờ mạng.
 *
 * Cố tình KHÔNG unmount: đo thực tế cho thấy mount lại 29 biểu đồ cùng lúc làm
 * nghẽn main thread ~1.4s, và nếu cache react-query đã bị dọn thì còn phải chờ
 * gần 30 request nữa (~3s).
 *
 * `display: none` đặt bằng inline style chứ không bằng class: vài panel có
 * class riêng đặt `display: flex/grid` với cùng độ ưu tiên, thêm class ẩn thì
 * ăn thua theo thứ tự file SCSS — inline thì luôn thắng.
 */
export function ChartSection({ id, style, children, ...props }) {
  const visible = useContext(ChartVisibilityContext);
  // Không có provider (hoặc id chưa có trong map) thì mặc định hiện.
  const isHidden = visible?.[id] === false;

  return (
    <section
      id={id}
      {...props}
      // aria-hidden để trình đọc màn hình cũng bỏ qua, không chỉ mắt thường.
      aria-hidden={isHidden || undefined}
      style={isHidden ? { ...style, display: "none" } : style}
    >
      {children}
    </section>
  );
}

export default ChartSection;
