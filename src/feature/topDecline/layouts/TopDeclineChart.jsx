import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { useTopDecline } from "../hooks/useTopDecline";
import { buildTopDeclineView } from "../untils/topDeclineLayout";
import "../styles/topDecline.scss";

const fmt = (value, digits = 1) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);

const fmtPrice = (value) => String(Math.round(value * 100) / 100);

function ticks(max, count = 4, min = 0) {
    const safeMax = max > min ? max : min + 1;
    return Array.from({ length: count + 1 }, (_, index) => min + ((safeMax - min) / count) * index);
}

function buildLinePath(rows) {
    return rows
        .map((row, index) => {
            const x = Math.min(96, Math.max(4, row.priceLinePct));
            const y = index * 100 + 50;
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
}

function TopDeclineChart() {
    const { data, isLoading, isError, refetch } = useTopDecline();
    const view = useMemo(() => buildTopDeclineView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3).slice().reverse(), [view.pctAxisMax]);

    return (
        <main className="top-decline">
            <section className="top-decline__card" aria-labelledby="top-decline-title">
                <header className="top-decline__heading">
                    <h1 id="top-decline-title">TOP GIẢM CAO NHẤT</h1>
                </header>

                <div className="top-decline__legend" aria-label="Chú giải biểu đồ">
                    <span className="top-decline__legend-item"><i className="top-decline__legend-swatch top-decline__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
                    <span className="top-decline__legend-item"><i className="top-decline__legend-swatch top-decline__legend-swatch--gold" />Giá hiện tại (Nghìn)</span>
                    <span className="top-decline__legend-item"><i className="top-decline__legend-swatch top-decline__legend-swatch--red" />Mã Giảm giá (%)</span>
                </div>

                {isLoading && <div className="top-decline__state">Đang tải dữ liệu…</div>}
                {isError && <div className="top-decline__state top-decline__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="top-decline__state">Hiện chưa có dữ liệu.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="top-decline__chart">
                        <div className="top-decline__panel-titles" aria-hidden="true">
                            <span>GIÁ TRỊ KHỚP LỆNH (TỶ)</span>
                            <span>GIÁ HIỆN TẠI (NGHÌN)</span>
                            <span>MÃ GIẢM GIÁ (%)</span>
                        </div>
                        <div className="top-decline__axis-row" aria-hidden="true">
                            <div className="top-decline__axis top-decline__axis--value">{valueTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-decline__axis top-decline__axis--price">{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-decline__axis top-decline__axis--pct">
                                {pctTicks.map((tick, index) => (
                                    <span key={index}>{tick === 0 ? "0%" : `-${fmt(tick)}%`}</span>
                                ))}
                            </div>
                        </div>

                        <div className="top-decline__plot">
                            <div className="top-decline__column top-decline__value-bars">
                                {rows.map((row) => (
                                    <div className="top-decline__bar-row" key={row.symbol}>
                                        <strong className="top-decline__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong>
                                        <div className="top-decline__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.valueTy, row.valueTyDigits)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="top-decline__column top-decline__center-line">
                                <div className="top-decline__mid-line" />
                                <svg className="top-decline__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => {
                                        const x = Math.min(96, Math.max(4, row.priceLinePct));
                                        const y = index * 100 + 50;
                                        return <circle className="top-decline__point" key={row.symbol} cx={x} cy={y} r="2.4" />;
                                    })}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.priceLinePct));
                                    return <span className={`top-decline__price-label ${x > 74 ? "top-decline__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--td-row-h) + (var(--td-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>;
                                })}
                            </div>

                            <div className="top-decline__column top-decline__pct-bars">
                                {rows.map((row) => (
                                    <div className="top-decline__bar-row" key={row.symbol}>
                                        <div className="top-decline__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                                        <em>{fmt(row.pctTang, 2)}%</em>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <footer className="top-decline__footer"><small>* Đơn vị: Giá trị khớp lệnh (Tỷ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default TopDeclineChart;