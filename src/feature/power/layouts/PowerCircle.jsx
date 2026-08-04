import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import { colorForCategory } from "../untils/powerData";

const fmtPct = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

export default function PowerCircle({ data }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const chart = echarts.init(containerRef.current);

    const symbols = data.map((d) => d.symbol);
    // Màu tính một lần cho mỗi mã → dùng chung cho tia (bar) và nhãn mã,
    // đảm bảo mã luôn cùng màu với tia của nó.
    const colors = data.map((d) => colorForCategory(d.category));
    const maxMag = Math.max(1, ...data.map((d) => d.magnitude));

    chart.setOption({
      // Không có `title` ở đây: tiêu đề là <ChartHeader> ngoài canvas (xem
      // feature/power/index.jsx) để đồng bộ với mọi biểu đồ khác.
      tooltip: {
        formatter: (p) => {
          const d = data[p.dataIndex] || {};
          const lines = [
            d.symbol,
            fmtPct(d.pct),
            `GT: ${(d.value || 0).toLocaleString("vi-VN")}`,
          ];
          // Lý do mã được tô tím / xếp đầu cung nằm ở đây — không có dòng này
          // thì thứ hạng trông như ngẫu nhiên. Vắng mặt khi chưa chấm được
          // (thiếu nền TB20), không hiện 0% để khỏi đọc nhầm là "hụt tiền".
          if (d.surge != null) lines.push(`Đột biến: ${d.surge}%`);
          return lines.join("<br/>");
        },
      },
      // center dọc 50%: mốc 54% trước đây là để né chỗ cho title vẽ trong canvas;
      // title đã chuyển ra ngoài nên giữ 54% là vòng tròn lệch xuống dưới.
      polar: { radius: ["4%", "72%"], center: ["50%", "50%"] },
      angleAxis: {
        type: "category",
        data: symbols,
        startAngle: 90,
        z: 10,
        axisLine: { show: false },
        axisTick: { show: false },
        // Nan hoa tỏa từ tâm → cùng với vòng tròn đồng tâm (radiusAxis.splitLine)
        // tạo lưới "chia ô" như mẫu.
        splitLine: { show: true, lineStyle: { color: "#e5e5e5" } },
        axisLabel: {
          interval: 0, // ép hiện TẤT CẢ nhãn (mặc định "auto" tự ẩn nhãn chen nhau)
          fontSize: 10,
          margin: 8,
          fontWeight: 600,
          // ECharts 6 không áp dụng color dạng hàm cho angleAxis → dùng rich text:
          // mỗi mã gắn style theo nhóm để nhãn cùng màu với tia của nó.
          formatter: (value, index) =>
            `{${data[index]?.category ?? "green"}|${value}}`,
          rich: {
            green: { color: colorForCategory("green"), fontSize: 10 },
            red: { color: colorForCategory("red"), fontSize: 10 },
            purple: { color: colorForCategory("purple"), fontSize: 10 },
          },
        },
      },
      radiusAxis: {
        min: 0,
        max: maxMag,
        axisLabel: { fontSize: 9, color: "#999" },
        splitLine: { lineStyle: { color: "#e5e5e5" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          coordinateSystem: "polar",
          barWidth: "55%",
          data: data.map((d, index) => ({
            value: d.magnitude,
            itemStyle: { color: colors[index] },
          })),
        },
      ],
    });

    const onClick = (p) => {
      const sym = data[p.dataIndex]?.symbol;
      if (sym) navigate(`/?symbol=${encodeURIComponent(sym)}`);
    };
    chart.on("click", onClick);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.off("click", onClick);
      chart.dispose();
    };
  }, [data, navigate]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
