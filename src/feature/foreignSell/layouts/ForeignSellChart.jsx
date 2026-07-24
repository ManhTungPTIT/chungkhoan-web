import { useMemo } from "react";
import { FiActivity } from "react-icons/fi";
import { BsGraphDownArrow } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useForeignSell } from "../hooks/useForeignSell";
import { buildForeignSellView } from "../untils/foreignSellLayout";
import "../styles/foreignSell.scss";

const fmt = (value, digits = 1) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const fmtPrice = (value) => String(Math.round(value * 100) / 100);

function ticks(max, count = 4, min = 0) {
    const safeMax = max > min ? max : min + 1;
    return Array.from({ length: count + 1 }, (_, index) => min + ((safeMax - min) / count) * index);
}

function buildLinePath(rows) {
    return rows.map((row, index) => {
        const x = Math.min(96, Math.max(4, row.priceLinePct));
        return `${index === 0 ? "M" : "L"} ${x} ${index * 100 + 50}`;
    }).join(" ");
}

function ForeignSellChart() {
    const { data, isLoading, isError, refetch } = useForeignSell();
    const view = useMemo(() => buildForeignSellView(data?.rows), [data?.rows]);
    const { rows } = view;
    const valueTicks = useMemo(() => ticks(view.leftMax), [view.leftMax]);
    const priceTicks = useMemo(() => ticks(view.priceMax, 4, view.priceMin), [view.priceMax, view.priceMin]);
    const pctTicks = useMemo(() => ticks(view.pctAxisMax, 3), [view.pctAxisMax]);

    return (
        <main className="foreign-sell">
            <section className="foreign-sell__card" aria-labelledby="foreign-sell-title">
                <ChartHeader
                    id="foreign-sell-title"
                    icon={<BsGraphDownArrow />}
                    title="TOP BÁN RÒNG KHỐI NGOẠI"
                    variant="purple"
                    accent="#ff6a6a"
                    className="foreign-sell__heading"
                />
                <div className="foreign-sell__legend" aria-label="Chú giải biểu đồ">
                    <span className="foreign-sell__legend-item"><i className="foreign-sell__legend-swatch foreign-sell__legend-swatch--purple" />Giá trị bán ròng (Tỷ)</span>
                    <span className="foreign-sell__legend-item"><i className="foreign-sell__legend-swatch foreign-sell__legend-swatch--gold" />Đường giá hiện tại (Nghìn)</span>
                    <span className="foreign-sell__legend-item"><i className="foreign-sell__legend-swatch foreign-sell__legend-swatch--red" />Mã giảm giá (%)</span>
                    <span className="foreign-sell__legend-item"><i className="foreign-sell__legend-swatch foreign-sell__legend-swatch--green" />Mã tăng giá (%)</span>
                </div>
                {isLoading && <div className="foreign-sell__state">Đang tải dữ liệu…</div>}
                {isError && <div className="foreign-sell__state foreign-sell__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="foreign-sell__state">Hiện chưa có mã nào khối ngoại bán ròng.</div>}
                {!isLoading && !isError && rows.length > 0 && (
                    <div className="foreign-sell__chart">
                        <div className="foreign-sell__panel-titles" aria-hidden="true"><span>GIÁ TRỊ BÁN RÒNG (TỶ)</span><span>ĐƯỜNG GIÁ HIỆN TẠI (NGHÌN)</span><span>MÃ GIẢM GIÁ (%)</span><span>MÃ TĂNG GIÁ (%)</span></div>
                        <div className="foreign-sell__axis-row" aria-hidden="true">
                            <div className="foreign-sell__axis foreign-sell__axis--value" style={{ "--axis-count": valueTicks.length }}>{valueTicks.map((tick, index) => <span key={index}>{fmt(tick, 0)}</span>)}</div>
                            <div className="foreign-sell__axis foreign-sell__axis--price" style={{ "--axis-count": priceTicks.length }}>{priceTicks.map((tick, index) => <span key={index}>{fmt(tick)}</span>)}</div>
                            <div className="foreign-sell__axis foreign-sell__axis--down" style={{ "--axis-count": pctTicks.length }}>{pctTicks.slice().reverse().map((tick, index) => <span key={index}>-{fmt(tick)}%</span>)}</div>
                            <div className="foreign-sell__axis foreign-sell__axis--up" style={{ "--axis-count": pctTicks.length }}>{pctTicks.map((tick, index) => <span key={index}>{fmt(tick)}%</span>)}</div>
                        </div>
                        <div className="foreign-sell__plot">
                            <div className="foreign-sell__column foreign-sell__value-bars">{rows.map((row) => <div className="foreign-sell__bar-row" key={row.symbol}><strong className="foreign-sell__symbol"><FiActivity aria-hidden="true" />{row.symbol}</strong><div className="foreign-sell__bar-track"><span style={{ width: `${row.valueBarPct}%` }} /></div><em>{fmt(row.valueTy)}</em></div>)}</div>
                            <div className="foreign-sell__column foreign-sell__center-line">
                                <div className="foreign-sell__mid-line" />
                                <svg className="foreign-sell__line-svg" viewBox={`0 0 100 ${rows.length * 100}`} preserveAspectRatio="none" role="img" aria-label="Đường giá hiện tại"><path d={buildLinePath(rows)} />{rows.map((row, index) => <circle className="foreign-sell__point" key={row.symbol} cx={Math.min(96, Math.max(4, row.priceLinePct))} cy={index * 100 + 50} r="2.4" />)}</svg>
                                {rows.map((row, index) => { const x = Math.min(96, Math.max(4, row.priceLinePct)); return <span className={`foreign-sell__price-label ${x > 74 ? "foreign-sell__price-label--left" : ""}`} key={row.symbol} style={{ left: `${x}%`, top: `calc(${index} * var(--fb-row-h) + (var(--fb-row-h) / 2))` }}>{fmtPrice(row.priceNghin)}</span>; })}
                            </div>
                            <div className="foreign-sell__column foreign-sell__down-bars">{rows.map((row) => <div className="foreign-sell__bar-row" key={row.symbol}>{row.pctTang < 0 && <em>{fmt(row.pctTang, 2)}%</em>}<div className="foreign-sell__bar-track"><span style={{ width: `${row.pctDownBarPct}%` }} /></div></div>)}</div>
                            <div className="foreign-sell__column foreign-sell__up-bars">{rows.map((row) => <div className="foreign-sell__bar-row" key={row.symbol}><div className="foreign-sell__bar-track"><span style={{ width: `${row.pctUpBarPct}%` }} /></div>{row.pctTang > 0 && <em>{fmt(row.pctTang, 2)}%</em>}</div>)}</div>
                        </div>
                    </div>
                )}
                <footer className="foreign-sell__footer"><small>* Đơn vị: Giá trị bán ròng (Tỷ) · Giá hiện tại (Nghìn) · Cập nhật: {data?.generated_at ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default ForeignSellChart;