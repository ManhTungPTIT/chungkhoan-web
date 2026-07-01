import "./index.scss";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FiCalendar, FiTarget } from "react-icons/fi";
import { PiFunnel } from "react-icons/pi";
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

const COLOR_CODE_BUY = { action: "Xanh", color: "#2563eb" };
const COLOR_CODE_SELL = { action: "Đỏ", color: "#e11d48" };

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

  const {
    data: candles = [],
    isFetching,
    isPlaceholderData,
  } = useIntraday(chanelCode, activeTimeline);
  // Chỉ hiện overlay khi biểu đồ CHƯA phải data của mã đang chọn:
  // - đang hiện nến mã cũ trong lúc tải mã mới (isPlaceholderData), hoặc
  // - lần đầu mở, chưa có nến nào (candles.length === 0).
  // Mã đã cache (xem lại trong 5') → isFetching=false → không hiện overlay.
  const isLoadingSymbol = isFetching && (isPlaceholderData || candles.length === 0);
  const { data: dataPanel = [] } = useVn100();
  // BOT chọn ở sidebar: /?bot=t (T+), /?bot=long (Dài hạn), mặc định trend.
  // useMemo giữ reference 'signals' ổn định: nếu tính inline mỗi render sẽ tạo
  // mảng mới → useEffect khởi tạo chart (deps có signals) chạy lại → dispose()+
  // init() xoá sạch overlay đang vẽ. Chỉ đổi khi candles hoặc bot thay đổi.
  const bot = searchParams.get("bot");
  const signals = useMemo(() => {
    const generateSignalsFor = SIGNAL_GENERATORS[bot] ?? generateSignals;
    return generateSignalsFor(candles);
  }, [candles, bot]);
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
  const isBuySignal = COLORCODE.action === "Xanh";

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
         
        }}
      >
        <div
          ref={infoRef}
          className="information"
          style={{
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            margin: "0",
          }}
        >
          <div className="information__toolbar">
            <TimelineStock
              activeTimeline={activeTimeline}
              onSelect={onSelectTimeline}
            />
            <button
              type="button"
              className="draw-tool-trigger"
              onClick={() => setShowDrawBar((v) => !v)}
              data-active={showDrawBar ? "true" : "false"}
            >
              ✏ Công cụ
            </button>
            <IndicatorPicker
              active={activeIndicators}
              configs={indicatorConfigs}
              onToggle={toggleIndicator}
              onSaveConfig={saveIndicatorConfig}
            />
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
          </div>
          <section
            className={`signal-card signal-card--${isBuySignal ? "buy" : "sell"}`}
            style={{ "--signal-color": COLORCODE.color }}
          >
            <div className="signal-card__body">
              <div className="signal-card__main">
                <div className="signal-card__row signal-card__row--top">
                  <div className="signal-card__brand">
                    <h1 className="information__symbol" translate="no">
                      {chanelCode}
                    </h1>
                    <p>
                      <span>Xanh vào</span>
                      <span>- Đỏ ra</span>
                    </p>
                  </div>
                  <span className="signal-card__dot" aria-hidden="true" />
                  <div className="signal-card__metric">
                    <span>Giá chuyển {COLORCODE.action}</span>
                    <strong>{priceChange}</strong>
                  </div>
                  <div className="signal-card__metric">
                    <span>Giá hiện tại</span>
                    <strong>{priceCurrent}</strong>
                  </div>
                  <div className="signal-card__metric">
                    <span>Chốt lãi / Cắt lỗ</span>
                    <strong>{priceTarget}</strong>
                  </div>
                </div>

                <div className="signal-card__row signal-card__row--bottom">
                  <div className="signal-card__metric signal-card__metric--icon">
                    <FiCalendar aria-hidden="true" />
                    <span>Ngày chuyển {COLORCODE.action}</span>
                    <strong>{dayChangeConvert}</strong>
                  </div>
                  <div className="signal-card__metric signal-card__metric--icon">
                    <FiCalendar aria-hidden="true" />
                    <span>Ngày hiện tại</span>
                    <strong>{dayCurrent}</strong>
                  </div>
                  <div className="signal-card__metric signal-card__metric--icon signal-card__metric--targets">
                    <FiTarget aria-hidden="true" />
                    <span>Mục tiêu dự kiến</span>
                    <strong>
                      {target1} | {target2} | {target3}
                    </strong>
                  </div>
                </div>
              </div>

              <aside
                className="signal-card__summary"
                style={{ "--color-signal": COLORCODE.color }}
              >
                <span>{isBuySignal ? "Đã tăng" : "Tránh giảm"}</span>
                <strong>{pricePct}</strong>
                <span>Vùng</span>
                <strong>{COLORCODE.action}</strong>
                <span>{isBuySignal ? "Nắm giữ" : "Đứng ngoài"}</span>
                <strong>{dayCount} phiên</strong>
              </aside>
            </div>
          </section>
        </div>
        <TradingChart
          candles={candles}
          signals={signals}
          infoHeight={infoHeight}
          activeKey={activeKey}
          showDraw={showDrawBar}
          indicatorConfigs={indicatorConfigs}
        />
        {isLoadingSymbol && (
          <div className="chart-loading" role="status" aria-live="polite">
            <span className="chart-loading__spinner" aria-hidden="true" />
            <span className="chart-loading__text">Đang tải {chanelCode}…</span>
          </div>
        )}
      </div>
      <div className="container_panel">
        
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
