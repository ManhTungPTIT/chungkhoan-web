import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuArrowUpNarrowWide } from "react-icons/lu";

import { BOTS, botTargetPath } from "../untils/navigation";

/**
 * Tấm trượt lên từ đáy để chọn 1 trong 3 BOT.
 *
 * Không render gì khi đóng (thay vì ẩn bằng CSS): tránh giữ một lớp phủ vô hình
 * nằm đè lên nội dung và nuốt thao tác chạm.
 */
function BotSheet({ open, onClose }) {
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
    navigate(botTargetPath(location.search, botValue));
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
        <ul className="botsheet-list">
          {BOTS.map((bot, index) => (
            <li key={bot.value}>
              <button
                type="button"
                ref={index === 0 ? firstItemRef : undefined}
                className="botsheet-item"
                onClick={() => choose(bot.value)}
              >
                <LuArrowUpNarrowWide aria-hidden="true" />
                <span>{bot.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BotSheet;
