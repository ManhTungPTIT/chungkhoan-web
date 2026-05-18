import "./index.scss";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import TradingChart from "../chart/layouts/chart";
import { generateSignals } from "./untils/indicators";
import Panel from "../chart/layouts/panel";
function TradingView() {
  const [candles, setCandles] = useState([]);
  const [openPanel, setOpenPanel] = useState(false);
  const [dataPanel, setDataPanel] = useState([]);
  const [chanelCode, setChaneCode] = useState("VNINDEX");

  useEffect(() => {
    const fetchCandles = () => {
      axios
        .get("http://localhost:8000/intraday", {
          params: { symbol: chanelCode || "VNINDEX" },
        })
        .then((response) => {
          console.log(response.data.data);
          const res = Object.values(response.data.data);
          const arr = res.map((item) => ({
            ...item,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          }));
          setCandles(arr);
        })
        .catch((error) => {
          console.error(error);
        });
    };

    fetchCandles();
    const interval = setInterval(fetchCandles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [chanelCode]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/vn100")
      .then((response) => {
        setDataPanel(Object.values(response.data.data));
      })
      .catch((error) => {});
  }, []);

  const signals = generateSignals(candles);
  const infoRef = useRef(null);
  const [infoHeight, setInfoHeight] = useState(0);

  useEffect(() => {
    if (!infoRef.current) return;
    const ro = new ResizeObserver(() => {
      setInfoHeight(infoRef.current.offsetHeight);
    });
    ro.observe(infoRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          borderInline: "1px solid var(--border)",
        }}
      >
        <div
          ref={infoRef}
          className="information"
          style={{
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "start",
            margin: "0",
          }}
        >
          <h1 style={{ color: "purple", margin: "0.4rem" }}>{chanelCode}</h1>
          <div style={{ display: "flex", fontSize: "0.6rem" }}>
            Quy tắc giao dịch:<p style={{ color: "green" }}>Xanh vào</p>-
            <p style={{ color: "red" }}> Đỏ ra</p>
          </div>
          <div style={{ display: "flex", gap: "2rem", fontSize: "0.8rem" }}>
            <p style={{ color: "blue" }}>Mua quanh giá: 140 </p>
            <p style={{ color: "purple " }}>Ngày mua: 03/04/2026</p>
          </div>

          <p style={{ color: "blue", fontSize: "0.8rem" }}>
            (Kết quả: Đã lãi 62.92% | Đã nắm giữ +23 phiên)
          </p>

          <div style={{ display: "flex", gap: "2rem", fontSize: "0.6rem" }}>
            <p style={{ color: "red" }}>Giá chốt lãi/Cắt lỗ: 198.3</p>
            <p>Mục tiêu dự kiến: 168 | 196 | 252</p>
          </div>
          <h2
            style={{ color: "purple ", marginBottom: "0", fontSize: "0.8rem" }}
          >
            Giá hiện tại 228.1
          </h2>
          <p style={{ color: "green ", fontSize: "0.6rem" }}>
            Khuyến nghị: Vùng xanh, tiếp tục nắm giữ
          </p>
        </div>
        <TradingChart
          candles={candles}
          signals={signals}
          infoHeight={infoHeight}
        />
      </div>
      <Panel
        dataPanel={dataPanel}
        onSelectSymbol={(symbol) => setChaneCode(symbol)}
      />
    </div>
  );
}

export default TradingView;
