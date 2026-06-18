import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";

// Định dạng % có dấu để hiển thị
const fmtPct = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

// Lá treemap = node có _pct (node ngành không có).
const isLeaf = (node) => node && node._pct !== undefined && node.name;

export default function Heatmap({ data }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    // Gap giữa các nhóm tô bằng màu nền trang để các nhóm "tách rời";
    // header (dải tên nhóm) dùng nền tối + chữ trắng để nổi bật trên cả 2 theme.
    const pageBg = dark ? "#16171d" : "#ffffff";
    const headerBg = dark ? "#3a3d49" : "#3a3f4b";

    const chart = echarts.init(containerRef.current);

    chart.setOption({
      tooltip: {
        formatter: (info) => {
          const d = info.data || {};
          if (!isLeaf(d)) return info.name;
          return `${info.name}<br/>${fmtPct(d._pct)}<br/>Vốn hóa: ${d.value.toLocaleString("vi-VN")}`;
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
          // root: nền = màu trang; gap LỚN giữa các nhóm ngành để phân biệt rõ
          itemStyle: {
            color: pageBg,
            borderColor: pageBg,
            borderWidth: 0,
            gapWidth: 8,
          },
          label: {
            show: true,
            color: "#fff",
            fontSize: 11,
            overflow: "truncate",
            formatter: (p) => {
              const d = p.data || {};
              if (!isLeaf(d)) return p.name;
              return `${p.name}\n${fmtPct(d._pct)}`;
            },
          },
          // dải header ghi tên nhóm — nền tối, chữ trắng đậm, canh trái
          upperLabel: {
            show: true,
            height: 26,
            color: "#fff",
            fontWeight: "bold",
            fontSize: 13,
            align: "left",
            padding: [0, 8],
            overflow: "truncate",
          },
          levels: [
            {
              // ngành: nền dải header tối; gap nhỏ giữa các mã con (grout)
              upperLabel: { show: true },
              itemStyle: {
                color: headerBg,
                borderColor: headerBg,
                borderWidth: 0,
                gapWidth: 2,
              },
            },
            {
              // mã: màu lá đã gắn sẵn trong data; gap mảnh
              itemStyle: { borderColor: headerBg, borderWidth: 0, gapWidth: 2 },
            },
          ],
          data,
        },
      ],
    });

    const onClick = (params) => {
      const d = params?.data;
      if (isLeaf(d)) navigate(`/?symbol=${encodeURIComponent(d.name)}`);
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
