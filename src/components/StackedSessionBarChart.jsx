import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { stackOrder } from "../untils/sectorFlowSeries";
import ChartHeader from "./ChartHeader";
import "./stackedSessionBar.scss";

// Cột chồng theo phiên, mỗi khúc là một ngành. Dùng bởi hai chart "5 phiên gần
// nhất": bản giá trị (tỷ đồng) và bản tỷ trọng (100%). Khác nhau đúng ba thứ —
// mảng số lấy từ đâu, đơn vị trục, và ngưỡng hiện nhãn — nên truyền vào qua prop
// thay vì chép thành hai component.

export default function StackedSessionBarChart({
  id,
  title,
  note,
  labels,
  industries,
  // (ngành, chỉ số phiên) → số vẽ lên cột
  pick,
  // Khúc nhỏ hơn ngưỡng này bỏ nhãn — chữ sẽ đè nhau, bản mẫu cũng để trắng.
  minLabel,
  formatLabel,
  axisName,
  axisMax,
  axisFormatter,
  isLoading,
  isError,
  onRetry,
  emptyText = "Chưa có dữ liệu 5 phiên gần nhất.",
  headerIcon,
  headerEyebrow,
  headerSubtitle,
  headerVariant = "navy",
  headerAccent,
  headerTitle,
}) {
  const containerRef = useRef(null);
  const hasData = labels.length > 0 && industries.length > 0;

  useEffect(() => {
    if (!containerRef.current || !hasData) return undefined;
    const chart = echarts.init(containerRef.current);

    // ECharts xếp series đầu tiên xuống ĐÁY → đảo để ngành lớn nằm trên đỉnh.
    const drawOrder = stackOrder(industries);

    chart.setOption({
      grid: { top: 16, left: 8, right: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        // Chỉ liệt kê khúc có số — 37 ngành thì tooltip đầy đủ dài quá màn hình.
        formatter: (items) => {
          const shown = items.filter((it) => it.value > 0).reverse().slice(0, 12);
          const head = `<strong>${items[0]?.axisValue ?? ""}</strong>`;
          const body = shown
            .map((it) => `${it.marker}${it.seriesName}: ${formatLabel(it.value)}`)
            .join("<br/>");
          const rest = items.filter((it) => it.value > 0).length - shown.length;
          return rest > 0 ? `${head}<br/>${body}<br/>… và ${rest} ngành khác` : `${head}<br/>${body}`;
        },
      },
      // KHÔNG dùng legend của ECharts: 37 ngành trong một panel hẹp thì legend
      // dọc chiếm hơn nửa bề ngang và đè lên cột. Chú giải render bằng HTML bên
      // dưới biểu đồ, xuống dòng thoải mái.
      xAxis: {
        type: "category",
        data: labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#c3c2b7" } },
        axisLabel: { color: "#5c667a", fontSize: 11, interval: 0 },
      },
      yAxis: {
        type: "value",
        name: axisName,
        max: axisMax,
        nameTextStyle: { color: "#898781", fontSize: 11, align: "left" },
        axisLabel: { color: "#898781", fontSize: 11, formatter: axisFormatter },
        splitLine: { lineStyle: { color: "#e1e0d9" } },
      },
      series: drawOrder.map((g) => ({
        name: g.name,
        type: "bar",
        stack: "sessions",
        barMaxWidth: 54,
        itemStyle: { color: g.color },
        // Khe 1px giữa các khúc để ranh giới ngành đọc được mà không cần viền.
        emphasis: { focus: "series" },
        label: {
          show: true,
          position: "inside",
          color: g.ink,
          fontSize: 10,
          fontWeight: 700,
          formatter: (p) => (p.value >= minLabel ? formatLabel(p.value) : ""),
        },
        data: labels.map((_, i) => pick(g, i)),
      })),
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [labels, industries, pick, minLabel, formatLabel, axisName, axisMax, axisFormatter, hasData]);

  const titleId = `${id}-title`;

  return (
    <section className="stacked-session" aria-labelledby={titleId}>
      <ChartHeader
        id={titleId}
        icon={headerIcon}
        eyebrow={headerEyebrow}
        title={headerTitle ?? title}
        subtitle={headerSubtitle}
        variant={headerVariant}
        accent={headerAccent}
        className="stacked-session__header"
      />

      {isLoading && <div className="stacked-session__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="stacked-session__state stacked-session__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={onRetry}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && !hasData && (
        <div className="stacked-session__state">{emptyText}</div>
      )}

      {!isLoading && !isError && hasData && (
        <>
          <div className="stacked-session__chart" ref={containerRef} />
          {/* Chú giải theo thứ tự GỐC (ngành lớn trước) — ngược thứ tự vẽ stack,
              để đọc từ trên xuống đúng như cột đọc từ đỉnh xuống. */}
          <ul className="stacked-session__legend" aria-label="Chú giải nhóm ngành">
            {industries.map((g) => (
              <li key={g.icb_code || g.name}>
                <i style={{ background: g.color }} aria-hidden="true" />
                {g.name}
              </li>
            ))}
          </ul>
          {note && <p className="stacked-session__note">{note}</p>}
          <details className="stacked-session__data">
            <summary>Bảng số liệu</summary>
            <div className="stacked-session__table-wrap">
              <table className="stacked-session__table">
                <thead>
                  <tr>
                    <th scope="col">Nhóm ngành</th>
                    {labels.map((l) => (
                      <th scope="col" key={l}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {industries.map((g) => (
                    <tr key={g.icb_code || g.name}>
                      <th scope="row">
                        <i style={{ background: g.color }} aria-hidden="true" />
                        {g.name}
                      </th>
                      {labels.map((l, i) => (
                        <td key={l}>{formatLabel(pick(g, i))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
