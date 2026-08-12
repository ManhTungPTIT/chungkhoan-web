import "./index.scss";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FiCalendar, FiSearch, FiTarget } from "react-icons/fi";
import { PiFunnel } from "react-icons/pi";
import TradingChart from "../chart/layouts/chart";
import DataStatusBanner from "../chart/layouts/DataStatusBanner";
import IndicatorPicker from "../chart/layouts/IndicatorPicker";
import TimelineStock from "../chart/layouts/TimelineStock";
import { useSelectedBot } from "./hooks/useSelectedBot";
import {
  mergeBotSignals,
  signalGeneratorForBot,
  usesBackendPanelSignal,
} from "./untils/botSignals";
import { useBotSignals } from "./hooks/useBotSignals";
import {
  loadIndicatorState,
  normalizeIndicatorConfigs,
  saveIndicatorState,
} from "./untils/indicatorSettings";
import Panel from "../chart/layouts/panel";
import { useIntraday } from "./hooks/useIntraday";
import { useQuoteStream } from "./hooks/useQuoteStream";
import { useLiveCandles } from "./hooks/useLiveCandles";
import { useQuoteConnectionStatus } from "./hooks/useQuoteConnectionStatus";
import { useVn100 } from "./hooks/useVn100";
import { color } from "echarts";

const COLOR_CODE_BUY = { action: "Xanh", color: "#2563eb" };
const COLOR_CODE_SELL = { action: "Đỏ", color: "#e11d48" };

const signalTypeFromBackend = (signal) => {
  if (signal === "buy" || signal === "sell") return signal;
  return null;
};

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
  const [searchParams, setSearchParams] = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol")?.trim().toUpperCase();
  const [chanelCode, setChaneCode] = useState(() => symbolFromUrl || "VNINDEX");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const symbolSearchRef = useRef(null);
  const symbolSearchFormRef = useRef(null);

  useEffect(() => {
    const nextSymbol = symbolFromUrl || "VNINDEX";
    setChaneCode((current) => (current === nextSymbol ? current : nextSymbol));

    if (!symbolFromUrl) {
      setSymbolSearch("");
      setShowSymbolSearch(false);
      setOpenPanel(false);
    }
  }, [symbolFromUrl]);

  const selectSymbol = (symbol) => {
    const nextSymbol = String(symbol ?? "").trim().toUpperCase();
    if (!nextSymbol) return;
    setChaneCode(nextSymbol);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("symbol", nextSymbol);
      return next;
    });
  };

  //Khung thời gian; mặc định là khung 1 ngày (single-select)
  const [activeTimeline, setActiveTimeline] = useState("1d");
  const onSelectTimeline = (name) => setActiveTimeline(name);

  const handleSymbolSearch = (e) => {
    e.preventDefault();
    if (!showSymbolSearch) {
      setShowSymbolSearch(true);
      setTimeout(() => symbolSearchRef.current?.focus(), 0);
      return;
    }
    const symbol = symbolSearch.trim().toUpperCase();
    if (!symbol) {
      setSymbolSearch("");
      setShowSymbolSearch(false);
      return;
    }
    selectSymbol(symbol);
    setOpenPanel(true);
    setSymbolSearch("");
    setShowSymbolSearch(false);
  };

  useEffect(() => {
    if (!showSymbolSearch) return;
    const onPointerDown = (event) => {
      if (symbolSearchFormRef.current?.contains(event.target)) return;
      if (symbolSearch.trim()) return;
      setShowSymbolSearch(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showSymbolSearch, symbolSearch]);
  const {
    data: historyCandles,
    isFetching,
    isPlaceholderData,
    isError: isHistoryError,
  } = useIntraday(chanelCode, activeTimeline);
  // Giá realtime CHỈ từ WS /ws/quotes (tick tức thì) — không còn REST poll
  // dự phòng: WS (DNSE v2) đã ổn định, poll chỉ còn là gọi API thừa mỗi 5s.
  // Đang hiện nến placeholder của mã CŨ thì không merge giá mã mới vào.
  const streamQuote = useQuoteStream(chanelCode);
  const liveQuote = isPlaceholderData ? null : streamQuote;
  // true khi WS mất kết nối LIÊN TỤC ≥5s (debounce) — báo banner lỗi mà
  // không nhấp nháy theo mỗi lần backoff reconnect bình thường.
  const isQuoteDisconnected = useQuoteConnectionStatus();
  const candles = useLiveCandles(
    historyCandles,
    liveQuote,
    chanelCode,
    activeTimeline,
  );
  // Chỉ hiện overlay khi biểu đồ CHƯA phải data của mã đang chọn:
  // - đang hiện nến mã cũ trong lúc tải mã mới (isPlaceholderData), hoặc
  // - lần đầu mở, chưa có nến nào (candles.length === 0).
  // Mã đã cache (xem lại trong 5') → isFetching=false → không hiện overlay.
  const isLoadingSymbol =
    isFetching && (isPlaceholderData || candles.length === 0);
  // BOT chọn ở sidebar (web) hoặc nút trong thanh công cụ (app): /?bot=t (T+),
  // /?bot=long (Dài hạn), mặc định trend. Việc đọc URL + đắp `?bot=` khi thiếu
  // nằm trong useSelectedBot — trang bộ lọc dùng CHUNG hook đó.
  const bot = useSelectedBot();

  const { data: dataPanel = [] } = useVn100();
  // /vn100 chỉ mang tín hiệu của BOT Trend. Không đắp lớp phủ thì đổi sang T+ /
  // Dài hạn mà CẢ BẢNG panel vẫn là số của Trend — cùng lỗi đã sửa ở trang bộ
  // lọc. Trend thì hook không gọi mạng và merge trả nguyên mảng.
  const { data: botOverlay } = useBotSignals(bot);
  const panelRows = useMemo(
    () => mergeBotSignals(Array.isArray(dataPanel) ? dataPanel : [], botOverlay, bot),
    [dataPanel, botOverlay, bot],
  );

  const selectedPanelRow = useMemo(
    () =>
      panelRows.find(
        (item) =>
          String(item?.symbol ?? "").toUpperCase() ===
          String(chanelCode ?? "").toUpperCase(),
      ) ?? null,
    [panelRows, chanelCode],
  );

  // useMemo giữ reference 'signals' ổn định: nếu tính inline mỗi render sẽ tạo
  // mảng mới → useEffect khởi tạo chart (deps có signals) chạy lại → dispose()+
  // init() xoá sạch overlay đang vẽ. Chỉ đổi khi candles hoặc bot thay đổi.
  const signals = useMemo(() => signalGeneratorForBot(bot)(candles), [candles, bot]);
  const infoRef = useRef(null);
  const [infoHeight, setInfoHeight] = useState(0);

  // Chỉ báo: khách mới thấy MA(10,20) + MCDX (xem DEFAULT_ACTIVE_INDICATORS);
  // khách đã có dữ liệu lưu thì giữ nguyên bộ của họ. Chuỗi activeKey truyền
  // xuống chart để vẽ.
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
  // Panel /vn100 chỉ có tín hiệu của BOT Trend (xem usesBackendPanelSignal).
  // BOT T+/Dài hạn phải đọc `lastSignal` do FE tự tính, không thì đổi bot mà
  // giá/ngày/số phiên trên thẻ đứng yên ở số của BOT Trend.
  const backendSignalType = usesBackendPanelSignal(bot)
    ? signalTypeFromBackend(selectedPanelRow?.signal)
    : null;
    
  const signalType = backendSignalType ?? lastSignal?.type;
  const priceChange =
    backendSignalType && selectedPanelRow?.signal_price != null
      ? selectedPanelRow.signal_price
      : lastSignal
        ? lastSignal.price
        : "--";
  // Làm tròn ở CHỖ HIỂN THỊ, generator vẫn trả số thô: MA20/MA10 ra số lẻ rất
  // dài (40.233333333333334) chứ không sạch như giá đóng cửa.
  //
  // Kiểm tra bằng Number.isFinite thay vì `lastSignal ? ... : "--"` cũ: nhánh
  // SELL không đẩy `priceTarget`, nên khi backend báo "buy" mà tín hiệu cuối FE
  // tính ra là sell thì ô này từng render RỖNG TRƠN thay vì "--".
  const priceTarget = Number.isFinite(Number(lastSignal?.priceTarget))
    ? Number(lastSignal.priceTarget).toFixed(2)
    : "--";
  const dayChange =
    backendSignalType && selectedPanelRow?.signal_date
      ? selectedPanelRow.signal_date
      : lastSignal
        ? lastSignal.date
        : "--";
  const dayChangeConvert = convertDay(dayChange);
  const COLORCODE = signalType === "buy" ? COLOR_CODE_BUY : COLOR_CODE_SELL;
  const isBuySignal = COLORCODE.action === "Xanh";

  const priceCurrent =
    candles.length > 0 ? candles[candles.length - 1].close : "--";
  const hasNumericSignalPrice =
    Number.isFinite(Number(priceChange)) && Number(priceChange) !== 0;
  const hasNumericCurrentPrice = Number.isFinite(Number(priceCurrent));

  //Goi y nam giu
  const pricePct =
    hasNumericSignalPrice && hasNumericCurrentPrice
      ? (((Number(priceCurrent) - Number(priceChange)) / Number(priceChange)) * 100).toFixed(2) + "%"
      : "--";
  const dayCount =
    backendSignalType && selectedPanelRow?.signal_sessions != null
      ? selectedPanelRow.signal_sessions
      : countTradingSessions(dayChange, today);
  // Mua: muc tieu tang; Ban: vung day du kien
  const target1 = hasNumericSignalPrice
    ? (isBuySignal ? Number(priceChange) * 1.2 : Number(priceChange) / 1.2).toFixed(2)
    : "--";
  const target2 = hasNumericSignalPrice
    ? (isBuySignal ? Number(priceChange) * 1.4 : Number(priceChange) / 1.4).toFixed(2)
    : "--";
  const target3 = hasNumericSignalPrice
    ? (isBuySignal ? Number(priceChange) * 1.8 : Number(priceChange) / 1.8).toFixed(2)
    : "--";

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
            <form
              ref={symbolSearchFormRef}
              className="symbol-search"
              data-open={showSymbolSearch ? "true" : "false"}
              onSubmit={handleSymbolSearch}
            >
              <button
                type="submit"
                className="symbol-search__button"
                aria-label="Tìm mã cổ phiếu"
              >
                <FiSearch className="symbol-search__icon" aria-hidden="true" />
              </button>
              {showSymbolSearch && (
                <input
                  ref={symbolSearchRef}
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSymbolSearch("");
                      setShowSymbolSearch(false);
                    }
                  }}
                  placeholder="Nhập mã"
                  translate="no"
                />
              )}
            </form>
            <button
              type="button"
              className="btPanel"
              aria-label="Bộ lọc"
              onClick={() => setOpenPanel((v) => !v)}
              data-active={openPanel ? "true" : "false"}
            >
              <PiFunnel className="btPanel__icon" />
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
                  {/* Tiêu đề CỐ ĐỊNH "Chốt lãi / Cắt lỗ" ở cả hai trạng thái —
                      theo yêu cầu, đừng đổi chữ theo mua/bán. Màu số chạy theo
                      vùng của mã (COLORCODE): mã xanh số xanh, mã đỏ số đỏ. */}
                  {priceTarget !== "--" && (
                    <div className="signal-card__metric signal-card__metric--exit">
                      <span>Chốt lãi / Cắt lỗ</span>
                      <strong style={{ color: COLORCODE.color }}>
                        {priceTarget}
                      </strong>
                    </div>
                  )}
                  <div className="signal-card__metric signal-card__metric--change">
                    <span>Giá chuyển {COLORCODE.action}</span>
                    <strong style={{ color: COLORCODE.color }}>{priceChange}</strong>
                  </div>
                  <div className="signal-card__metric signal-card__metric--current">
                    <span>Giá hiện tại</span>
                    <strong>{priceCurrent}</strong>
                  </div>
                  
                </div>

                <div className="signal-card__row signal-card__row--bottom">
                  <div className="signal-card__metric signal-card__metric--icon signal-card__metric--targets">
                    <FiTarget aria-hidden="true" />
                    <span>{ isBuySignal ? "Mục tiêu dự kiến" : "Vùng đáy dự kiến"
                      }</span>
                    <strong style={{ color: "purple" }}>
                      {target1} | {target2} | {target3}
                    </strong>
                  </div>
                  <div className="signal-card__metric signal-card__metric--icon">
                    <FiCalendar aria-hidden="true" />
                    <span>Ngày chuyển {COLORCODE.action}</span>
                    <strong style={{ color: COLORCODE.color }}>
                      {dayChangeConvert}
                    </strong>
                  </div>
                  <div className="signal-card__metric signal-card__metric--icon">
                    <FiCalendar aria-hidden="true" />
                    <span>Ngày hiện tại</span>
                    <strong>{dayCurrent}</strong>
                  </div>
                </div>
              </div>

              <aside
                className="signal-card__summary"
                style={{ "--color-signal": COLORCODE.color }}
              >
                <div className="signal-card__summary-item">
                  <span>{isBuySignal ? "Đã tăng" : "Tránh giảm"}</span>
                  <strong>{pricePct}</strong>
                </div>
                <div className="signal-card__summary-item">
                  <span>Vùng</span>
                  <strong style={{ color: COLORCODE.color }}>
                    {COLORCODE.action}
                  </strong>
                </div>
                <div className="signal-card__summary-item">
                  <span>{isBuySignal ? "Nắm giữ" : "Đứng ngoài"}</span>
                  <strong>{dayCount} phiên</strong>
                </div>
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
        <DataStatusBanner
          isError={isHistoryError || isQuoteDisconnected}
          hasData={candles.length > 0}
        />
      </div>
      <div className="container_panel">
        <div className={`panel-slide ${openPanel ? "is-open" : ""}`}>
          <Panel
            dataPanel={panelRows}
            highlightedSymbol={chanelCode}
            onSelectSymbol={selectSymbol}
            bot={bot}
          />
        </div>
      </div>
    </div>
  );
}

export default TradingView;

