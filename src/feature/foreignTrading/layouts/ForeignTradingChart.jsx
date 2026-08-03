import { useMemo } from "react";
import { BsGlobe2 } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useForeignTrading } from "../hooks/useForeignTrading";
import { buildForeignTradingView, axisTicks } from "../untils/foreignTradingLayout";
import "../styles/foreignTrading.scss";

const fmt = (value) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));

function ForeignTradingChart() {
    const { data, isLoading, isError, refetch } = useForeignTrading();
    const view = useMemo(() => buildForeignTradingView(data?.rows), [data?.rows]);
    const { rows } = view;
    const ticks = useMemo(() => axisTicks(view.axisMax), [view.axisMax]);

    return (
        <main className="foreign-trading">
            <section className="foreign-trading__card" aria-labelledby="foreign-trading-title">
                <ChartHeader
                    id="foreign-trading-title"
                    icon={<BsGlobe2 />}
                    title="GIAO DỊCH KHỐI NGOẠI 30 PHIÊN GẦN NHẤT"
                    variant="navy"
                    accent="#e6b52e"
                    className="foreign-trading__heading"
                />

                {isLoading && <div className="foreign-trading__state">Đang tải dữ liệu…</div>}
                {isError && <div className="foreign-trading__state foreign-trading__state--error">Không tải được dữ liệu. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
                {!isLoading && !isError && rows.length === 0 && <div className="foreign-trading__state">Hiện chưa có dữ liệu.</div>}

                {!isLoading && !isError && rows.length > 0 && (
                    <div className="foreign-trading__chart">
                        <div className="foreign-trading__panel-titles" aria-hidden="true">
                            <span />
                            {/* Cột tím vẽ sell_value (xem foreignTradingLayout: `sellTy`), không
                                phải buy+sell — nhãn cũ "TỔNG MUA BÁN" đọc ra con số khác hẳn
                                (phiên 30/07: bán 2.422 tỷ, tổng 5.442 tỷ). */}
                            <span className="foreign-trading__badge foreign-trading__badge--purple">GIÁ TRỊ BÁN (TỶ)</span>
                            <span className="foreign-trading__panel-titles-net">
                                <b className="foreign-trading__badge--red">BÁN RÒNG</b>
                                <b className="foreign-trading__badge--green">MUA RÒNG</b>
                            </span>
                        </div>

                        <div className="foreign-trading__axis-row" aria-hidden="true">
                            <span className="foreign-trading__axis-gutter" />
                            <div className="foreign-trading__axis foreign-trading__axis--left">
                                {ticks.slice().reverse().map((tick, index) => (
                                    <span key={`l${index}`}>{fmt(tick)}</span>
                                ))}
                            </div>
                            <div className="foreign-trading__axis foreign-trading__axis--net">
                                {ticks.slice(1).slice().reverse().map((tick, index) => (
                                    <span className="is-down" key={`nn${index}`}>-{fmt(tick)}</span>
                                ))}
                                <span className="foreign-trading__axis-zero">0</span>
                                {ticks.slice(1).map((tick, index) => (
                                    <span className="is-up" key={`np${index}`}>{fmt(tick)}</span>
                                ))}
                            </div>
                        </div>

                        <div className="foreign-trading__plot">
                            {rows.map((row) => {
                                const half = Math.min(50, row.netBarPct / 2);
                                return (
                                    <div className="foreign-trading__row" key={row.date}>
                                        <span className="foreign-trading__date">{row.label}</span>

                                        <div className="foreign-trading__col foreign-trading__col--sell">
                                            <em>{fmt(row.sellTy)}</em>
                                            <span className="foreign-trading__bar foreign-trading__bar--purple" style={{ width: `${row.sellBarPct}%` }} />
                                        </div>

                                        {/* Diverging thật: trục 0 ở giữa cột, âm bung trái (đỏ), dương bung phải (xanh) */}
                                        <div className="foreign-trading__net-track">
                                            <span
                                                className={row.isBuy ? "foreign-trading__bar foreign-trading__bar--green" : "foreign-trading__bar foreign-trading__bar--red"}
                                                style={row.isBuy ? { left: "50%", width: `${half}%` } : { right: "50%", width: `${half}%` }}
                                            />
                                            <em
                                                className={row.isBuy ? "is-up" : "is-down"}
                                                style={row.isBuy ? { left: `calc(50% + ${half}% + 8px)` } : { right: `calc(50% + ${half}% + 8px)` }}
                                            >
                                                {row.isBuy ? "" : "-"}{fmt(Math.abs(row.netTy))}
                                            </em>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                <footer className="foreign-trading__footer"><small>* Đơn vị: Tỷ VNĐ · Cập nhật: {data?.current?.date ?? "—"}</small></footer>
            </section>
        </main>
    );
}

export default ForeignTradingChart;