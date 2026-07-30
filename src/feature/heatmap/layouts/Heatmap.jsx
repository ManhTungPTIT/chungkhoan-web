import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import { withLabelFontSize } from "../untils/treemapData";

// Định dạng % có dấu để hiển thị
const fmtPct = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

// Lá treemap = node có _pct (node ngành không có).
const isLeaf = (node) => node && node._pct !== undefined && node.name;

// Cỡ chữ chỉ đổi đáng kể khi diện tích khung đổi nhiều; vẽ lại mỗi lần
// ResizeObserver kêu (kéo cửa sổ = hàng chục lần/giây, ~1500 node/lần) là quá
// đắt mà mắt không thấy khác. Chỉ setOption lại khi diện tích lệch ≥ 10%.
const AREA_RERENDER_RATIO = 0.1;

export default function Heatmap({ data }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    // Gap giữa các nhóm VÀ giữa các mã đều tô bằng màu nền trang: nhóm tách
    // rời nhau, các ô trong nhóm cách nhau bằng đường kẻ trắng mảnh.
    //
    // Dải tên ngành trước đây là thanh nền tối chữ trắng canh trái; nay để trong
    // suốt (= nền trang) với chữ đậm màu tối canh giữa, đúng kiểu bảng giá: tên
    // ngành trông như nhãn nằm TRÊN nhóm chứ không phải một thanh header.
    const pageBg = dark ? "#16171d" : "#ffffff";
    const headerText = dark ? "#dfe3ec" : "#2c3140";

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
            fontWeight: "bold",
            // fontSize KHÔNG đặt ở đây: mỗi lá tự mang cỡ chữ theo diện tích ô
            // (withLabelFontSize). Đặt ở series sẽ đè lên và mọi ô lại bằng nhau.
            overflow: "truncate",
            formatter: (p) => {
              const d = p.data || {};
              if (!isLeaf(d)) return p.name;
              return `${p.name}\n${fmtPct(d._pct)}`;
            },
          },
          // nhãn tên ngành — chữ đậm màu tối, canh giữa, nền trong suốt.
          //
          // `align: "center"` MỘT MÌNH là sai: nó chỉ đổi neo chữ chứ không đổi
          // toạ độ vẽ (vẫn là mép trái dải), nên chữ bị neo giữa TẠI mép trái và
          // tràn hẳn ra ngoài nhóm — "Ngân hàng" hiện thành "hàng". Phải đặt
          // `position` về giữa dải rồi mới canh neo theo.
          upperLabel: {
            show: true,
            height: 22,
            color: headerText,
            fontWeight: "bold",
            fontSize: 12,
            position: ["50%", "50%"],
            align: "center",
            verticalAlign: "middle",
            padding: [0, 4],
            overflow: "truncate",
          },
          levels: [
            {
              // ngành: nền = nền trang (dải tên ngành trông "trong suốt");
              // gap nhỏ giữa các mã con tạo đường kẻ trắng mảnh
              upperLabel: { show: true },
              itemStyle: {
                color: pageBg,
                borderColor: pageBg,
                borderWidth: 0,
                gapWidth: 2,
              },
            },
            {
              // mã: màu lá đã gắn sẵn trong data; gap mảnh
              itemStyle: { borderColor: pageBg, borderWidth: 0, gapWidth: 2 },
            },
          ],
          data: [],
        },
      ],
    });

    // Cỡ chữ phụ thuộc diện tích khung → phải biết container đã layout xong,
    // không tính được lúc dựng option. `lastArea` chặn vẽ lại khi resize nhỏ.
    let lastArea = 0;
    const renderLabels = () => {
      const el = containerRef.current;
      if (!el) return;
      const area = el.clientWidth * el.clientHeight;
      if (!area) return;
      if (lastArea && Math.abs(area - lastArea) / lastArea < AREA_RERENDER_RATIO) return;
      lastArea = area;
      chart.setOption({ series: [{ data: withLabelFontSize(data, area) }] });
    };
    renderLabels();

    const onClick = (params) => {
      const d = params?.data;
      if (isLeaf(d)) navigate(`/?symbol=${encodeURIComponent(d.name)}`);
    };
    chart.on("click", onClick);

    const ro = new ResizeObserver(() => {
      chart.resize();
      renderLabels();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.off("click", onClick);
      chart.dispose();
    };
  }, [data, navigate]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
