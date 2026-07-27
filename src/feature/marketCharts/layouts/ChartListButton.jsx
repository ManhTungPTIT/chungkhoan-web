import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MdFormatListBulleted } from "react-icons/md";
import { MARKET_CHARTS, MARKET_CHART_PATH, scrollToChart } from "../untils/chartList";
import "../styles/chartListButton.scss";

/**
 * Nút NỔI "Danh sách các biểu đồ" ở góc trên bên phải trang /chart/market.
 * Bấm → xổ danh sách tên biểu đồ, chọn một mục thì cuộn tới biểu đồ đó.
 *
 * Thay cho danh sách tên biểu đồ trong sidebar (đã bỏ): trang này có hơn 20
 * biểu đồ, để hết trong sidebar thì menu dài hơn cả màn hình.
 */
function ChartListButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Đóng khi bấm ra ngoài hoặc bấm Esc — hành vi quen thuộc của menu nổi.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = (id) => {
    setOpen(false);
    // Hash đổi → useEffect của trang lo phần cuộn. Hash KHÔNG đổi (chọn lại đúng
    // mục đang xem) thì effect không chạy nên phải tự cuộn ở đây.
    if (location.hash === `#${id}`) {
      scrollToChart(id);
      return;
    }
    navigate(`${MARKET_CHART_PATH}#${id}`, { replace: true });
  };

  return (
    <div className="chart-list" ref={rootRef}>
      <button
        type="button"
        className="chart-list__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="chart-list-menu"
      >
        <MdFormatListBulleted aria-hidden="true" />
        <span>Danh sách các biểu đồ</span>
      </button>

      {open && (
        <ul className="chart-list__menu" id="chart-list-menu" role="menu">
          {MARKET_CHARTS.map((chart) => (
            <li key={chart.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={`chart-list__item${
                  location.hash === `#${chart.id}` ? " is-active" : ""
                }`}
                onClick={() => handleSelect(chart.id)}
              >
                {chart.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChartListButton;
