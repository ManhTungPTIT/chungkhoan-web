import "./panel.scss";

function Panel({ dataPanel = [], onSelectSymbol }) {
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
      <tbody>
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
