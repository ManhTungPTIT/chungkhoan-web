import axios from "axios";
import { useState } from "react";
import TradingChart from "./chart";
import { generateSignals } from "./indicators";

export default function App() {
  const [candles, setCandles] = useState([]);
  const [openPanel, setOpenPanel] = useState(false);


  axios
    .get("http://localhost:8000/intraday", {
      params: { symbol: "TCB" },
    })
    .then((response) => {
      const res = Object.values(response.data.data);
      const arr = res.map((item) => ({
        ...item,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }));
      console.log(arr);
      setCandles(arr);
    })
    .catch((error) => {
      console.error(error);
    });

  const signals = generateSignals(candles);

  return (
    <div>
      <h2 style={{ fontFamily: "sans-serif", marginBottom: 12 }}>
        Trading Chart
      </h2>
      <TradingChart candles={candles} signals={signals} />
      <div>
        <button className={openPanel ? "showButton" : "hideButton"} onClick={() => setOpenPanel(!openPanel)}>Bộ lọc</button>
      </div>
    </div>
  );
}
