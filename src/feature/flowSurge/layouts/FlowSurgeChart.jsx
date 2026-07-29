import { useMemo } from "react";
import { FiActivity, FiInfo } from "react-icons/fi";
import { BsGraphUpArrow } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useFlowSurge } from "../hooks/useFlowSurge";
import { buildTopGainView, leftTicks } from "../untils/topGainLayout";
import "../styles/flowSurge.scss";

const fmt = (value, digits = 2) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);

// Trục trái cố định (decorative, khớp mockup). Trục % và trục giá tính động.

// % dòng tiền có thể rất lớn (tới ~9,250%) → chia trục thành 5 mốc đều theo
// pctAxisMax (đã làm tròn "đẹp" trong buildTopGainView), khớp bề rộng bar.
function rightTicks(pctAxisMax) {
  const max = pctAxisMax > 0 ? pctAxisMax : 100;
  return [0, 1, 2, 3, 4, 5].map((i) => Math.round((max * i) / 5));
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

function FlowSurgeChart() {
  const { data, isLoading, isError, refetch } = useFlowSurge();
  const view = useMemo(() => buildTopGainView(data?.rows), [data?.rows]);
  const rows = view.rows;

  const totalValue = rows.reduce((sum, r) => sum + r.valueTy, 0);
  const avgGrowth = rows.length
    ? rows.reduce((sum, r) => sum + r.pctTang, 0) / rows.length
    : 0;
  const centerTicks = useMemo(() => {
    const step = view.priceMax > 0 ? view.priceMax / 4 : 1;
    return [0, 1, 2, 3, 4].map((i) => Math.round(step * i));
  }, [view.priceMax]);
  const rightAxisTicks = useMemo(() => rightTicks(view.pctAxisMax), [view.pctAxisMax]);
  const leftAxisTicks = useMemo(() => leftTicks(view.leftMax), [view.leftMax]);

  return (
    <main className="flow-surge">
      

      <section className="flow-surge__card" aria-labelledby="flow-surge-title">
        <ChartHeader
          id="flow-surge-title"
          icon={<BsGraphUpArrow />}
          title={<>TOP BIẾN ĐỘNG TĂNG MẠNH NHẤT <span className="chart-header__hl">HÔM NAY</span></>}
          variant="navy"
          accent="#e6b52e"
        />

        <div className="flow-surge__legend" aria-label="Chú giải biểu đồ">
          <span className="flow-surge__legend-item"><i className="flow-surge__legend-swatch flow-surge__legend-swatch--purple" />Giá trị khớp lệnh hôm nay (Tỷ)</span>
          <span className="flow-surge__legend-item"><i className="flow-surge__legend-swatch flow-surge__legend-swatch--gold" />Giá hiện tại (Nghìn)</span>
          <span className="flow-surge__legend-item"><i className="flow-surge__legend-swatch flow-surge__legend-swatch--green" />% tăng dòng tiền</span>
        </div>

        {isLoading && <div className="flow-surge__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="flow-surge__state flow-surge__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="flow-surge__state">Không có mã nào tăng đột biến.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="flow-surge__chart">
            <div className="flow-surge__axis-row" aria-hidden="true">
              <span className="flow-surge__axis-caption">MÃ</span>
              <div className="flow-surge__axis flow-surge__axis--left" style={{ "--axis-count": leftAxisTicks.length }}>
                {leftAxisTicks.map((tick, i) => <span key={i}>{fmt(tick)}</span>)}
              </div>
              <div className="flow-surge__axis flow-surge__axis--center" style={{ "--axis-count": centerTicks.length }}>
                {centerTicks.map((tick, i) => <span key={i}>{tick}</span>)}
              </div>
              <div className="flow-surge__axis flow-surge__axis--right" style={{ "--axis-count": rightAxisTicks.length }}>
                {rightAxisTicks.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>

            <div className="flow-surge__plot">
              <div className="flow-surge__column flow-surge__symbols">
                {rows.map((row) => (
                  <div className="flow-surge__symbol-row" key={row.symbol}>
                    <span className="flow-surge__badge">
                      <FiActivity aria-hidden="true" />
                      <strong>{row.symbol}</strong>
                    </span>
                  </div>
                ))}
                <div className="flow-surge__summary-label">Top {rows.length}</div>
              </div>

              <div className="flow-surge__column flow-surge__left-bars">
                {rows.map((row) => (
                  <div className="flow-surge__bar-row" key={row.symbol}>
                    <div className="flow-surge__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                    <em>{fmt(row.valueTy)}</em>
                  </div>
                ))}
                <div className="flow-surge__summary-bar">{fmt(totalValue)}</div>
              </div>

              <div className="flow-surge__column flow-surge__center-line">
                <div className="flow-surge__zero-line" style={{ height: `calc(var(--tg-row-h) * ${rows.length})` }} />
                <svg
                  className="flow-surge__line-svg"
                  style={{ height: `calc(var(--tg-row-h) * ${rows.length})` }}
                  viewBox={`0 0 100 ${rows.length * 100}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Đường giá hiện tại"
                >
                  <path d={buildLinePath(rows)} />
                </svg>
                {/* Chấm + nhãn số nằm NGOÀI svg, định vị bằng CSS.
                    Trong svg chúng bị preserveAspectRatio="none" kéo méo: trục X
                    giãn theo bề rộng cột, trục Y nén theo chiều cao, hai hệ số
                    lệch nhau vài lần nên chữ vừa méo vừa lùn dần khi bảng nhiều
                    dòng, tới mức mất hẳn. Chỉ path ở lại svg — nó có
                    non-scaling-stroke nên không dính vấn đề này. */}
                <div className="flow-surge__points">
                  {rows.map((row, index) => {
                    const x = Math.min(100, Math.max(0, row.priceLinePct));
                    return (
                      <span
                        className={`flow-surge__point${x > 72 ? " is-flipped" : ""}`}
                        key={row.symbol}
                        style={{
                          left: `${x}%`,
                          top: `calc(var(--tg-row-h) * ${index + 0.5})`,
                        }}
                      >
                        <em>{fmt(row.priceNghin)}</em>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flow-surge__column flow-surge__right-bars">
                {rows.map((row) => (
                  <div className="flow-surge__bar-row" key={row.symbol}>
                    <div className="flow-surge__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                    <em>{row.pctTang.toFixed(2)}%</em>
                  </div>
                ))}
                <div className="flow-surge__summary-bar">{avgGrowth.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default FlowSurgeChart;
