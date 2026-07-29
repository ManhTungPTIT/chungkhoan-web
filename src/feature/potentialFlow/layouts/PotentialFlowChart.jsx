import { useMemo, useState } from "react";
import { FiActivity, FiChevronDown, FiInfo } from "react-icons/fi";
import { BsLightningChargeFill } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { usePotentialFlow } from "../hooks/usePotentialFlow";
import { buildPotentialView, leftTicks } from "../untils/potentialData";
import "../styles/potentialFlow.scss";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);

function rightTicks(pctAxisMax) {
  const max = pctAxisMax > 0 ? pctAxisMax : 15;
  const ticks = [];
  for (let t = 0; t <= max; t += 5) ticks.push(t);
  return ticks;
}

function buildLinePath(rows) {
  return rows
    .map((row, index) => {
      const x = Math.min(100, Math.max(0, row.priceLinePct));
      const y = index * 100 + 50;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function LegendItem({ tone, children }) {
  return (
    <span className="potential-flow__legend-item">
      <i className={`potential-flow__legend-swatch potential-flow__legend-swatch--${tone}`} />
      {children}
    </span>
  );
}

function StockBadge({ symbol, selected }) {
  return (
    <span className={`potential-flow__badge${selected ? " is-selected" : ""}`}>
      <FiActivity aria-hidden="true" />
      <strong>{symbol}</strong>
    </span>
  );
}

const MODE_TOP_N = { "Top 20 mã": 20, "Top tăng giá": 30 };

function PotentialFlowChart() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [mode, setMode] = useState("Top 20 mã");
  const { data, isLoading, isError, refetch } = usePotentialFlow();

  const view = useMemo(
    () => buildPotentialView(data, MODE_TOP_N[mode] ?? 20),
    [data, mode],
  );
  const rows = view.rows;

  const selectedRow = rows.find((row) => row.ma_ck === selectedSymbol) || rows[0];
  const averageGrowth = rows.length
    ? rows.reduce((total, row) => total + row.pct_tang_gia, 0) / rows.length
    : 0;
  const totalValue = rows.reduce((sum, row) => sum + row.gia_tri_khop_lenh, 0);
  const centerTicks = useMemo(() => {
    const step = (view.priceMax - view.priceMin) / 4;
    return [0, 1, 2, 3, 4].map((i) => Math.round(view.priceMin + step * i));
  }, [view.priceMin, view.priceMax]);
  const rightAxisTicks = useMemo(() => rightTicks(view.pctAxisMax), [view.pctAxisMax]);
  const leftAxisTicks = useMemo(() => leftTicks(view.leftMax), [view.leftMax]);

  return (
    <main className="potential-flow">
      <header className="potential-flow__page-header">
        <div>
          <span className="potential-flow__eyebrow">LEOSTOCK · MARKET RADAR</span>
          <h1>Mã cổ phiếu tiềm năng lướt sóng</h1>
          <p>So sánh dòng tiền khớp lệnh, giá hiện tại và mức tăng giá trong phiên.</p>
        </div>
        <div className="potential-flow__header-meta">
          <span>Cập nhật</span>
          <strong>{isLoading ? "Đang tải…" : "Realtime"}</strong>
          <button type="button" aria-label="Thông tin biểu đồ"><FiInfo /></button>
        </div>
      </header>

      <section className="potential-flow__card" aria-labelledby="potential-flow-title">
        <ChartHeader
          id="potential-flow-title"
          icon={<BsLightningChargeFill />}
          title="TOP CỔ PHIẾU DẪN ĐẦU VỀ SỨC MẠNH TĂNG GIÁ"
          variant="navy"
          accent="#b98be0"
          control={
            <div className="potential-flow__selector">
              <div>
                <select id="potential-flow-mode" value={mode} onChange={(event) => setMode(event.target.value)}>
                  <option>Top 20 mã</option>
                  <option>Top tăng giá</option>
                </select>
                <FiChevronDown aria-hidden="true" />
              </div>
            </div>
          }
        />

        <div className="potential-flow__legend" aria-label="Chú giải biểu đồ">
          <LegendItem tone="purple">Giá trị khớp lệnh (tỷ đồng)</LegendItem>
          <LegendItem tone="gold">Giá hiện tại (nghìn đồng)</LegendItem>
          <LegendItem tone="green">Mức tăng giá (%)</LegendItem>
        </div>

        {isLoading && <div className="potential-flow__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="potential-flow__state potential-flow__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="potential-flow__state">Chưa có dữ liệu.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="potential-flow__chart">
            <div className="potential-flow__axis-row" aria-hidden="true">
              <span className="potential-flow__axis-caption">MÃ</span>
              <div className="potential-flow__axis potential-flow__axis--left" style={{ "--axis-count": leftAxisTicks.length }}>
                {leftAxisTicks.map((tick, i) => <span key={i}>{formatNumber(tick)}</span>)}
              </div>
              <div className="potential-flow__axis potential-flow__axis--center" style={{ "--axis-count": centerTicks.length }}>
                {centerTicks.map((tick, i) => <span key={i}>{tick}</span>)}
              </div>
              <div className="potential-flow__axis potential-flow__axis--right" style={{ "--axis-count": rightAxisTicks.length }}>
                {rightAxisTicks.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>

            <div className="potential-flow__plot">
              <div className="potential-flow__column potential-flow__symbols">
                {rows.map((row) => (
                  <button
                    className={`potential-flow__symbol-row${row.ma_ck === selectedSymbol ? " is-selected" : ""}`}
                    key={row.ma_ck}
                    onClick={() => setSelectedSymbol(row.ma_ck)}
                    type="button"
                  >
                    <StockBadge symbol={row.ma_ck} selected={row.ma_ck === selectedSymbol} />
                  </button>
                ))}
                <div className="potential-flow__summary-label">Top {rows.length}</div>
              </div>

              <div className="potential-flow__column potential-flow__left-bars">
                {rows.map((row) => (
                  <div className={`potential-flow__bar-row${row.ma_ck === selectedSymbol ? " is-selected" : ""}`} key={row.ma_ck}>
                    <div className="potential-flow__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                    <em>{formatNumber(row.gia_tri_khop_lenh)}</em>
                  </div>
                ))}
                <div className="potential-flow__summary-bar">{formatNumber(totalValue)}</div>
              </div>

              <div className="potential-flow__column potential-flow__center-line">
                <div className="potential-flow__zero-line" style={{ height: `calc(var(--pf-row-h) * ${rows.length})` }} />
                <svg className="potential-flow__line-svg"
                  style={{ height: `calc(var(--pf-row-h) * ${rows.length})` }} viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                  <path d={buildLinePath(rows)} />
                </svg>
                {/* Chấm + nhãn số nằm NGOÀI svg, định vị bằng CSS.
                    Trong svg chúng bị preserveAspectRatio="none" kéo méo: trục X
                    giãn theo bề rộng cột, trục Y nén theo chiều cao, hai hệ số
                    lệch nhau vài lần nên chữ vừa méo vừa lùn dần khi bảng nhiều
                    dòng, tới mức mất hẳn. Chỉ path ở lại svg — nó có
                    non-scaling-stroke nên không dính vấn đề này. */}
                <div className="potential-flow__points">
                  {rows.map((row, index) => {
                    const x = Math.min(100, Math.max(0, row.priceLinePct));
                    return (
                      <span
                        className={`potential-flow__point${x > 72 ? " is-flipped" : ""}`}
                        key={row.ma_ck}
                        style={{
                          left: `${x}%`,
                          top: `calc(var(--pf-row-h) * ${index + 0.5})`,
                        }}
                      >
                        <em>{formatNumber(row.gia_hien_tai)}</em>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="potential-flow__column potential-flow__right-bars">
                {rows.map((row) => (
                  <div className={`potential-flow__bar-row${row.ma_ck === selectedSymbol ? " is-selected" : ""}`} key={row.ma_ck}>
                    <div className="potential-flow__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                    <em>{row.pct_tang_gia.toFixed(2)}%</em>
                  </div>
                ))}
                <div className="potential-flow__summary-bar">{averageGrowth.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        
      </section>
    </main>
  );
}

export default PotentialFlowChart;
