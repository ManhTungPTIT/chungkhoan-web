import { useRef, useCallback } from "react";
import "../styles/panel.scss";

function Panel({ dataPanel = [], onSelectSymbol }) {
  const tbodyRef = useRef(null);
  const timerRef = useRef(null);

  const handleScroll = useCallback(() => {
    const el = tbodyRef.current;
    if (!el) return;
    el.classList.add("is-scrolling");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => el.classList.remove("is-scrolling"), 800);
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Mã</th>
          <th>Tín hiệu</th>
          <th>Giá báo</th>
          <th>(%)</th>
        </tr>
      </thead>
      <tbody ref={tbodyRef} onScroll={handleScroll}>
        {dataPanel.map((item, index) => {
          const isPositive = Number(item.change_pct) >= 0;
          return (
            <tr key={item.symbol ?? index}>
              <td className="code" onClick={() => onSelectSymbol(item.symbol)}>
                {item.symbol}
              </td>
              <td className={isPositive ? "hold" : "sell"}>
                {isPositive ? "Hold" : "Sell"}
              </td>
              <td className="price">{(item.price / 1000).toFixed(2)}</td>
              <td className={isPositive ? "percent_hold" : "percent_sell"}>
                {item.change_pct}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Panel;
