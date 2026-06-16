import { useEffect, useRef } from "react";
import { init, dispose } from "klinecharts/dist/index.esm.js";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import "../klinecharts/signalMarkerOverlay";

export default function TradingChart({ candles, signals, infoHeight = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const chart = init(container);

    chart.setStyles({
      grid: {
        horizontal: { color: "#f0f0f0" },
        vertical: { color: "#f0f0f0" },
      },
      candle: {
        bar: {
          upColor: "#26a69a",
          downColor: "#ef5350",
          upBorderColor: "#26a69a",
          downBorderColor: "#ef5350",
          upWickColor: "#26a69a",
          downWickColor: "#ef5350",
        },
        tooltip: { showRule: "none" }, // ẩn dòng Time, Open, High, Low, Close, Volume
      },
      indicator: {
        tooltip: { showRule: "none" }, // ẩn dòng EMA(10,20,50), BOLL(20,2)...
      },
    });

    // API trả time unix giây → KLineChart cần timestamp ms; bỏ bản ghi hỏng
    const dataList = candles
      .filter((c) => typeof c.time === "number")
      .map((c) => ({
        timestamp: c.time * 1000,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
    chart.applyNewData(dataList);

    // EMA built-in 10/20/50 — thư viện tự tính, đè lên pane nến
    // styles.lines THAY THẾ toàn bộ default (không merge sâu) — phải đủ
    // style/smooth/size/dashedValue, thiếu dashedValue sẽ crash khi zoom
    // (thư viện đọc dashedValue[0] lúc gộp các đoạn line)
    chart.createIndicator(
      {
        name: "EMA",
        calcParams: [10, 20, 50],
        styles: {
          lines: ["blue", "purple", "red"].map((color) => ({
            style: "solid",
            smooth: false,
            size: 1,
            dashedValue: [2, 2],
            color,
          })),
        },
      },
      true,
      { id: "candle_pane" },
    );

    // Bollinger + fill xanh/đỏ theo tín hiệu — signals truyền qua extendData
    chart.createIndicator({ name: "BBS", extendData: signals }, true, {
      id: "candle_pane",
    });

    // MCDX — pane riêng bên dưới
    chart.createIndicator("MCDX", false);

    // Markers mua/bán
    signals.forEach((s) => {
      chart.createOverlay({
        name: "signalMarker",
        points: [{ timestamp: s.time * 1000, value: s.price }],
        extendData: s,
        lock: true,
      });
    });

    // KLineChart v9 không tự autoSize theo container
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      dispose(container);
    };
  }, [candles, signals]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `calc(100dvh - ${infoHeight}px)`,
        background: "#fff",
      }}
    />
  );
}
