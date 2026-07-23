import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { toEchartsData, fmtVolume } from "../untils/putThroughData";

// Nhãn ở đây là "MÃ <số tỷ>" (ngắn, 1 dòng) nên cỡ chữ bám theo TỶ TRỌNG của ô
// trong tổng, không bám giá trị tuyệt đối — phiên nhỏ vẫn có ô đầu chữ to.
function labelSize(share) {
  return Math.max(10, Math.min(28, Math.round(10 + Math.sqrt(share * 100) * 3.4)));
}

// Ô chiếm dưới ngưỡng này thì chữ không còn chỗ — bỏ nhãn, để tooltip mang tên.
const LABEL_MIN_SHARE = 0;

export default function PutThroughTreemap({ items, total, dark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const pageBg = dark ? "#16171d" : "#ffffff";
    const chart = echarts.init(containerRef.current);

    const data = toEchartsData(items).map((node) => {
      const share = total > 0 ? node.value / total : 0;
      const fontSize = labelSize(share);
      return {
        ...node,
        label: {
          ...node.label,
          show: true,
          fontSize,
          lineHeight: Math.round(fontSize * 1.3),
        },
      };
    });

    chart.setOption({
      tooltip: {
        formatter: (info) => {
          const d = info.data || {};
          const lines = [
            `<strong>${info.name}</strong>`,
            `Thỏa thuận: ${d._ty} tỷ`,
            `Khối lượng: ${fmtVolume(d._volume)} cp`,
            `Số lệnh: ${d._deals}`,
          ];
          if (d._group) lines.push(`Ngành: ${d._group}`);
          return lines.join("<br/>");
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          visibleMin: 0,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Màu đã gán cố định theo ngành ở tầng dữ liệu — không để ECharts tự
          // pha nhạt/đậm theo cấp.
          colorMappingBy: "id",
          itemStyle: {
            borderColor: pageBg,
            borderWidth: 1,
            gapWidth: 1,
            borderRadius: 4,
          },
          label: {
            show: true,
            fontWeight: "bold",
            overflow: "break",
            formatter: (p) => p.data._label,
          },
          emphasis: { itemStyle: { borderColor: pageBg, borderWidth: 2 } },
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
  }, [items, total, dark]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
