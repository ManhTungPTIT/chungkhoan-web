import { useMemo } from "react";
import { FiActivity, FiInfo } from "react-icons/fi";
import { useTopGainWeek } from "../hooks/useTopGainWeek";
import { buildTopGainView } from "../untils/topGainLayout";
import "../styles/topGainWeek.scss";

const fmt = (value, digits = 2) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);

// Trục trái cố định (decorative, khớp mockup). Trục % và trục giá tính động.
const LEFT_TICKS = [-15, -10, -5, 0];

// Nhãn trục % (0..axisMax, bước 5) — khớp bar được scale theo pctAxisMax.
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

function TopGainWeekChart() {
  const { data, isLoading, isError, refetch } = useTopGainWeek();
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

  return (
    <main className="top-gain-week">

      <section className="top-gain-week__card" aria-labelledby="top-gain-week-title">
        <div className="top-gain-week__titlebar">
          <div>
            <span className="top-gain-week__titlebar-kicker">COMBO CHART · DIVERGING BAR + LINE</span>
            <h2 id="top-gain-week-title">TOP TĂNG CAO NHẤT TUẦN</h2>
          </div>
        </div>

        <div className="top-gain-week__legend" aria-label="Chú giải biểu đồ">
          <span className="top-gain-week__legend-item"><i className="top-gain-week__legend-swatch top-gain-week__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
          <span className="top-gain-week__legend-item"><i className="top-gain-week__legend-swatch top-gain-week__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
          <span className="top-gain-week__legend-item"><i className="top-gain-week__legend-swatch top-gain-week__legend-swatch--green" />Mã tăng giá (%)</span>
        </div>

        {isLoading && <div className="top-gain-week__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="top-gain-week__state top-gain-week__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="top-gain-week__state">Chưa có dữ liệu.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="top-gain-week__chart">
            <div className="top-gain-week__axis-row" aria-hidden="true">
              <span className="top-gain-week__axis-caption">MÃ</span>
              <div className="top-gain-week__axis top-gain-week__axis--left">
                {LEFT_TICKS.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
              <div className="top-gain-week__axis top-gain-week__axis--center">
                {centerTicks.map((tick, i) => <span key={i}>{tick}</span>)}
              </div>
              <div className="top-gain-week__axis top-gain-week__axis--right">
                {rightTicks(view.pctAxisMax).map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>

            <div className="top-gain-week__plot">
              <div className="top-gain-week__column top-gain-week__symbols">
                {rows.map((row) => (
                  <div className="top-gain-week__symbol-row" key={row.symbol}>
                    <span className="top-gain-week__badge">
                      <FiActivity aria-hidden="true" />
                      <strong>{row.symbol}</strong>
                    </span>
                  </div>
                ))}
                <div className="top-gain-week__summary-label">Top {rows.length}</div>
              </div>

              <div className="top-gain-week__column top-gain-week__left-bars">
                {rows.map((row) => (
                  <div className="top-gain-week__bar-row" key={row.symbol}>
                    <em>{fmt(row.valueTy)}</em>
                    <div className="top-gain-week__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                  </div>
                ))}
                <div className="top-gain-week__summary-bar">{fmt(totalValue)}</div>
              </div>

              <div className="top-gain-week__column top-gain-week__center-line">
                <div className="top-gain-week__zero-line" />
                <svg
                  className="top-gain-week__line-svg"
                  viewBox={`0 0 100 ${rows.length * 100}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Đường giá hiện tại"
                >
                  <path d={buildLinePath(rows)} />
                  {rows.map((row, index) => {
                    const x = Math.min(100, Math.max(0, row.priceLinePct));
                    const y = index * 100 + 50;
                    return (
                      <g className="top-gain-week__point" key={row.symbol}>
                        <circle cx={x} cy={y} r="2.6" />
                        <text x={x} y={y - 8} textAnchor={x > 78 ? "end" : "start"}>
                          {fmt(row.priceNghin)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="top-gain-week__column top-gain-week__right-bars">
                {rows.map((row) => (
                  <div className="top-gain-week__bar-row" key={row.symbol}>
                    <div className="top-gain-week__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                    <em>{row.pctTang.toFixed(2)}%</em>
                  </div>
                ))}
                <div className="top-gain-week__summary-bar">{avgGrowth.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default TopGainWeekChart;
