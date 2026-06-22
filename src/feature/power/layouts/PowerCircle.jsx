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
    const maxMag = Math.max(1, ...data.map((d) => d.magnitude));

    chart.setOption({
      title: {
        text: "BẢN ĐỒ SỨC MẠNH DÒNG TIỀN ",
        left: "center",
        top: 4,
        textStyle: { fontSize: 15, color: "#333" },
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
        axisLabel: {
          interval: 0, // ép hiện TẤT CẢ nhãn (mặc định "auto" tự ẩn nhãn chen nhau)
          fontSize: 10,
          margin: 8,
          // màu nhãn theo nhóm của mã ở vị trí đó
          color: (value, index) => colorForCategory(data[index]?.category),
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
          data: data.map((d) => ({
            value: d.magnitude,
            itemStyle: { color: colorForCategory(d.category) },
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
