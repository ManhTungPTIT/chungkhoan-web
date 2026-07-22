import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useIndexOverview } from "../hooks/useIndexOverview";
import {
  buildBarSeries,
  VALUE_COLOR,
  DIEM_POS_COLOR,
  PCT_POS_COLOR,
  NEG_COLOR,
} from "../untils/indexOverviewOption";
import "../styles/indexOverview.scss";

const fmt = (v, digits = 2) =>
  v === null || v === undefined
    ? "—"
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(v);

const signClass = (v) => (v === null || v === undefined ? "" : v >= 0 ? "is-up" : "is-down");

function IndexChart({ indices }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const chart = echarts.init(ref.current);
    const s = buildBarSeries(indices);

    chart.setOption({
      // 3 series khác đơn vị nhưng cùng nằm khoảng nhỏ (-10..20) → chung 1 trục,
      // gắn nhãn số trực tiếp trên cột (không so giá trị thật giữa các cột).
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: {
        top: 6,
        data: ["Giá trị khớp lệnh (nghìn tỷ)", "Điểm tăng giảm", "% Tăng giảm"],
      },
      grid: { left: 8, right: 16, top: 48, bottom: 8, containLabel: true },
      xAxis: { type: "category", data: s.categories, axisTick: { alignWithLabel: true } },
      yAxis: { type: "value", axisLine: { show: false }, splitLine: { lineStyle: { color: "#eee" } } },
      series: [
        {
          name: "Giá trị khớp lệnh (nghìn tỷ)",
          type: "bar",
          data: s.valueData,
          label: { show: true, position: "top", fontSize: 10, formatter: (p) => fmt(p.value) },
          itemStyle: { color: VALUE_COLOR },
        },
        {
          name: "Điểm tăng giảm",
          type: "bar",
          data: s.diemData,
          label: { show: true, position: "top", fontSize: 10, formatter: (p) => fmt(p.value) },
        },
        {
          name: "% Tăng giảm",
          type: "bar",
          data: s.pctData,
          label: { show: true, position: "top", fontSize: 10, formatter: (p) => (p.value == null ? "" : `${fmt(p.value)}%`) },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [indices]);

  return <div ref={ref} className="index-overview__chart" />;
}

function IndexOverviewChart() {
  const { data, isLoading, isError, refetch } = useIndexOverview();
  const indices = data?.indices ?? [];

  return (
    <main className="index-overview">
      <section className="index-overview__card">
        <h2 className="index-overview__title">CHỈ SỐ CHUNG 3 SÀN</h2>

        {isLoading && <div className="index-overview__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="index-overview__state index-overview__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && indices.length > 0 && (
          <>
            <IndexChart indices={indices} />
            <table className="index-overview__table">
              <thead>
                <tr>
                  <th>Sàn</th>
                  <th>Tổng điểm thị trường</th>
                  <th>Giá trị khớp lệnh<br />(nghìn tỷ)</th>
                  <th>Điểm tăng giảm</th>
                  <th>% Tăng giảm</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((r) => (
                  <tr key={r.ten_san}>
                    <td className="index-overview__san">{r.ten_san}</td>
                    <td>{fmt(r.diem_hien_tai)}</td>
                    <td className="index-overview__purple">{fmt(r.gia_tri_khop_lenh)}</td>
                    <td className={signClass(r.diem_tang_giam)}>{fmt(r.diem_tang_giam)}</td>
                    <td className={signClass(r.pct)}>{r.pct == null ? "—" : `${fmt(r.pct)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </main>
  );
}

export default IndexOverviewChart;
