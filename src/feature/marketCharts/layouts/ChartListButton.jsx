import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MdFormatListBulleted } from "react-icons/md";
import { MARKET_CHARTS, MARKET_CHART_PATH, scrollToChart } from "../untils/chartList";
import "../styles/chartListButton.scss";

/**
 * Nút NỔI "Danh sách các biểu đồ" ở góc trên bên phải trang /chart/market.
 * Mỗi dòng có hai vùng bấm tách bạch:
 *   - ô tích: bật/tắt hiển thị biểu đồ đó (menu KHÔNG đóng, để tích tiếp)
 *   - tên biểu đồ: cuộn tới biểu đồ đó rồi đóng menu
 *
 * Thay cho danh sách tên biểu đồ trong sidebar (đã bỏ): trang này có hơn 20
 * biểu đồ, để hết trong sidebar thì menu dài hơn cả màn hình.
 */
function ChartListButton({ visible, onToggleChart, onShowChart, onShowAll, onHideAll }) {
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
    // Nhảy tới một biểu đồ đang ẩn thì bật lại trước, không thì bấm xong chẳng
    // có gì xảy ra (section không được render nên không có chỗ mà cuộn tới).
    if (visible[id] === false) {
      onShowChart(id);
      // Section chỉ mount ở lần render sau → hoãn cuộn tới sau khi React vẽ xong.
      window.setTimeout(() => scrollToChart(id), 0);
      if (location.hash !== `#${id}`) {
        navigate(`${MARKET_CHART_PATH}#${id}`, { replace: true });
      }
      return;
    }

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
        aria-label="Danh sách các biểu đồ"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="chart-list-menu"
      >
        <MdFormatListBulleted aria-hidden="true" />
      </button>

      {open && (
        <div className="chart-list__panel" id="chart-list-menu">
          <div className="chart-list__bulk">
            <button type="button" className="chart-list__bulk-btn" onClick={onShowAll}>
              Chọn tất cả
            </button>
            <button type="button" className="chart-list__bulk-btn" onClick={onHideAll}>
              Bỏ hết
            </button>
          </div>

          <ul className="chart-list__menu" role="menu">
            {MARKET_CHARTS.map((chart) => {
              const isVisible = visible[chart.id] !== false;
              return (
                <li key={chart.id} className="chart-list__row" role="none">
                  <input
                    type="checkbox"
                    className="chart-list__check"
                    id={`chart-visible-${chart.id}`}
                    checked={isVisible}
                    onChange={() => onToggleChart(chart.id)}
                    aria-label={`Hiện biểu đồ ${chart.label}`}
                  />
                  <button
                    type="button"
                    role="menuitem"
                    className={`chart-list__item${
                      location.hash === `#${chart.id}` ? " is-active" : ""
                    }${isVisible ? "" : " is-hidden-chart"}`}
                    onClick={() => handleSelect(chart.id)}
                  >
                    {chart.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ChartListButton;
