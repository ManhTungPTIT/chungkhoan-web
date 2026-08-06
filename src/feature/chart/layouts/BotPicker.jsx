import { useEffect, useRef, useState } from "react";
import { LuArrowUpNarrowWide, LuCheck } from "react-icons/lu";

import { BOTS } from "../../../layouts/untils/navigation";
import "../styles/BotPicker.scss";

/**
 * Nút đổi BOT trong thanh công cụ màn biểu đồ (bản app).
 *
 * Thay cho `BotSheet` cũ mở từ thanh tab. Hai thứ sửa thẳng vào chỗ khó chịu của
 * bản đó: tên bot đang chọn hiện NGAY TRÊN NÚT (bản cũ phải mở ra mới biết, mà
 * mở ra cũng không đánh dấu), và đổi bot không phải rời màn biểu đồ.
 *
 * Khuôn trigger + menu + đóng khi `pointerdown` ra ngoài chép theo
 * `IndicatorPicker.jsx` cùng thư mục: màn này không nên có hai kiểu tương tác
 * khác nhau cho hai nút nằm cạnh nhau.
 */
function BotPicker({ bot, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = BOTS.find((item) => item.value === bot) ?? BOTS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="bot-picker" translate="no">
      <button
        type="button"
        className="bot-picker__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Đổi BOT, đang chọn ${current.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <LuArrowUpNarrowWide aria-hidden="true" />
        {current.short} ▾
      </button>

      {open && (
        <div className="bot-picker__menu" role="menu" aria-label="Chọn BOT">
          {BOTS.map((item) => {
            const isActive = item.value === current.value;
            return (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={isActive ? "is-active" : ""}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <span>{item.label}</span>
                {isActive && <LuCheck aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BotPicker;
