import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { BsTrophyFill } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useTopAdvance } from "../hooks/useTopAdvance";
import { buildTopAdvanceView } from "../untils/topAdvanceLayout";
import "../styles/topAdvance.scss";

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

function TopAdvanceChart() {
    const { data, isLoading, isError, refetch } = useTopAdvance();
    const view = useMemo(() => buildTopAdvanceView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    // Ngược chiều bản "top giảm": trục % đọc 0% (trái) -> +max (phải), nên KHÔNG reverse.
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="top-advance">
            <section className="top-advance__card" aria-labelledby="top-advance-title">
                <ChartHeader
                    id="top-advance-title"
                    icon={<BsTrophyFill />}
                    title="TOP 20 MÃ TĂNG MẠNH NHẤT (THEO % TĂNG)"
                    variant="navy"
                    accent="#e6b52e"
                    className="top-advance__heading"
                />

                <div className="top-advance__legend" aria-label="Chú giải biểu đồ">
                    <span className="top-advance__legend-item"><i className="top-advance__legend-swatch top-advance__legend-swatch--purple" />Giá trị khớp lệnh (Tỷ)</span>
                    <span className="top-advance__legend-item"><i className="top-advance__legend-swatch top-advance__legend-swatch--gold" />Giá hiện tại (Nghìn)</span>
                    <span className="top-advance__legend-item"><i className="top-advance__legend-swatch top-advance__legend-swatch--green" />Mã Tăng giá (%)</span>
                </div>

                {isLoading && <div className="top-advance__state">Đang tải dữ liệu…</div>}
                {isError && <div className="top-advance__state top-advance__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="top-advance__state">Hiện chưa có dữ liệu.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="top-advance__chart">
                        <div className="top-advance__panel-titles" aria-hidden="true">
                            <span>GIÁ TRỊ KHỚP LỆNH (TỶ)</span>
                            <span>GIÁ HIỆN TẠI (NGHÌN)</span>
                            <span>MÃ TĂNG GIÁ (%)</span>
                        </div>
                        <div className="top-advance__axis-row" aria-hidden="true">
                            <div className="top-advance__axis top-advance__axis--value">{valueTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-advance__axis top-advance__axis--price">{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="top-advance__axis top-advance__axis--pct">
                                {pctTicks.map((tick, index) => (
                                    <span key={index}>{tick === 0 ? "0%" : `+${fmt(tick)}%`}</span>
                                ))}
                            </div>
                        </div>

                        <div className="top-advance__plot">
                            <div className="top-advance__column top-advance__value-bars">
                                {rows.map((row) => (
                                    <div className="top-advance__bar-row" key={row.symbol}>
                                        <strong className="top-advance__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong>
                                        <div className="top-advance__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.valueTy, row.valueTyDigits)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="top-advance__column top-advance__center-line">
                                <div className="top-advance__mid-line" />
                                <svg className="top-advance__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => {
                                        const x = Math.min(96, Math.max(4, row.priceLinePct));
                                        const y = index * 100 + 50;
                                        return <circle className="top-advance__point" key={row.symbol} cx={x} cy={y} r="2.4" />;
                                    })}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.priceLinePct));
                                    return <span className={`top-advance__price-label ${x > 74 ? "top-advance__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--ta-row-h) + (var(--ta-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>;
                                })}
                            </div>

                            <div className="top-advance__column top-advance__pct-bars">
                                {rows.map((row) => (
                                    <div className="top-advance__bar-row" key={row.symbol}>
                                        <div className="top-advance__bar-track"><span style={{ width: `${row.pctBarPct}%` }} /></div>
                                        <em>+{fmt(row.pctTang, 2)}%</em>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <footer className="top-advance__footer"><small>* Đơn vị: Giá trị khớp lệnh (Tỷ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default TopAdvanceChart;
