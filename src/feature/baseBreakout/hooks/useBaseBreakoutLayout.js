import { useEffect, useState } from "react";
import {
  DESKTOP_LAYOUT,
  MOBILE_LAYOUT,
  MOBILE_QUERY,
} from "../untils/baseBreakoutSlots";

/**
 * Chọn ảnh nền + bộ toạ độ theo bề ngang màn hình.
 *
 * Phải làm bằng JS chứ không thuần CSS: media query đổi được ảnh nền, nhưng toạ
 * độ 15 (hay 9) chỗ đặt chữ nằm trong JS và HAI ảnh có bố cục khác hẳn nhau —
 * đổi ảnh mà không đổi toạ độ thì mọi nhãn rơi ra ngoài bong bóng.
 *
 * `matchMedia` thay vì nghe `resize`: trình duyệt chỉ báo khi VƯỢT mốc, không
 * bắn sự kiện suốt lúc kéo cửa sổ.
 */
export function useBaseBreakoutLayout() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (event) => setIsMobile(event.matches);

    // Đồng bộ lại ngay: giữa lần dựng state đầu và lúc effect chạy, bề ngang có
    // thể đã đổi (xoay ngang điện thoại, mở/đóng thanh bên).
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
}
