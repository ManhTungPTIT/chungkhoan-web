import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { BsBullseye } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useSectorBreadth } from "../../../untils/useSectorBreadth";
import {
  buildSectorBreadth,
  STATE_META,
  MIN_LABEL_PCT,
} from "../../../untils/sectorBreadthSeries";
import "../../../components/sectorRows.scss";

// Cao mỗi hàng ngành; ~37 ngành nên chiều cao phải theo SỐ HÀNG, để cố định thì
// hoặc thừa chỗ hoặc các hàng bị bóp dính vào nhau.
const ROW_H = 22;

function SectorBreadthChart() {
  const { data, isLoading, isError, refetch } = useSectorBreadth();
  const rows = useMemo(() => buildSectorBreadth(data), [data]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || rows.length === 0) return undefined;
    const chart = echarts.init(containerRef.current);

    chart.setOption({
      grid: { top: 28, left: 8, right: 24, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) => {
          const row = rows[items[0].dataIndex];
          const lines = [`<strong>${row.name}</strong> · ${row.count} mã`];
          for (const s of [...STATE_META].reverse()) {
            if (row.counts[s.key] > 0) {
              lines.push(`${s.label}: ${row.counts[s.key]} mã (${row.pcts[s.key]}%)`);
            }
          }
          return lines.join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: "#898781", fontSize: 10, formatter: (v) => `${v}%` },
        splitLine: { lineStyle: { color: "#e1e0d9" } },
      },
      yAxis: {
        type: "category",
        // inverse: ngành hút tiền nhất (BE đã xếp đầu) phải nằm TRÊN CÙNG; trục
        // category của ECharts mặc định vẽ ngược từ dưới lên.
        inverse: true,
        data: rows.map((r) => r.shortLabel),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#c3c2b7" } },
        // Tên ngành ICB rất dài; không đặt width thì ECharts cắt ngang chữ ở
        // mép khung, mất luôn chữ đầu. truncate cho ra dấu "..." đọc được.
        axisLabel: {
          color: "#3d4756",
          fontSize: 10,
          width: 150,
          overflow: "truncate",
        },
      },
      series: STATE_META.map((s) => ({
        name: s.label,
        type: "bar",
        stack: "breadth",
        barMaxWidth: ROW_H - 6,
        itemStyle: { color: s.color },
        label: {
          show: true,
          color: "#fff",
          fontSize: 9,
          fontWeight: 700,
          formatter: (p) => (p.value >= MIN_LABEL_PCT ? `${p.value}%` : ""),
        },
        data: rows.map((r) => r.pcts[s.key]),
      })),
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [rows]);

  return (
    <section className="sector-rows" aria-labelledby="sector-breadth-title">
      <ChartHeader
        id="sector-breadth-title"
        icon={<BsBullseye />}
        title="BẢN ĐỒ DÒNG TIỀN TÍCH CỰC- TIÊU CỰC THEO NGÀNH"
        variant="navy"
        accent="#FFFF00"
        className="sector-rows__header"
      />

      {isLoading && <div className="sector-rows__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="sector-rows__state sector-rows__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={() => refetch()}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <div className="sector-rows__state">Chưa có dữ liệu thị trường.</div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <ul className="sector-rows__legend" aria-label="Chú giải trạng thái giá">
            {STATE_META.map((s) => (
              <li key={s.key}>
                <i style={{ background: s.color }} aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ul>
          <div
            className="sector-rows__chart"
            ref={containerRef}
            style={{ height: `${rows.length * ROW_H + 80}px` }}
          />
        </>
      )}
    </section>
  );
}

export default SectorBreadthChart;
