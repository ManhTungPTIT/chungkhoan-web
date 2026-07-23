import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { useForeignBuy } from "../hooks/useForeignBuy";
import { buildForeignBuyView } from "../untils/foreignBuyLayout";
import "../styles/foreignBuy.scss";

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

function ForeignBuyChart() {
    const { data, isLoading, isError, refetch } = useForeignBuy();
    const view = useMemo(() => buildForeignBuyView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="foreign-buy">
            <section className="foreign-buy__card" aria-labelledby="foreign-buy-title">
                <header className="foreign-buy__heading">
                    <h1 id="foreign-buy-title">GIÁ TRỊ NƯỚC NGOÀI MUA RÒNG CAO NHẤT</h1>
                </header>

                <div className="foreign-buy__legend" aria-label="Chú giải biểu đồ">
                    <span className="foreign-buy__legend-item"><i className="foreign-buy__legend-swatch foreign-buy__legend-swatch--purple" />Giá trị mua ròng (Tỷ)</span>
                    <span className="foreign-buy__legend-item"><i className="foreign-buy__legend-swatch foreign-buy__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
                    <span className="foreign-buy__legend-item"><i className="foreign-buy__legend-swatch foreign-buy__legend-swatch--green" />Mã tăng giá (%)</span>
                    <span className="foreign-buy__legend-item"><i className="foreign-buy__legend-swatch foreign-buy__legend-swatch--red" />Mã giảm giá (%)</span>
                </div>

                {isLoading && <div className="foreign-buy__state">Đang tải dữ liệu…</div>}
                {isError && <div className="foreign-buy__state foreign-buy__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="foreign-buy__state">Hiện chưa có mã nào khối ngoại mua ròng.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="foreign-buy__chart">
                        <div className="foreign-buy__panel-titles" aria-hidden="true">
                            <span>GIÁ TRỊ MUA RÒNG (TỶ)</span>
                            <span>ĐƯỜNG GIÁ HIỆN TẠI (NGHÌN)</span>
                            <span>MÃ TĂNG GIÁ (%)</span>
                            <span>MÃ GIẢM GIÁ (%)</span>
                        </div>
                        <div className="foreign-buy__axis-row" aria-hidden="true">
                            <div className="foreign-buy__axis foreign-buy__axis--value" style={{ "--axis-count": valueTicks.length }}>{valueTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="foreign-buy__axis foreign-buy__axis--price" style={{ "--axis-count": priceTicks.length }}>{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="foreign-buy__axis foreign-buy__axis--up" style={{ "--axis-count": pctTicks.length }}>{pctTicks.map((tick, index) => <span key={index}>{fmt(tick)}%</span>)}</div>
                            <div className="foreign-buy__axis foreign-buy__axis--down" style={{ "--axis-count": pctTicks.length }}>{pctTicks.slice().reverse().map((tick, index) => <span key={index}>-{fmt(tick)}%</span>)}</div>
                        </div>

                        <div className="foreign-buy__plot">
                            <div className="foreign-buy__column foreign-buy__value-bars">
                                {rows.map((row) => (
                                    <div className="foreign-buy__bar-row" key={row.symbol}>
                                        <strong className="foreign-buy__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong>
                                        <div className="foreign-buy__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div>
                                        <em>{fmt(row.valueTy)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="foreign-buy__column foreign-buy__center-line">
                                <div className="foreign-buy__mid-line" />
                                <svg className="foreign-buy__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại">
                                    <path d={buildLinePath(rows)} />
                                    {rows.map((row, index) => {
                                        const x = Math.min(96, Math.max(4, row.priceLinePct));
                                        const y = index * 100 + 50;
                                        return <circle className="foreign-buy__point" key={row.symbol} cx={x} cy={y} r="2.4" />;
                                    })}
                                </svg>
                                {rows.map((row, index) => {
                                    const x = Math.min(96, Math.max(4, row.priceLinePct));
                                    return <span className={`foreign-buy__price-label ${x > 74 ? "foreign-buy__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--fb-row-h) + (var(--fb-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>;
                                })}
                            </div>

                            <div className="foreign-buy__column foreign-buy__up-bars">
                                {rows.map((row) => <div className="foreign-buy__bar-row" key={row.symbol}><div className="foreign-buy__bar-track"><span style={{ width: `${row.pctUpBarPct}%` }} /></div>{row.pctTang > 0 && <em>{fmt(row.pctTang, 2)}%</em>}</div>)}
                            </div>
                            <div className="foreign-buy__column foreign-buy__down-bars">
                                {rows.map((row) => <div className="foreign-buy__bar-row" key={row.symbol}>{row.pctTang < 0 && <em>{fmt(row.pctTang, 2)}%</em>}<div className="foreign-buy__bar-track"><span style={{ width: `${row.pctDownBarPct}%` }} /></div></div>)}
                            </div>
                        </div>
                    </div>
                )}
                <footer className="foreign-buy__footer"><small>* Đơn vị: Giá trị mua ròng (Tỷ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default ForeignBuyChart;
