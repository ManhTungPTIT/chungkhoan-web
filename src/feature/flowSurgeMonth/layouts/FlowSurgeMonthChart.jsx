import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { useFlowSurgeMonth } from "../hooks/useFlowSurgeMonth";
import { buildTopGainView } from "../untils/flowSurgeMonthLayout";
import "../styles/flowSurgeMonth.scss";

const fmt = (value, digits = 2) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);

// Trục trái cố định (decorative, khớp mockup). Trục % và trục giá tính động.
const LEFT_TICKS = [-15, -10, -5, 0];

// % dòng tiền có thể rất lớn → chia trục thành 5 mốc đều theo pctAxisMax (đã làm
// tròn "đẹp" trong buildTopGainView), khớp bề rộng bar. Dùng 5 mốc (không phải 6)
// để nhãn không chen nhau trong cột phải hẹp của panel marketCharts.
function rightTicks(pctAxisMax) {
  const max = pctAxisMax > 0 ? pctAxisMax : 100;
  return [0, 1, 2, 3, 4].map((i) => Math.round((max * i) / 4));
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

function FlowSurgeMonthChart() {
  const { data, isLoading, isError, refetch } = useFlowSurgeMonth();
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

  return (
    <main className="flow-surge-month">
      <section className="flow-surge-month__card" aria-labelledby="flow-surge-month-title">
        <div className="flow-surge-month__titlebar">
          <div>
            <h2 id="flow-surge-month-title">DÒNG TIỀN TĂNG ĐỘT BIẾN SO VỚI BÌNH QUÂN 1 THÁNG</h2>
          </div>
        </div>

        <div className="flow-surge-month__legend" aria-label="Chú giải biểu đồ">
          <span className="flow-surge-month__legend-item"><i className="flow-surge-month__legend-swatch flow-surge-month__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
          <span className="flow-surge-month__legend-item"><i className="flow-surge-month__legend-swatch flow-surge-month__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
          <span className="flow-surge-month__legend-item"><i className="flow-surge-month__legend-swatch flow-surge-month__legend-swatch--green" />% tăng</span>
        </div>

        {isLoading && <div className="flow-surge-month__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="flow-surge-month__state flow-surge-month__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="flow-surge-month__state">Không có mã nào tăng đột biến.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="flow-surge-month__chart">
            <div className="flow-surge-month__axis-row" aria-hidden="true">
              <span className="flow-surge-month__axis-caption">MÃ</span>
              <div className="flow-surge-month__axis flow-surge-month__axis--left" style={{ "--axis-count": LEFT_TICKS.length }}>
                {LEFT_TICKS.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
              <div className="flow-surge-month__axis flow-surge-month__axis--center" style={{ "--axis-count": centerTicks.length }}>
                {centerTicks.map((tick, i) => <span key={i}>{tick}</span>)}
              </div>
              <div className="flow-surge-month__axis flow-surge-month__axis--right" style={{ "--axis-count": rightAxisTicks.length }}>
                {rightAxisTicks.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>

            <div className="flow-surge-month__plot">
              <div className="flow-surge-month__column flow-surge-month__symbols">
                {rows.map((row) => (
                  <div className="flow-surge-month__symbol-row" key={row.symbol}>
                    <span className="flow-surge-month__badge">
                      <FiActivity aria-hidden="true" />
                      <strong>{row.symbol}</strong>
                    </span>
                  </div>
                ))}
                <div className="flow-surge-month__summary-label">Top {rows.length}</div>
              </div>

              <div className="flow-surge-month__column flow-surge-month__left-bars">
                {rows.map((row) => (
                  <div className="flow-surge-month__bar-row" key={row.symbol}>
                    <em>{fmt(row.valueTy)}</em>
                    <div className="flow-surge-month__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                  </div>
                ))}
                <div className="flow-surge-month__summary-bar">{fmt(totalValue)}</div>
              </div>

              <div className="flow-surge-month__column flow-surge-month__center-line">
                <div className="flow-surge-month__zero-line" style={{ height: `calc(var(--tg-row-h) * ${rows.length})` }} />
                <svg
                  className="flow-surge-month__line-svg"
                  style={{ height: `calc(var(--tg-row-h) * ${rows.length})` }}
                  viewBox={`0 0 100 ${rows.length * 100}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Đường giá hiện tại"
                >
                  <path d={buildLinePath(rows)} />
                </svg>
                {/* Chấm + nhãn số nằm NGOÀI svg, định vị bằng CSS — trong svg
                    preserveAspectRatio="none" kéo méo chữ (xem chú thích chart gốc). */}
                <div className="flow-surge-month__points">
                  {rows.map((row, index) => {
                    const x = Math.min(100, Math.max(0, row.priceLinePct));
                    return (
                      <span
                        className={`flow-surge-month__point${x > 72 ? " is-flipped" : ""}`}
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

              <div className="flow-surge-month__column flow-surge-month__right-bars">
                {rows.map((row) => (
                  <div className="flow-surge-month__bar-row" key={row.symbol}>
                    <div className="flow-surge-month__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                    <em>{row.pctTang.toFixed(2)}%</em>
                  </div>
                ))}
                <div className="flow-surge-month__summary-bar">{avgGrowth.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default FlowSurgeMonthChart;
