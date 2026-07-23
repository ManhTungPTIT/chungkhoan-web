import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { useTopValue } from "../hooks/useTopValue";
import { buildTopValueView } from "../untils/topValueLayout";
import "../styles/topValue.scss";

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

function TopValueChart() {
    const { data, isLoading, isError, refetch } = useTopValue();
    const view = useMemo(() => buildTopValueView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="top-value">
            <section className="top-value__card" aria-labelledby="top-value-title">
                <header className="top-value__heading">
                    <h1 id="top-value-title">GIÁ TRỊ TIỀN KHỚP LỆNH CAO NHẤT (TỶ)</h1>
                </header>

                <div className="top-value__legend" aria-label="Chú giải biểu đồ">
                    <span className="top-value__legend-item"><i className="top-value__legend-swatch top-value__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
                    <span className="top-value__legend-item"><i className="top-value__legend-swatch top-value__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
                    <span className="top-value__legend-item"><i className="top-value__legend-swatch top-value__legend-swatch--green" />Mã tăng giá (%)</span>
                    <span className="top-value__legend-item"><i className="top-value__legend-swatch top-value__legend-swatch--red" />Mã giảm giá (%)</span>
                </div>

                {isLoading && <div className="top-value__state">Đang tải dữ liệu…</div>}
                {isError && <div className="top-value__state top-value__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="top-value__state">Hiện chưa có dữ liệu.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="top-value__chart">
                        <div className="top-value__panel-titles" aria-hidden="true">
                            <span>GIÁ TRỊ KHỚP LỆNH (TỶ)</span>
                            <span>ĐƯỜNG GIÁ HIỆN TẠI (NGHÌN)</span>
                            <span className="top-value__panel-titles-pct">
                                <b>MÃ GIẢM GIÁ</b><b>MÃ TĂNG GIÁ</b>
                            </span>
                        </div>
                        <div className="top-value__axis-row" aria-hidden="true">
                            <div className="top-value__axis top-value__axis--value">{valueTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-value__axis top-value__axis--price">{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-value__axis top-value__axis--pct">
                                {pctTicks.slice(1).slice().reverse().map((tick, index) => <span className="is-down" key={`n${index}`}>-{fmt(tick)}%</span>)}
                                <span className="top-value__axis-zero">0</span>
                                {pctTicks.slice(1).map((tick, index) => <span className="is-up" key={`p${index}`}>{fmt(tick)}%</span>)}
                            </div>
                        </div>

                        <div className="top-value__plot">
                            <div className="top-value__column top-value__value-bars">
                                {rows.map((row) => (
                                    <div className="top-value__bar-row" key={row.symbol}>
                                        <strong className="top-value__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong>
                                        <div className="top-value__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.valueTy)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="top-value__column top-value__center-line">
                                <div className="top-value__mid-line" />
                                <svg className="top-value__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => {
                                        const x = Math.min(96, Math.max(4, row.priceLinePct));
                                        const y = index * 100 + 50;
                                        return <circle className="top-value__point" key={row.symbol} cx={x} cy={y} r="2.4" />;
                                    })}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.priceLinePct));
                                    return <span className={`top-value__price-label ${x > 74 ? "top-value__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--tv-row-h) + (var(--tv-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>;
                                })}
                            </div>

                            <div className="top-value__column top-value__pct-bars">
                                {rows.map((row) => {
                                    const isUp = row.pctTang >= 0;
                                    const barPct = isUp ? row.pctUpBarPct : row.pctDownBarPct; // 0-100
                                    const half = Math.min(50, barPct / 2);
                                    return (
                                        <div className="top-value__bar-row" key={row.symbol}>
                                            <div className="top-value__pct-track">
                                                <span className="top-value__pct-base top-value__pct-base--down" />
                                                <span className="top-value__pct-base top-value__pct-base--up" />
                                                <span
                                                    className={isUp ? "top-value__pct-fill top-value__pct-fill--up" : "top-value__pct-fill top-value__pct-fill--down"}
                                                    style={isUp ? { left: "50%", width: `${half}%` } : { right: "50%", width: `${half}%` }}
                                                />
                                                <em
                                                    className={isUp ? "top-value__pct-label--up" : "top-value__pct-label--down"}
                                                    style={isUp ? { left: `calc(50% + ${half}% + 6px)` } : { right: `calc(50% + ${half}% + 6px)` }}
                                                >
                                                    {fmt(row.pctTang, 2)}%
                                                </em>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                <footer className="top-value__footer"><small>* Đơn vị: Giá trị khớp lệnh (Tỷ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default TopValueChart;