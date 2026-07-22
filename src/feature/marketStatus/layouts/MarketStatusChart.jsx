import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { useMarketStatus } from "../hooks/useMarketStatus";
import "../styles/marketStatus.scss";

// Thứ tự loại trừ lẫn nhau, xếp giảm sàn → tăng trần (trục "xấu → tốt") — thứ
// tự này đã qua kiểm tra dataviz (CVD/protan/deutan/tritan) để 2 màu liền kề
// không bao giờ là cặp dễ nhầm nhất (đỏ/vàng).
const GROUP_META = [
  { key: "limit_down", label: "Mã giảm sàn", color: "#1565c0", Icon: FiTrendingDown },
  { key: "down", label: "Mã giảm giá", color: "#e53935", Icon: FiTrendingDown },
  { key: "flat", label: "Mã đứng giá", color: "#d3a719", Icon: FiMinus },
  { key: "up", label: "Mã tăng giá", color: "#1d9a45", Icon: FiTrendingUp },
  { key: "limit_up", label: "Mã tăng trần", color: "#8e24aa", Icon: FiTrendingUp },
];

function buildSlices(groups) {
  return GROUP_META.map((meta) => {
    const g = groups?.[meta.key] || { count: 0, pct: 0 };
    return { ...meta, count: g.count || 0, pct: g.pct || 0 };
  });
}

function MarketStatusChart() {
  const containerRef = useRef(null);
  const { data, isLoading, isError, refetch } = useMarketStatus();
  const slices = useMemo(() => buildSlices(data?.groups), [data?.groups]);
  const hasData = (data?.total || 0) > 0;

  useEffect(() => {
    if (!containerRef.current || !hasData) return undefined;
    const chart = echarts.init(containerRef.current);

    chart.setOption({
      tooltip: {
        trigger: "item",
        formatter: (p) => `${p.name}<br/>${p.value} mã (${p.percent}%)`,
      },
      series: [
        {
          type: "pie",
          radius: ["0%", "72%"],
          center: ["50%", "50%"],
          label: {
            formatter: (p) => `{pct|${p.percent}%}\n{count|${p.value}}`,
            rich: {
              pct: { fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 20 },
              count: { fontSize: 12, color: "#fff", lineHeight: 16 },
            },
            position: "inside",
            color: "#fff",
          },
          labelLine: { show: false },
          data: slices.map((s) => ({
            name: s.label,
            value: s.count,
            itemStyle: { color: s.color },
          })),
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [slices, hasData]);

  return (
    <section className="market-status" aria-labelledby="market-status-title">
      <header className="market-status__header">
        <h2 id="market-status-title">DIỄN BIẾN THỊ TRƯỜNG</h2>
      </header>

      {isLoading && <div className="market-status__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="market-status__state market-status__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={() => refetch()}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && !hasData && (
        <div className="market-status__state">Chưa có dữ liệu thị trường.</div>
      )}

      {!isLoading && !isError && hasData && (
        <>
          <div className="market-status__chart" ref={containerRef} />

          <div className="market-status__legend" aria-label="Chú giải biểu đồ">
            {slices.map((s) => (
              <span className="market-status__legend-item" key={s.key}>
                <i style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>

          <div className="market-status__stats" role="table">
            {slices.map((s) => (
              <div className="market-status__stat" key={s.key} style={{ "--stat-color": s.color }} role="row">
                <span className="market-status__stat-icon"><s.Icon aria-hidden="true" /></span>
                <span className="market-status__stat-label">{s.label}</span>
                <span className="market-status__stat-value">{s.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default MarketStatusChart;
