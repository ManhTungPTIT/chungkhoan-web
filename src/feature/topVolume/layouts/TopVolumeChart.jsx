import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { useTopVolume } from "../hooks/useTopVolume";
import { buildTopVolumeView } from "../untils/topVolumeLayout";
import "../styles/topVolume.scss";

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

function TopVolumeChart() {
    const { data, isLoading, isError, refetch } = useTopVolume();
    const view = useMemo(() => buildTopVolumeView(data?.rows), [data?.rows]);
    const { rows } = view;
    const volumeTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="top-volume-view">
            <section className="top-volume-view__card" aria-labelledby="top-volume-view-title">
                <header className="top-volume-view__heading">
                    <h1 id="top-volume-view-title">KHỐI LƯỢNG KHỚP LỆNH CAO NHẤT (TRIỆU CỔ)</h1>
                </header>

                <div className="top-volume-view__legend" aria-label="Chú giải biểu đồ">
                    <span className="top-volume-view__legend-item"><i className="top-volume-view__legend-swatch top-volume-view__legend-swatch--purple" />Khối lượng khớp lệnh (Triệu cổ)</span>
                    <span className="top-volume-view__legend-item"><i className="top-volume-view__legend-swatch top-volume-view__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
                    <span className="top-volume-view__legend-item"><i className="top-volume-view__legend-swatch top-volume-view__legend-swatch--green" />Mã tăng giá (%)</span>
                    <span className="top-volume-view__legend-item"><i className="top-volume-view__legend-swatch top-volume-view__legend-swatch--red" />Mã giảm giá (%)</span>
                </div>

                {isLoading && <div className="top-volume-view__state">Đang tải dữ liệu…</div>}
                {isError && <div className="top-volume-view__state top-volume-view__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="top-volume-view__state">Hiện chưa có dữ liệu.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="top-volume-view__chart">
                        <div className="top-volume-view__panel-titles" aria-hidden="true">
                            <span>KHỐI LƯỢNG KHỚP LỆNH (TRIỆU CỔ)</span>
                            <span>ĐƯỜNG GIÁ HIỆN TẠI (NGHÌN)</span>
                            <span className="top-volume-view__panel-titles-pct">
                                <b>MÃ GIẢM GIÁ</b><b>MÃ TĂNG GIÁ</b>
                            </span>
                        </div>
                        <div className="top-volume-view__axis-row" aria-hidden="true">
                            <div className="top-volume-view__axis top-volume-view__axis--value">{volumeTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-volume-view__axis top-volume-view__axis--price">{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-volume-view__axis top-volume-view__axis--pct">
                                {pctTicks.slice(1).slice().reverse().map((tick, index) => <span className="is-down" key={`n${index}`}>-{fmt(tick)}%</span>)}
                                <span className="top-volume-view__axis-zero">0</span>
                                {pctTicks.slice(1).map((tick, index) => <span className="is-up" key={`p${index}`}>{fmt(tick)}%</span>)}
                            </div>
                        </div>

                        <div className="top-volume-view__plot">
                            <div className="top-volume-view__column top-volume-view__value-bars">
                                {rows.map((row) => (
                                    <div className="top-volume-view__bar-row" key={row.symbol}>
                                        <strong className="top-volume-view__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong>
                                        <div className="top-volume-view__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.volumeTrieu)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="top-volume-view__column top-volume-view__center-line">
                                <div className="top-volume-view__mid-line" />
                                <svg className="top-volume-view__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => {
                                        const x = Math.min(96, Math.max(4, row.priceLinePct));
                                        const y = index * 100 + 50;
                                        return <circle className="top-volume-view__point" key={row.symbol} cx={x} cy={y} r="2.4" />;
                                    })}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.priceLinePct));
                                    return <span className={`top-volume-view__price-label ${x > 74 ? "top-volume-view__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--tvol-row-h) + (var(--tvol-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>;
                                })}
                            </div>

                            <div className="top-volume-view__column top-volume-view__pct-bars">
                                {rows.map((row) => {
                                    const isUp = row.pctTang >= 0;
                                    const barPct = isUp ? row.pctUpBarPct : row.pctDownBarPct; // 0-100
                                    const half = Math.min(50, barPct / 2);
                                    return (
                                        <div className="top-volume-view__bar-row" key={row.symbol}>
                                            <div className="top-volume-view__pct-track">
                                                <span className="top-volume-view__pct-base top-volume-view__pct-base--down" />
                                                <span className="top-volume-view__pct-base top-volume-view__pct-base--up" />
                                                <span
                                                    className={isUp ? "top-volume-view__pct-fill top-volume-view__pct-fill--up" : "top-volume-view__pct-fill top-volume-view__pct-fill--down"}
                                                    style={isUp ? { left: "50%", width: `${half}%` } : { right: "50%", width: `${half}%` }}
                                                />
                                                <em
                                                    className={isUp ? "top-volume-view__pct-label--up" : "top-volume-view__pct-label--down"}
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
                <footer className="top-volume-view__footer"><small>* Đơn vị: Khối lượng khớp lệnh (Triệu cổ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default TopVolumeChart;