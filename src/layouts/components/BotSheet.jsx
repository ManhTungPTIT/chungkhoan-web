import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuArrowUpNarrowWide, LuCheck } from "react-icons/lu";

import { BOTS, botTargetPath } from "../untils/navigation";

/**
 * Tấm trượt lên từ đáy để chọn 1 trong 3 BOT, mở từ tab "Trang chủ".
 *
 * Không render gì khi đóng (thay vì ẩn bằng CSS): tránh giữ một lớp phủ vô hình
 * nằm đè lên nội dung và nuốt thao tác chạm.
 *
 * Tấm trượt CHỈ đọc `bot`, không tự ghi trí nhớ. Chọn xong là điều hướng tới
 * `/?bot=X`, rồi feature/chart/index.jsx thấy `?bot=` hợp lệ thì mới ghi. Hai nơi
 * cùng ghi thì sớm muộn lệch nhau.
 */
function BotSheet({ open, bot, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const firstItemRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    // Đưa tiêu điểm vào tấm trượt để đọc màn hình không bỏ sót, và để phím Tab
    // không lang thang xuống nội dung phía sau.
    firstItemRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const choose = (botValue) => {
    // Chọn trúng bot đang xem thì chỉ đóng: `navigate` tới đúng URL đang đứng vẫn
    // đẻ một mục lịch sử, bấm back một lần sẽ không đi đâu cả.
    if (botValue !== bot) navigate(botTargetPath(location.search, botValue));
    onClose();
  };

  return (
    // Chạm ra ngoài để đóng — thói quen chuẩn của bottom sheet trên di động.
    <div className="botsheet" role="presentation" onClick={onClose}>
      <div
        className="botsheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Chọn BOT"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="botsheet-grip" aria-hidden="true" />
        <h2 className="botsheet-title">Chọn BOT</h2>
        {/* div role="menu" với button là CON TRỰC TIẾP: ARIA đòi menuitemradio
            nằm ngay dưới menu, chen <li> vào giữa là sai. */}
        <div className="botsheet-list" role="menu">
          {BOTS.map((item, index) => {
            const isActive = item.value === bot;

            return (
              <button
                key={item.value}
                type="button"
                ref={index === 0 ? firstItemRef : undefined}
                role="menuitemradio"
                aria-checked={isActive}
                className={`botsheet-item${isActive ? " is-active" : ""}`}
                onClick={() => choose(item.value)}
              >
                <LuArrowUpNarrowWide aria-hidden="true" />
                <span>{item.label}</span>
                {isActive && (
                  <LuCheck className="botsheet-item__check" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BotSheet;
