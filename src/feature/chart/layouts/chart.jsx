import { useEffect, useMemo, useRef, useState } from "react";
import { init, dispose } from "klinecharts/dist/index.esm.js";
import "../klinecharts/bbSignalIndicator";
import "../klinecharts/mcdxIndicator";
import "../klinecharts/signalMarkerOverlay";

// Toàn bộ chỉ báo built-in của KLineChart v9.
// pane: "candle_pane" = vẽ đè lên nến; "sub" = khung riêng bên dưới.
const ALL_INDICATORS = [
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
    return;
  }
  const pane = ALL_INDICATORS.find((i) => i.name === name)?.pane;
  if (pane === "candle_pane") {
    chart.createIndicator(name, true, { id: "candle_pane" });
  } else {
    chart.createIndicator(name, false); // pane riêng
  }
}

export default function TradingChart({ candles, signals, infoHeight = 0 }) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  // EMA bật sẵn như trước; còn lại tắt
  const [active, setActive] = useState({ EMA: true });

  // Khoá deps ổn định: danh sách chỉ báo đang bật, sắp xếp + nối chuỗi
  const activeKey = useMemo(
    () =>
      Object.keys(active)
        .filter((k) => active[k])
        .sort()
        .join(","),
    [active],
  );

  useEffect(() => {
    const container = containerRef.current;
    const chart = init(container);

    // ===== Theme tối cho biểu đồ (navy, grid mờ, trục chữ sáng) =====
    const AXIS_LINE = "rgba(255, 255, 255, 0.15)";
    const AXIS_TEXT = "#8d98b5";
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
        priceMark: {
          high: { color: AXIS_TEXT },
          low: { color: AXIS_TEXT },
        },
        tooltip: { showRule: "none" }, // ẩn dòng Time, Open, High, Low, Close, Volume
      },
      indicator: {
        tooltip: { showRule: "none" }, // ẩn dòng EMA(10,20,50), BOLL(20,2)...
      },
      xAxis: {
        axisLine: { color: AXIS_LINE },
        tickLine: { color: AXIS_LINE },
        tickText: { color: AXIS_TEXT },
      },
      yAxis: {
        axisLine: { color: AXIS_LINE },
        tickLine: { color: AXIS_LINE },
        tickText: { color: AXIS_TEXT },
      },
      separator: { color: AXIS_LINE },
      crosshair: {
        horizontal: {
          line: { color: "rgba(255, 255, 255, 0.3)" },
          text: { backgroundColor: "#2a3550", borderColor: "#2a3550" },
        },
        vertical: {
          line: { color: "rgba(255, 255, 255, 0.3)" },
          text: { backgroundColor: "#2a3550", borderColor: "#2a3550" },
        },
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

  const toggle = (name) => setActive((p) => ({ ...p, [name]: !p[name] }));

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `calc(100dvh - ${infoHeight}px)`,
      }}
    >
      {/* Bộ chọn chỉ báo — đẩy lên ngang hàng với panel info phía trên (đối xứng) */}
      <div
        style={{
          position: "absolute",
          top: `calc(20dvh - ${infoHeight}px)`,
          left: 8,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            fontSize: "0.8rem",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 6,
            background: "#111c38",
            color: "#e7ebf6",
            cursor: "pointer",
          }}
        >
          Chỉ báo ▾
        </button>
        {open && (
          <div
            style={{
              marginTop: 4,
              padding: "6px 4px",
              minWidth: 200,
              maxHeight: "60dvh",
              overflowY: "auto",
              background: "#111c38",
              color: "#e7ebf6",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
            }}
          >
            {ALL_INDICATORS.map((ind) => (
              <label
                key={ind.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!active[ind.name]}
                  onChange={() => toggle(ind.name)}
                />
                {ind.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "#0b1326" }}
      />
    </div>
  );
}
