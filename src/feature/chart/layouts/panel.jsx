import { useRef, useCallback, useEffect, useMemo } from "react";
import "../styles/panel.scss";
import { signalDisplay } from "../untils/signalDisplay";

// Nhãn tín hiệu hiển thị thực tế của một mã (khớp với logic render bên dưới).
function displaySignal(item) {
  if (item.signal === "buy") {
    return Number(item.signal_sessions) > 0 ? "HOLD" : "BUY";
  }
  if (item.signal === "sell") return "SELL";
  return "—";
}

// Thứ tự sắp xếp nhóm tín hiệu: BUY → HOLD → SELL → (trung tính).
const SIGNAL_ORDER = { BUY: 0, HOLD: 1, SELL: 2, "—": 3 };

function getSessionOrder(item) {
  const value = item?.signal_sessions;
  if (value == null) return Number.MAX_SAFE_INTEGER;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function Panel({ dataPanel = [], highlightedSymbol = "", onSelectSymbol }) {
  const tbodyRef = useRef(null);
  const rowRefs = useRef(new Map());
  const timerRef = useRef(null);
  const normalizedHighlight = highlightedSymbol.trim().toUpperCase();
  
  const handleScroll = useCallback(() => {
    const el = tbodyRef.current;
    if (!el) return;
    el.classList.add("is-scrolling");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => el.classList.remove("is-scrolling"),
      800,
    );
  }, []);

  // Sắp xếp theo nhóm tín hiệu, sau đó theo T+ tăng dần.
  const sortedPanel = useMemo(
    () =>
      [...dataPanel].sort(
        (a, b) =>
          SIGNAL_ORDER[displaySignal(a)] - SIGNAL_ORDER[displaySignal(b)] ||
          getSessionOrder(a) - getSessionOrder(b),
      ),
    [dataPanel],
  );

  useEffect(() => {
    if (!normalizedHighlight) return;
    const row = rowRefs.current.get(normalizedHighlight);
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });
    const tbody = tbodyRef.current;
    if (!tbody) return;
    tbody.classList.add("is-scrolling");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => tbody.classList.remove("is-scrolling"),
      1200,
    );
  }, [normalizedHighlight, sortedPanel]);

  return (
    <table>
      <thead>
        <tr>
          <th>
            <div className="th-ma">
              Mã
            </div>
          </th>
          <th>Tín hiệu</th>
          <th>Giá báo</th>
          <th>(%)</th>
          <th>T+</th>
        </tr>
      </thead>
      <tbody ref={tbodyRef} translate="no" onScroll={handleScroll}>
        {sortedPanel.map((item, index) => {
          console.log(item)
          // Chỉ hiển thị tín hiệu THẬT từ backend (item.signal). Mã chưa có
          // tín hiệu → "—" trung tính, không đoán theo change_pct.
          const sig = signalDisplay(item.signal);
          const label = displaySignal(item);
          const isPositive = Number(item.change_pct) >= 0;
          const symbol = String(item.symbol ?? "").toUpperCase();
          const isHighlighted = symbol === normalizedHighlight;
          return (
            <tr
              ref={(node) => {
                if (node && symbol) rowRefs.current.set(symbol, node);
                else rowRefs.current.delete(symbol);
              }}
              className={isHighlighted ? "is-highlighted" : undefined}
              key={item.symbol ?? index}
            >
              <td className="code" onClick={() => onSelectSymbol(item.symbol)}>
                {item.symbol}
              </td>
              <td className={label === "HOLD" || label === "SELL" ?  sig.className : "buy" }>{label}</td>
              <td className="price">{(item.signal_price)}</td>
              <td className={isPositive ? "percent_hold" : "percent_sell"}>
                {item.change_pct}
              </td>
              <td>T+{item.signal_sessions ?? "--"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Panel;
