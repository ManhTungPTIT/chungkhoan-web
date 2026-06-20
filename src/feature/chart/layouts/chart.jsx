import { useEffect, useRef } from "react";
import { init, dispose } from "klinecharts/dist/index.esm.js";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import "../klinecharts/signalMarkerOverlay";

// Toàn bộ chỉ báo built-in của KLineChart v9.
// pane: "candle_pane" = vẽ đè lên nến; "sub" = khung riêng bên dưới.
export const ALL_INDICATORS = [
  // --- Vẽ đè lên nến ---
  { name: "MA", label: "MA — Trung bình động", pane: "candle_pane" },
  { name: "EMA", label: "EMA — TB động luỹ thừa", pane: "candle_pane" },
  { name: "SMA", label: "SMA — TB động giản đơn", pane: "candle_pane" },
  { name: "BBI", label: "BBI — Bull & Bear Index", pane: "candle_pane" },
  { name: "BOLL", label: "BOLL — Bollinger Bands", pane: "candle_pane" },
  { name: "SAR", label: "SAR — Parabolic SAR", pane: "candle_pane" },
  { name: "AVP", label: "AVP — Giá bình quân", pane: "candle_pane" },
  // --- Khung riêng bên dưới ---
  { name: "VOL", label: "VOL — Khối lượng", pane: "sub" },
  { name: "MACD", label: "MACD", pane: "sub" },
  { name: "KDJ", label: "KDJ — Stochastic", pane: "sub" },
  { name: "RSI", label: "RSI", pane: "sub" },
  { name: "BIAS", label: "BIAS — Độ lệch", pane: "sub" },
  { name: "BRAR", label: "BRAR", pane: "sub" },
  { name: "CCI", label: "CCI", pane: "sub" },
  { name: "DMI", label: "DMI", pane: "sub" },
  { name: "CR", label: "CR", pane: "sub" },
  { name: "PSY", label: "PSY — Psychological Line", pane: "sub" },
  { name: "DMA", label: "DMA", pane: "sub" },
  { name: "TRIX", label: "TRIX", pane: "sub" },
  { name: "OBV", label: "OBV", pane: "sub" },
  { name: "VR", label: "VR — Volume Ratio", pane: "sub" },
  { name: "WR", label: "WR — Williams %R", pane: "sub" },
  { name: "MTM", label: "MTM — Momentum", pane: "sub" },
  { name: "ROC", label: "ROC", pane: "sub" },
  { name: "EMV", label: "EMV", pane: "sub" },
  { name: "PVT", label: "PVT", pane: "sub" },
  { name: "AO", label: "AO — Awesome Oscillator", pane: "sub" },
];

// Tạo 1 chỉ báo trên chart (EMA dùng cấu hình màu riêng cũ).
function addIndicator(chart, name) {
  if (name === "EMA") {
    // styles.lines THAY THẾ toàn bộ default — phải đủ style/smooth/size/dashedValue,
    // thiếu dashedValue sẽ crash khi zoom.
    chart.createIndicator(
      {
        name: "EMA",
        calcParams: [10, 20],
        styles: {
          lines: ["blue", "purple"].map((color) => ({
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
    return;
  }
  const pane = ALL_INDICATORS.find((i) => i.name === name)?.pane;
  if (pane === "candle_pane") {
    chart.createIndicator(name, true, { id: "candle_pane" });
  } else {
    chart.createIndicator(name, false); // pane riêng
  }
}

// activeKey: chuỗi tên chỉ báo đang bật (do TradingView truyền xuống).
export default function TradingChart({
  candles,
  signals,
  infoHeight = 0,
  activeKey = "",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const chart = init(container);

    chart.setStyles({
      grid: {
        show: false, // bỏ đường kẻ lưới trong đồ thị
        horizontal: { show: false },
        vertical: { show: false },
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

    // Chỉ báo do người dùng chọn
    activeKey
      .split(",")
      .filter(Boolean)
      .forEach((name) => addIndicator(chart, name));

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
  }, [candles, signals, activeKey]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `calc(100dvh - ${infoHeight}px)`,
        background: "#fff",
        // Để cử chỉ chạm (pinch-zoom / kéo) đi vào chart thay vì bị trình duyệt
        // mobile xử lý thành zoom/cuộn trang → mới zoom được trên điện thoại.
        touchAction: "none",
      }}
    />
  );
}
