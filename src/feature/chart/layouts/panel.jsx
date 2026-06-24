import { useRef, useCallback, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import "../styles/panel.scss";
import { signalDisplay } from "../untils/signalDisplay";

function Panel({ dataPanel = [], onSelectSymbol }) {
  const tbodyRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  console.log(dataPanel)

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
      <tbody ref={tbodyRef} onScroll={handleScroll}>
        {dataPanel.map((item, index) => {
          // Chỉ hiển thị tín hiệu THẬT từ backend (item.signal). Mã chưa có
          // tín hiệu → "—" trung tính, không đoán theo change_pct.
          const sig = signalDisplay(item.signal);
          const isPositive = Number(item.change_pct) >= 0;
          return (
            <tr key={item.symbol ?? index}>
              <td className="code" onClick={() => onSelectSymbol(item.symbol)}>
                {item.symbol}
              </td>
              <td className={sig.className}>
              {item.signal === "buy" && Number(item.signal_sessions) > 0 ? "NẮM GIỮ" : (
                item.signal === "sell" && Number(item.signal_sessions) > 0
                ? "Ở NGOÀI" : sig.label
              )
              }
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
