import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { toEchartsData, fmtTyDong } from "../untils/moneyFlowData";

// Cỡ chữ nhãn scale theo tỷ trọng: ô càng to chữ càng lớn, giống bản mẫu.
function labelSize(pct) {
  return Math.max(9, Math.min(26, Math.round(9 + Math.sqrt(pct) * 3.2)));
}

function sectorIcon(name = "") {
  const text = name.toLowerCase();
  if (text.includes("ngân hàng") || text.includes("tài chính")) return "🏦";
  if (text.includes("bất động")) return "🏢";
  if (text.includes("dịch vụ tài chính")) return "📈";
  if (text.includes("dược") || text.includes("y tế")) return "💊";
  if (text.includes("bán lẻ")) return "🛒";
  if (text.includes("công nghệ") || text.includes("phần mềm")) return "💻";
  if (text.includes("vận tải") || text.includes("kho bãi")) return "🚚";
  if (text.includes("năng lượng") || text.includes("điện")) return "⚡";
  if (text.includes("thực phẩm") || text.includes("đồ uống")) return "🍽";
  if (text.includes("hóa chất")) return "⚗";
  if (text.includes("xây dựng") || text.includes("vật liệu")) return "⚙";
  if (text.includes("nông nghiệp")) return "🌿";
  if (text.includes("tiện ích")) return "🍃";
  if (text.includes("khai khoáng")) return "⛏";
  return "•••";
}

export default function SectorFlowTreemap({ items, dark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const pageBg = dark ? "#16171d" : "#ffffff";
    const chart = echarts.init(containerRef.current);

    const data = toEchartsData(items).map((node) => {
      const fontSize = labelSize(node._pct);
      const showIcon = node._pct >= 2.4;
      return {
        ...node,
        _icon: sectorIcon(node.name),
        _showIcon: showIcon,
        label: {
          ...node.label,
          show: true,
          fontSize,
          lineHeight: Math.round(fontSize * 1.22),
          rich: {
            icon: {
              fontSize: Math.max(14, Math.round(fontSize * 1.05)),
              lineHeight: Math.max(24, Math.round(fontSize * 1.55)),
              align: "center",
              backgroundColor: "rgba(255,255,255,0.34)",
              borderRadius: 999,
              padding: [4, 6],
            },
          },
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
            formatter: (p) => {
              const icon = p.data._showIcon ? `{icon|${p.data._icon}}\n` : "";
              return `${icon}${p.name}\n${p.data._pct}%`;
            },
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
