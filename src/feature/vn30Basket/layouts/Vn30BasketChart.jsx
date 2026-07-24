import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { useVn30Basket } from "../hooks/useVn30Basket";
import {
  buildVn30Basket,
  valueAxisMax,
  priceAxisMax,
  pctAxisMax,
  fmtTy,
  fmtPrice,
  fmtPct,
  UP_COLOR,
  DOWN_COLOR,
  VALUE_COLOR,
  PRICE_COLOR,
} from "../untils/vn30BasketSeries";
import "../../../components/sectorRows.scss";
import "../styles/vn30Basket.scss";

const ROW_H = 14;

// Bốn panel dùng CHUNG trục Y (danh sách mã) nhưng mỗi panel một thang X riêng.
// Hình học lưới đặt bằng %, chốt một chỗ để title cột và grid luôn khớp cột nhau
// khi resize. left = mép trái vùng vẽ, w = bề rộng (đều tính theo % bề ngang).
// Dải trống 0–LABEL_W% bên trái dành cho nhãn mã (chỉ grid 0 vẽ nhãn).
const LABEL_W = 6;
const GRIDS = [
  { left: LABEL_W, w: 30 }, // 1. Giá trị khớp lệnh (Tỷ)
  { left: 41, w: 19 }, // 2. Đường giá hiện tại (Nghìn)
  { left: 64, w: 23 }, // 3. % thay đổi
];
const GRID_TOP = 30;
const GRID_BOTTOM = 26;

const HEADERS = [
  { text: "GIÁ TRỊ KHỚP LỆNH (Tỷ)", bg: "#efe7f7", color: "#6b2fa8" },
  { text: "ĐƯỜNG GIÁ HIỆN TẠI (Nghìn)", bg: "#fbf1d8", color: "#a07c00" },
  { text: "% THAY ĐỔI", bg: "#eef0f3", color: "#3d4756" },
];

const AXIS_LABEL = { color: "#898781", fontSize: 8 };
const SPLIT_LINE = { lineStyle: { color: "#eceae4" } };

function Vn30BasketChart() {
  const { data, isLoading, isError, refetch } = useVn30Basket();
  const rows = useMemo(() => buildVn30Basket(data), [data]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || rows.length === 0) return undefined;
    const chart = echarts.init(containerRef.current);

    const symbols = rows.map((r) => r.symbol);
    // Bốn trục Y category giống hệt nhau (cùng data, cùng inverse) — nhờ chung
    // top/bottom nên các hàng của cả 4 panel thẳng khít nhau. Chỉ panel 1 hiện
    // nhãn mã; ba panel còn lại ẩn nhãn để khỏi lặp.
    const yAxis = GRIDS.map((_, i) => ({
      type: "category",
      gridIndex: i,
      data: symbols,
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#c3c2b7" } },
      axisLabel: i === 0 ? { color: "#3d4756", fontSize: 9 } : { show: false },
    }));

    const valueMax = valueAxisMax(rows);
    const priceMax = priceAxisMax(rows);
    const pctMax = pctAxisMax(rows);

    chart.setOption({
      grid: GRIDS.map((g) => ({
        top: GRID_TOP,
        bottom: GRID_BOTTOM,
        left: `${g.left}%`,
        width: `${g.w}%`,
      })),
      // Header từng cột: đặt title tại TÂM mỗi grid (left + w/2), textAlign center
      // nên luôn nằm giữa cột dù resize.
      title: HEADERS.map((h, i) => ({
        text: h.text,
        left: `${GRIDS[i].left + GRIDS[i].w / 2}%`,
        top: 2,
        textAlign: "center",
        textStyle: {
          color: h.color,
          fontSize: 9,
          fontWeight: 700,
          backgroundColor: h.bg,
          padding: [3, 5],
          borderRadius: 3,
        },
      })),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) => {
          const row = rows[items[0].dataIndex];
          if (!row) return "";
          return [
            `<strong>${row.symbol}</strong>`,
            `% thay đổi: ${fmtPct(row.changePct)}`,
            `GT khớp lệnh: ${fmtTy(row.valueTy)} tỷ`,
            `Giá hiện tại: ${fmtPrice(row.priceNghin)} nghìn`,
          ].join("<br/>");
        },
      },
      xAxis: [
        {
          type: "value",
          gridIndex: 0,
          min: 0,
          max: valueMax,
          splitNumber: 4,
          axisLabel: AXIS_LABEL,
          splitLine: SPLIT_LINE,
        },
        {
          type: "value",
          gridIndex: 1,
          min: 0,
          max: priceMax,
          splitNumber: 4,
          axisLabel: AXIS_LABEL,
          splitLine: SPLIT_LINE,
        },
        {
          type: "value",
          gridIndex: 2,
          min: -pctMax,
          max: pctMax,
          splitNumber: 4,
          axisLabel: { ...AXIS_LABEL, formatter: (v) => `${v}%` },
          splitLine: SPLIT_LINE,
        },
      ],
      yAxis,
      series: [
        {
          name: "Giá trị khớp lệnh (Tỷ)",
          type: "bar",
          xAxisIndex: 0,
          yAxisIndex: 0,
          barWidth: 8,
          itemStyle: { color: VALUE_COLOR },
          label: {
            show: true,
            position: "right",
            fontSize: 8,
            color: "#4a4a55",
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => (p.value > 0 ? fmtTy(p.value) : ""),
          },
          data: rows.map((r) => r.valueTy),
        },
        {
          name: "Đường giá hiện tại (Nghìn)",
          type: "line",
          xAxisIndex: 1,
          yAxisIndex: 1,
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#fff", borderColor: PRICE_COLOR, borderWidth: 1.5 },
          lineStyle: { color: PRICE_COLOR, width: 1 },
          label: {
            show: true,
            position: "right",
            distance: 4,
            fontSize: 8,
            color: "#a07c00",
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => (p.value > 0 ? fmtPrice(p.value) : ""),
          },
          data: rows.map((r) => r.priceNghin),
        },
        {
          name: "% thay đổi",
          type: "bar",
          xAxisIndex: 2,
          yAxisIndex: 2,
          barWidth: 8,
          label: {
            show: true,
            fontSize: 8,
            fontWeight: 700,
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => (p.value !== 0 ? fmtPct(p.value) : ""),
          },
          data: rows.map((r) => {
            const up = r.changePct >= 0;
            return {
              value: r.changePct,
              itemStyle: { color: up ? UP_COLOR : DOWN_COLOR },
              label: {
                color: up ? UP_COLOR : DOWN_COLOR,
                // position đặt trên TỪNG điểm: dạng hàm ở cấp series không được
                // ECharts áp dụng, nhãn rơi về đầu cột thay vì cuối cột.
                position: up ? "right" : "left",
              },
            };
          }),
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [rows]);

  return (
    <section className="sector-rows" aria-labelledby="vn30-basket-title">
      <header className="sector-rows__header">
        <h2 id="vn30-basket-title">MÃ RỔ VN30</h2>
      </header>

      {isLoading && <div className="sector-rows__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="sector-rows__state sector-rows__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={() => refetch()}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <div className="sector-rows__state">Chưa có dữ liệu rổ VN30.</div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <ul className="sector-rows__legend" aria-label="Chú giải">
            <li>
              <i style={{ background: VALUE_COLOR }} aria-hidden="true" />
              Giá trị khớp lệnh (Tỷ)
            </li>
            <li>
              <i
                className="sector-rows__legend-ring"
                style={{ borderColor: PRICE_COLOR }}
                aria-hidden="true"
              />
              Đường giá hiện tại (Nghìn)
            </li>
            <li>
              <i style={{ background: UP_COLOR }} aria-hidden="true" />
              Mã tăng giá
            </li>
            <li>
              <i style={{ background: DOWN_COLOR }} aria-hidden="true" />
              Mã giảm giá
            </li>
          </ul>
          <div className="vn30-basket-scroll">
            <div
              className="sector-rows__chart"
              ref={containerRef}
              style={{ height: `${rows.length * ROW_H + GRID_TOP + GRID_BOTTOM + 20}px` }}
            />
          </div>
        </>
      )}
    </section>
  );
}

export default Vn30BasketChart;
