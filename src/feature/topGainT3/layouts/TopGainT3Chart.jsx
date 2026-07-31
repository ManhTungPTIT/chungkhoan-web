import { useMemo } from "react";
import { FiActivity, FiInfo } from "react-icons/fi";
import { BsGraphUpArrow } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useTopGainT3 } from "../hooks/useTopGainT3";
import { buildTopGainView, leftTicks } from "../untils/topGainLayout";
import "../styles/topGainT3.scss";

const fmt = (value, digits = 2) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);

// Trục trái cố định (decorative, khớp mockup). Trục % và trục giá tính động.

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

function TopGainT3Chart({ window = 3 }) {
  const { data, isLoading, isError, refetch } = useTopGainT3(window);
  const view = useMemo(() => buildTopGainView(data?.rows), [data?.rows]);
  const rows = view.rows;
  const tPlus = data?.window ?? window;

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
    <main className="top-gain-t3">
      <header className="top-gain-t3__page-header">
        <div>
          <span className="top-gain-t3__eyebrow">LEOSTOCK · MARKET RADAR</span>
          <h1>Top tăng cao nhất T+{tPlus}</h1>
          <p>Mã thanh khoản trên 1 tỷ đang tăng giá, xếp theo điểm sức mạnh so với {tPlus + 1} phiên trước — dòng tiền khớp lệnh, giá hiện tại và mức tăng.</p>
        </div>
        <div className="top-gain-t3__header-meta">
          <span>Cập nhật lần cuối</span>
          <strong>{data?.generated_at ?? "—"}</strong>
          <button type="button" aria-label="Thông tin biểu đồ"><FiInfo /></button>
        </div>
      </header>

      <section className="top-gain-t3__card" aria-labelledby="top-gain-t3-title">
        <ChartHeader
          id="top-gain-t3-title"
          icon={<BsGraphUpArrow />}
          title={`NHÓM TĂNG MẠNH NHẤT (NGẮN HẠN: T+${tPlus})`}
          variant="purple"
          accent="#e6b52e"
        />

        <div className="top-gain-t3__legend" aria-label="Chú giải biểu đồ">
          <span className="top-gain-t3__legend-item"><i className="top-gain-t3__legend-swatch top-gain-t3__legend-swatch--purple" />Giá trị khớp lệnh hôm nay (Tỷ)</span>
          <span className="top-gain-t3__legend-item"><i className="top-gain-t3__legend-swatch top-gain-t3__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
          <span className="top-gain-t3__legend-item"><i className="top-gain-t3__legend-swatch top-gain-t3__legend-swatch--green" />Mã tăng giá (%)</span>
        </div>

        {isLoading && <div className="top-gain-t3__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="top-gain-t3__state top-gain-t3__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="top-gain-t3__state">Chưa có mã nào đủ dữ liệu.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="top-gain-t3__chart">
            <div className="top-gain-t3__axis-row" aria-hidden="true">
              <span className="top-gain-t3__axis-caption">MÃ</span>
              <div className="top-gain-t3__axis top-gain-t3__axis--left" style={{ "--axis-count": leftAxisTicks.length }}>
                {leftAxisTicks.map((tick, i) => <span key={i}>{fmt(tick)}</span>)}
              </div>
              <div className="top-gain-t3__axis top-gain-t3__axis--center" style={{ "--axis-count": centerTicks.length }}>
                {centerTicks.map((tick, i) => <span key={i}>{tick}</span>)}
              </div>
              <div className="top-gain-t3__axis top-gain-t3__axis--right" style={{ "--axis-count": rightAxisTicks.length }}>
                {rightAxisTicks.map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>

            <div className="top-gain-t3__plot">
              <div className="top-gain-t3__column top-gain-t3__symbols">
                {rows.map((row) => (
                  <div className="top-gain-t3__symbol-row" key={row.symbol}>
                    <span className="top-gain-t3__badge">
                      <FiActivity aria-hidden="true" />
                      <strong>{row.symbol}</strong>
                    </span>
                  </div>
                ))}
                <div className="top-gain-t3__summary-label">Top {rows.length}</div>
              </div>

              <div className="top-gain-t3__column top-gain-t3__left-bars">
                {rows.map((row) => (
                  <div className="top-gain-t3__bar-row" key={row.symbol}>
                    <div className="top-gain-t3__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                    <em>{fmt(row.valueTy)}</em>
                  </div>
                ))}
                <div className="top-gain-t3__summary-bar">{fmt(totalValue)}</div>
              </div>

              <div className="top-gain-t3__column top-gain-t3__center-line">
                <div className="top-gain-t3__zero-line" style={{ height: `calc(var(--tg-row-h) * ${rows.length})` }} />
                <svg
                  className="top-gain-t3__line-svg"
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
                <div className="top-gain-t3__points">
                  {rows.map((row, index) => {
                    const x = Math.min(100, Math.max(0, row.priceLinePct));
                    return (
                      <span
                        className={`top-gain-t3__point${x > 72 ? " is-flipped" : ""}`}
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

              <div className="top-gain-t3__column top-gain-t3__right-bars">
                {rows.map((row) => (
                  <div className="top-gain-t3__bar-row" key={row.symbol}>
                    <div className="top-gain-t3__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                    <em>{row.pctTang.toFixed(2)}%</em>
                  </div>
                ))}
                <div className="top-gain-t3__summary-bar">{avgGrowth.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        <footer className="top-gain-t3__footer">
          <small>Nguồn: rổ mã giá trị khớp lệnh trên 1 tỷ, chỉ mã tăng giá . % tính so giá đóng cửa {tPlus + 1} phiên trước . Sắp xếp theo điểm = % tăng × log10(thanh khoản + 1)</small>
        </footer>
      </section>
    </main>
  );
}

export default TopGainT3Chart;
