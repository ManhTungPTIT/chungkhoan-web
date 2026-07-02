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
      title: {
        text: "BẢN ĐỒ SỨC MẠNH DÒNG TIỀN ",
        left: "center",
        top: 4,
        textStyle: {
          fontSize: 15,
          color: "#333",
          fontFamily: "Times New Roman", // tên font, vd: "Roboto", "Arial"
          fontWeight: "bold", // "normal" | "bold" | "bolder" | 100–900
          fontStyle: "normal", // "normal" | "italic" | "oblique"
        },
      },
      tooltip: {
        formatter: (p) => {
          const d = data[p.dataIndex] || {};
          return `${d.symbol}<br/>${fmtPct(d.pct)}<br/>GT: ${(d.value || 0).toLocaleString("vi-VN")}`;
        },
      },
      polar: { radius: ["4%", "72%"], center: ["50%", "54%"] },
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
