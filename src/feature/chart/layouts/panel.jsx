import { useRef, useCallback, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
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

function Panel({ dataPanel = [], onSelectSymbol }) {
  const tbodyRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  

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

  const openInput = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeInput = () => {
    setShowInput(false);
    setInputValue("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const symbol = inputValue.trim().toUpperCase();
    if (!symbol) return;
    onSelectSymbol(symbol);
    closeInput();
  };

  // Sắp xếp theo nhóm tín hiệu: BUY → HOLD → SELL → trung tính.
  const sortedPanel = [...dataPanel].sort(
    (a, b) => SIGNAL_ORDER[displaySignal(a)] - SIGNAL_ORDER[displaySignal(b)],
  );

  return (
    <table>
      <thead>
        <tr>
          <th>
            <div className="th-ma">
              Mã
              <button className="search-btn" onClick={openInput}>
                <FiSearch />
              </button>
            </div>
            {showInput && (
              <form className="symbol-input-form" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập mã..."
                />
                <button type="button" className="close-btn" onClick={closeInput}>
                  <IoCloseOutline />
                </button>
              </form>
            )}
          </th>
          <th>Tín hiệu</th>
          <th>Giá báo</th>
          <th>(%)</th>
        </tr>
      </thead>
      <tbody ref={tbodyRef} translate="no" onScroll={handleScroll}>
        {sortedPanel.map((item, index) => {
          // Chỉ hiển thị tín hiệu THẬT từ backend (item.signal). Mã chưa có
          // tín hiệu → "—" trung tính, không đoán theo change_pct.
          const sig = signalDisplay(item.signal);
          const label = displaySignal(item);
          const isPositive = Number(item.change_pct) >= 0;
          return (
            <tr key={item.symbol ?? index}>
              <td className="code" onClick={() => onSelectSymbol(item.symbol)}>
                {item.symbol}
              </td>
              <td className={sig.className}>{label}</td>
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
