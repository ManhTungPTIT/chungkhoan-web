import "./index.scss";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PiFunnel } from "react-icons/pi";
import { TbMathFunction } from "react-icons/tb";
import TradingChart from "../chart/layouts/chart";
import IndicatorPicker from "../chart/layouts/IndicatorPicker";
import TimelineStock from "../chart/layouts/TimelineStock";
import {
  generateSignals,
  generateSignalsT,
  generateSignalsLong,
} from "./untils/indicators";
import {
  loadIndicatorState,
  normalizeIndicatorConfigs,
  saveIndicatorState,
} from "./untils/indicatorSettings";

// Chọn hàm sinh tín hiệu theo BOT trên sidebar (qua /?bot=...)
const SIGNAL_GENERATORS = {
  trend: generateSignals, // BOT Trend (mặc định)
  t: generateSignalsT, // BOT T+
  long: generateSignalsLong, // BOT Dài hạn
};
import Panel from "../chart/layouts/panel";
import { useIntraday } from "./hooks/useIntraday";
import { useVn100 } from "./hooks/useVn100";

const COLOR_CODE_BUY = { action: "Xanh", color: "blue" };
const COLOR_CODE_SELL = { action: "Đỏ", color: "red" };

// Nhận Date hoặc chuỗi ngày ("2026-02-23 07:00"); giá trị không parse được
// (vd "--" khi chưa có signal) trả về nguyên văn thay vì crash render
const convertDay = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

// Đếm số phiên giao dịch từ ngày giá chuyển tín hiệu đến hôm nay.
// Tính cả hai mốc đầu/cuối; bỏ qua thứ Bảy (6) và Chủ Nhật (0) vì
// thị trường nghỉ. Trả về "--" nếu ngày không hợp lệ (chưa có signal).
const countTradingSessions = (from, to) => {
  const start = from instanceof Date ? from : new Date(from);
  const end = to instanceof Date ? to : new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "--";

  // Chuẩn hoá về 00:00 để đếm theo ngày, không phụ thuộc giờ
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let count = 0;
  while (cur <= last) {
    const dow = cur.getDay(); // 0 = Chủ Nhật, 6 = thứ Bảy
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

function TradingView() {
  const [openPanel, setOpenPanel] = useState(false);
  // Cho phép mở thẳng một mã qua /?symbol=XXX (vd click từ bản đồ nhiệt);
  // không có param thì giữ mặc định VNINDEX.
  const [searchParams] = useSearchParams();
  const [chanelCode, setChaneCode] = useState(
    () => searchParams.get("symbol")?.toUpperCase() || "VNINDEX",
  );

  //Khung thời gian; mặc định là khung 1 ngày (single-select)
  const [activeTimeline, setActiveTimeline] = useState("1d");
  const onSelectTimeline = (name) => setActiveTimeline(name);

  const { data: candles = [] } = useIntraday(chanelCode, activeTimeline);
  const { data: dataPanel = [] } = useVn100();
  // BOT chọn ở sidebar: /?bot=t (T+), /?bot=long (Dài hạn), mặc định trend
  const generateSignalsFor =
    SIGNAL_GENERATORS[searchParams.get("bot")] ?? generateSignals;
  const signals = generateSignalsFor(candles);
  const infoRef = useRef(null);
  const [infoHeight, setInfoHeight] = useState(0);

  // Chỉ báo: EMA + Volume bật sẵn; chuỗi activeKey truyền xuống chart để vẽ.
  // VOL hiển thị ở pane dưới (thay MCDX cũ); MCDX nay thêm tùy ý qua picker.
  const [indicatorState, setIndicatorState] = useState(() =>
    loadIndicatorState(),
  );
  const activeIndicators = indicatorState.active;
  const indicatorConfigs = indicatorState.configs;
  const toggleIndicator = (name) =>
    setIndicatorState((prev) => ({
      active: { ...prev.active, [name]: !prev.active[name] },
      configs: prev.configs,
    }));
  const saveIndicatorConfig = (name, config) => {
    setIndicatorState((prev) => ({
      active: prev.active,
      configs: normalizeIndicatorConfigs({
        ...prev.configs,
        [name]: { ...prev.configs[name], ...config },
      }),
    }));
  };

  useEffect(() => {
    saveIndicatorState(activeIndicators, indicatorConfigs);
  }, [activeIndicators, indicatorConfigs]);

  // Bật/tắt thanh công cụ vẽ (truyền xuống chart)
  const [showDrawBar, setShowDrawBar] = useState(false);

  // Bấm ra ngoài nút "Công cụ" và thanh vẽ (.draw-toolbar) → ẩn thanh vẽ.
  // pointerdown để bắt cả chuột lẫn chạm; closest theo class nên không cần ref
  // tới thanh vẽ đang nằm trong chart.jsx.
  useEffect(() => {
    if (!showDrawBar) return;
    const onPointerDown = (e) => {
      if (
        e.target.closest(".draw-tool-trigger") ||
        e.target.closest(".draw-toolbar")
      )
        return;
      setShowDrawBar(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showDrawBar]);
  const activeKey = useMemo(
    () =>
      Object.keys(activeIndicators)
        .filter((k) => activeIndicators[k])
        .sort()
        .join(","),
    [activeIndicators],
  );

  useEffect(() => {
    if (!infoRef.current) return;
    const ro = new ResizeObserver(() => {
      setInfoHeight(infoRef.current.offsetHeight);
    });
    ro.observe(infoRef.current);
    return () => ro.disconnect();
  }, []);

  const today = new Date();
  const dayCurrent = convertDay(today);

  //Lay gia va ngay tai diem signal cuoi cung (co the chua co khi data dang tai)
  const lastSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const priceChange = lastSignal ? lastSignal.price : "--";
  const priceTarget = lastSignal ? lastSignal.priceTarget : "--";
  const dayChange = lastSignal ? lastSignal.date : "--";
  const dayChangeConvert = convertDay(dayChange);
  const COLORCODE =
    lastSignal && lastSignal.type === "buy" ? COLOR_CODE_BUY : COLOR_CODE_SELL;

  const priceCurrent =
    candles.length > 0 ? candles[candles.length - 1].close : "--";

  //Goi y nam giu
  const pricePct =
    (((priceCurrent - priceChange) / priceChange) * 100).toFixed(2) + "%";
  const dayCount = countTradingSessions(dayChange, today);
  const target1 = (priceChange * 1.2).toFixed(2);
  const target2 = (priceChange * 1.4).toFixed(2);
  const target3 = (priceChange * 1.8).toFixed(2);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        height: "100dvh",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
        marginLeft: "0.1rem",
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
            alignItems: "end",
            margin: "0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <TimelineStock
              activeTimeline={activeTimeline}
              onSelect={onSelectTimeline}
            />
            <button
              type="button"
              className="draw-tool-trigger"
              onClick={() => setShowDrawBar((v) => !v)}
              style={{
                padding: "4px 10px",
                fontSize: "0.8rem",
                border: "1px solid var(--border, #d6dae3)",
                borderRadius: 6,
                background: showDrawBar ? "#eef2ff" : "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✏ Công cụ
            </button>
            <IndicatorPicker
              active={activeIndicators}
              configs={indicatorConfigs}
              onToggle={toggleIndicator}
              onSaveConfig={saveIndicatorConfig}
            />

            <h1 translate="no" style={{ color: "purple", margin: "0.4rem" }}>
              {chanelCode}
            </h1>
          </div>
          <div style={{ display: "flex", fontSize: "0.6rem" }}>
            Quy tắc giao dịch:<p style={{ color: "green" }}>Xanh vào</p>-
            <p style={{ color: "red" }}> Đỏ ra</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "1rem" }}>
            <p style={{ color: COLORCODE.color }}>
              Giá chuyển {COLORCODE.action}: {priceChange}
            </p>
            <p style={{ color: COLORCODE.color }}>
              Ngày chuyển {COLORCODE.action}: {dayChangeConvert}
            </p>
          </div>
          <div
            style={{
              color: "#B36AAA",
              fontSize: "0.7rem",
              display: "flex",
              gap: "1rem",
            }}
          >
            <p>Giá hiện tại: {priceCurrent}</p>
            <p>Ngày HIỆN TẠI: {dayCurrent}</p>
          </div>

          {COLORCODE.action === "Xanh" ? (
            <div>
              <div style={{ display: "flex", gap: "2rem", fontSize: "0.6rem" }}>
                <p style={{ color: COLORCODE.color }}>
                  Giá chốt lãi/Cắt lỗ: {priceTarget}
                </p>
                <p>
                  Mục tiêu dự kiến: {target1} | {target2} | {target3}
                </p>
              </div>
              <p style={{ color: COLORCODE.color, fontSize: "0.6rem" }}>
                (Đã Tăng {pricePct} | Vùng Xanh, nắm giữ {dayCount} phiên)
              </p>
            </div>
          ) : (
            <p style={{ color: COLORCODE.color, fontSize: "0.6rem" }}>
              (Tránh Giảm {pricePct} | Vùng Đỏ đã đứng ngoài {dayCount} phiên)
            </p>
          )}
        </div>
        <TradingChart
          candles={candles}
          signals={signals}
          infoHeight={infoHeight}
          activeKey={activeKey}
          showDraw={showDrawBar}
          indicatorConfigs={indicatorConfigs}
        />
      </div>
      <div className="container_panel">
        <button
          className={`btPanel ${openPanel ? "" : "btPanelHidden"}`}
          onClick={() => setOpenPanel((v) => !v)}
        >
          {/* Định nghĩa gradient để tô màu cho icon SVG */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b3df5" />
              </linearGradient>
            </defs>
          </svg>
          <PiFunnel className="btPanel__icon" />
          <span className="btPanel__divider" />
          <span className="btPanel__text">Bộ lọc</span>
        </button>
        <div className={`panel-slide ${openPanel ? "is-open" : ""}`}>
          <Panel
            dataPanel={dataPanel}
            onSelectSymbol={(symbol) => setChaneCode(symbol)}
          />
        </div>
      </div>
    </div>
  );
}

export default TradingView;
