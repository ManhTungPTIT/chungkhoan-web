import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  LineSeries,
  CandlestickSeries,
  HistogramSeries,
  LineStyle,
  createSeriesMarkers,
} from "lightweight-charts";
import { calcEMA, calcMACD } from "../../untils/indicators";
import { addBollingerBands } from "./bollingerBand";

export default function TradingChart({ candles, signals, infoHeight = 0 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: "#fff" }, textColor: "#555" },
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
      color: "#ff9800",
      lineWidth: 2,
    });
    ma20.setData(calcEMA(candles, 20));

    // Tín hiệu mua/bán
    createSeriesMarkers(
      candleSeries,
      signals.map((s) => ({
        time: s.time,
        position: s.type === "buy" ? "belowBar" : "aboveBar",
        color: s.type === "buy" ? "#1565C0" : "#C2185B",
        shape: s.type === "buy" ? "arrowUp" : "arrowDown",
        size: 1,
        text: `${s.type === "buy" ? "MUA" : "BÁN"} ${s.price}`,
      })),
    );

    // MACD(12,26,9) — pane 1
    const macd = calcMACD(candles);
    const macdHist = chart.addSeries(HistogramSeries, {}, 1);
    macdHist.setData(macd.histogram);
    const macdLine = chart.addSeries(
      LineSeries,
      { color: "#2962ff", lineWidth: 1 },
      1,
    );
    macdLine.setData(macd.macdLine);
    const macdSignal = chart.addSeries(
      LineSeries,
      { color: "#ff6d00", lineWidth: 1, lineStyle: LineStyle.Dashed },
      1,
    );
    macdSignal.setData(macd.signal);

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
      style={{ position: "relative", width: "100%", height: 600 }}
    />
  );
}
