import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { toEchartsData, fmtTyDong } from "../untils/moneyFlowData";

// Cỡ chữ nhãn scale theo tỷ trọng — ô càng to chữ càng lớn, giống bản mẫu.
// Dùng căn bậc hai vì tỷ trọng tỉ lệ với DIỆN TÍCH, còn chữ thì theo cạnh ô.
function labelSize(pct) {
  return Math.max(9, Math.min(26, Math.round(9 + Math.sqrt(pct) * 3.2)));
}

export default function SectorFlowTreemap({ items, dark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    // Grout: khe giữa các ô tô bằng màu nền trang để ô "rời" nhau.
    const pageBg = dark ? "#16171d" : "#ffffff";
    const chart = echarts.init(containerRef.current);

    const data = toEchartsData(items).map((node) => {
      const fontSize = labelSize(node._pct);
      return {
        ...node,
        label: {
          ...node.label,
          show: true,
          fontSize,
          // lineHeight phải bám cỡ chữ, nếu để cố định thì ô lớn chữ chồng dòng.
          lineHeight: Math.round(fontSize * 1.3),
        },
      };
    });

    chart.setOption({
      tooltip: {
        formatter: (info) => {
          const d = info.data || {};
          return [
            `<strong>${info.name}</strong>`,
            `Tỷ trọng: ${d._pct}%`,
            `GT khớp lệnh: ${fmtTyDong(d.value)}`,
            `Số mã: ${d._count}`,
          ].join("<br/>");
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Không cho ECharts tự làm nhạt/đậm màu theo cấp — màu đã gán cố định
          // theo ngành ở tầng dữ liệu.
          colorMappingBy: "id",
          itemStyle: {
            borderColor: pageBg,
            borderWidth: 2,
            gapWidth: 2,
            borderRadius: 4,
          },
          label: {
            show: true,
            fontWeight: "bold",
            overflow: "break",
            formatter: (p) => `${p.name}\n${p.data._pct}%`,
          },
          emphasis: {
            itemStyle: { borderColor: pageBg, borderWidth: 2 },
          },
          data,
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [items, dark]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
