import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  LineSeries,
  CandlestickSeries,
  HistogramSeries,
  createSeriesMarkers,
} from "lightweight-charts";
import { calcEMA, calcMCDX } from "../untils/indicators";
import { addBollingerBands } from "./bollingerBand";

export default function TradingChart({ candles, signals, infoHeight = 0 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: "#fff" }, textColor: "#555" },
      // Giữ nguyên thứ tự vẽ khi hover — nếu không, cột nền xanh MCDX (value 20)
      // sẽ bị kéo lên trên cùng và che mất cột đỏ/vàng
      hoveredSeriesOnTop: false,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
    });
    chartRef.current = chart;

    // Candlestick
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
    });
    candleSeries.setData(candles);

    //Bollinger Band
    const bb = addBollingerBands(
      chart,
      containerRef.current,
      candles,
      signals,
      {
        buyFillColor: "rgba(38,166,154,0.18)",
        sellFillColor: "rgba(239,83,80,0.18)",
      },
    );

    // MA20
    const ma20 = chart.addSeries(LineSeries, {
      color: "purple",
      lineWidth: 2,
    });
    ma20.setData(calcEMA(candles, 20));

    //MA10
    const ma10 = chart.addSeries(LineSeries, {
      color: "blue",
      lineWidth: 2,
    });
    ma10.setData(calcEMA(candles, 10));

    //ma50
    const ma50 = chart.addSeries(LineSeries, {
      color: "red",
      lineWidth: 2,
    });
    ma50.setData(calcEMA(candles, 50));

    // Tín hiệu mua/bán
    createSeriesMarkers(
      candleSeries,
      signals.map((s) => ({
        time: s.time,
        position: s.type === "buy" ? "belowBar" : "aboveBar",
        color: s.type === "buy" ? "#1565C0" : "#C2185B",
        shape: s.type === "buy" ? "arrowUp" : "arrowDown",
        size: 1,
        text: `${s.type === "buy" ? "XANH" : "ĐỎ"} ${s.price}`,
      })),
    );

    // MCDX — pane 1, thang 0–20: nền xanh 20 → Hot Money vàng → Banker đỏ/cam
    // Các histogram đều vẽ từ 0, series sau đè lên series trước
    const mcdx = calcMCDX(candles);
    const mcdxRetail = chart.addSeries(HistogramSeries, {}, 1);
    mcdxRetail.setData(mcdx.retail);
    const mcdxHot = chart.addSeries(HistogramSeries, {}, 1);
    mcdxHot.setData(mcdx.hotMoney);
    const mcdxBanker = chart.addSeries(HistogramSeries, {}, 1);
    mcdxBanker.setData(mcdx.banker);
    // Đường Cá Mập (EMA của Banker)
    const mcdxShark = chart.addSeries(
      LineSeries,
      { color: "#1E88E5", lineWidth: 2 },
      1,
    );
    mcdxShark.setData(mcdx.sharkLine);

    chart.timeScale().fitContent();
    chart.timeScale().applyOptions({ barSpacing: 5 });

    return () => {
      bb.cleanup();
      chart.remove();
    };
  }, [candles, signals]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `calc(100vh - ${infoHeight}px)`,
      }}
    />
  );
}
