import { useMemo } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { useSectorFlowSurge } from "../hooks/useSectorFlowSurge";
import { buildSectorFlowSurgeView } from "../untils/sectorFlowSurgeLayout";
import "../styles/sectorFlowSurge.scss";

const fmt = (value, digits = 1) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const fmtAvg = (value) => String(Math.round(value * 100) / 100);

function ticks(max, count = 4, min = 0) {
    const safeMax = max > min ? max : min + 1;
    return Array.from({ length: count + 1 }, (_, index) => min + ((safeMax - min) / count) * index);
}

function buildLinePath(rows) {
    return rows.map((row, index) => {
        const x = Math.min(96, Math.max(4, row.avgLinePct));
        return `${index === 0 ? "M" : "L"} ${x} ${index * 100 + 50}`;
    }).join(" ");
}

function SectorFlowSurgeChart({ avgWindow = 20 }) {
    const { data, isLoading, isError, refetch } = useSectorFlowSurge(avgWindow);
    const view = useMemo(() => buildSectorFlowSurgeView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="sector-flow-surge">
            <section className="sector-flow-surge__card" aria-labelledby="sector-flow-surge-title">
                <header className="sector-flow-surge__heading">
                    <h1 id="sector-flow-surge-title">NGÀNH CÓ DÒNG TIỀN TĂNG ĐỘT BIẾN</h1>
                </header>
                <div className="sector-flow-surge__legend" aria-label="Chú giải biểu đồ">
                    <span className="sector-flow-surge__legend-item"><i className="sector-flow-surge__legend-swatch sector-flow-surge__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
                    <span className="sector-flow-surge__legend-item"><i className="sector-flow-surge__legend-swatch sector-flow-surge__legend-swatch--gold" />Đường giá trung bình (Nghìn)</span>
                    <span className="sector-flow-surge__legend-item"><i className="sector-flow-surge__legend-swatch sector-flow-surge__legend-swatch--green" />Mã Tăng Giá</span>
                    <span className="sector-flow-surge__legend-item"><i className="sector-flow-surge__legend-swatch sector-flow-surge__legend-swatch--red" />Mã Giảm Giá</span>
                </div>
                {isLoading && <div className="sector-flow-surge__state">Đang tải dữ liệu…</div>}
                {isError && (
                    <div className="sector-flow-surge__state sector-flow-surge__state--error">
                        Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button>
                    </div>
                )}
                {!isLoading && !isError && rows.length === 0 && (
                    <div className="sector-flow-surge__state">Chưa có ngành nào ghi nhận dòng tiền tăng đột biến.</div>
                )}
                {!isLoading && !isError && rows.length > 0 && (
                    <div className="sector-flow-surge__chart">
                        <div className="sector-flow-surge__panel-titles" aria-hidden="true">
                            <span>GIÁ TRỊ KHỚP LỆNH (TỶ)</span>
                            <span>ĐƯỜNG GIÁ TRUNG BÌNH (NGHÌN)</span>
                            <span className="sector-flow-surge__panel-titles-pct">
                                <b>MÃ GIẢM GIÁ</b><b>MÃ TĂNG GIÁ</b>
                            </span>
                        </div>
                        <div className="sector-flow-surge__axis-row" aria-hidden="true">
                            <div className="sector-flow-surge__axis sector-flow-surge__axis--value">
                                {valueTicks.map((tick, index) => <span key={index}>{fmt(tick, 0)}</span>)}
                            </div>
                            <div className="sector-flow-surge__axis sector-flow-surge__axis--avg" aria-hidden="true" />
                            <div className="sector-flow-surge__axis sector-flow-surge__axis--pct">
                                {pctTicks.slice(1).slice().reverse().map((tick, index) => <span className="is-down" key={`n${index}`}>-{fmt(tick, 0)}%</span>)}
                                <span className="sector-flow-surge__axis-zero">0</span>
                                {pctTicks.slice(1).map((tick, index) => <span className="is-up" key={`p${index}`}>{fmt(tick, 0)}%</span>)}
                            </div>
                        </div>
                        <div className="sector-flow-surge__plot">
                            <div className="sector-flow-surge__column sector-flow-surge__value-bars">
                                {rows.map((row) => (
                                    <div className="sector-flow-surge__bar-row" key={row.icbCode}>
                                        <strong className="sector-flow-surge__symbol" title={row.group}>
                                            <FiBarChart2 aria-hidden="true" />
                                            <span>{row.group}</span>
                                        </strong>
                                        <div className="sector-flow-surge__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.valueTy, row.valueTy < 10 ? 2 : 0)}</em>
                                    </div>
                                ))}
                            </div>
                            <div className="sector-flow-surge__column sector-flow-surge__center-line">
                                <div className="sector-flow-surge__mid-line" />
                                <svg
                                    className="sector-flow-surge__line-svg"
                                    viewBox={`0 0 100 ${rows.length * 100}`}
                                    preserveAspectRatio="none"
                                    role="img"
                                    aria-label="Đường giá trung bình"
                                >
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => (
                                        <circle
                                            className="sector-flow-surge__point"
                                            key={row.icbCode}
                                            cx={Math.min(96, Math.max(4, row.avgLinePct))}
                                            cy={index * 100 + 50}
                                            r="2.4"
                                        />
                                    ))}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.avgLinePct));
                                    return (
                                        <span
                                            className={`sector-flow-surge__avg-label ${x > 74 ? "sector-flow-surge__avg-label--left" : ""}`}
                                            key={row.icbCode}
                                            style={{ left: `${x}%`, top: `calc(${index} * var(--sfs-row-h) + (var(--sfs-row-h) / 2))` }}
                                        >
                                            {fmtAvg(row.avgNghin)}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="sector-flow-surge__column sector-flow-surge__pct-bars">
                                {rows.map((row) => {
                                    const isUp = row.pctTang >= 0;
                                    const barPct = isUp ? row.pctUpBarPct : row.pctDownBarPct; // 0-100
                                    const half = Math.min(50, barPct / 2);
                                    return (
                                        <div className="sector-flow-surge__bar-row" key={row.icbCode}>
                                            <div className="sector-flow-surge__pct-track">
                                                <span className="sector-flow-surge__pct-base sector-flow-surge__pct-base--down" />
                                                <span className="sector-flow-surge__pct-base sector-flow-surge__pct-base--up" />
                                                <span
                                                    className={isUp ? "sector-flow-surge__pct-fill sector-flow-surge__pct-fill--up" : "sector-flow-surge__pct-fill sector-flow-surge__pct-fill--down"}
                                                    style={isUp ? { left: "50%", width: `${half}%` } : { right: "50%", width: `${half}%` }}
                                                />
                                                {row.pctTang !== 0 && (
                                                    <em
                                                        className={isUp ? "sector-flow-surge__pct-label--up" : "sector-flow-surge__pct-label--down"}
                                                        style={isUp ? { left: `calc(50% + ${half}% + 6px)` } : { right: `calc(50% + ${half}% + 6px)` }}
                                                    >
                                                        {fmt(row.pctTang, 2)}%
                                                    </em>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default SectorFlowSurgeChart;