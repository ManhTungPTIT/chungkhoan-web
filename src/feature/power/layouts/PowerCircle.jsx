import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import { colorForCategory } from "../untils/powerData";

const fmtPct = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

// Chỗ chừa cho VÀNH NHÃN MÃ vẽ bên ngoài đường tròn: `axisLabel.margin` 8 + bề
// ngang chữ (mã 3–4 ký tự ở fontSize 10) ≈ 22. Thiếu khoản này thì nhãn ở hai
// mép trái/phải bị cắt cụt.
const LABEL_RING = 30;

/**
 * Bán kính ngoài tính bằng PX theo ô vẽ thật, thay cho phần trăm cố định.
 *
 * ECharts tính `radius: "72%"` theo **cạnh ngắn** của ô. Ô vẽ ở đây gần như không
 * bao giờ vuông (desktop 1440×770, điện thoại 359×702), nên một con số phần trăm
 * hợp cạnh này thì hụt cạnh kia: đo được dư 185px chiều dọc trên desktop và hơn
 * 400px trên điện thoại. Tính theo px thì đường tròn luôn ăn hết cạnh ngắn, chỉ
 * chừa lại vành nhãn.
 */
function outerRadiusPx(width, height) {
  const half = Math.min(width, height) / 2;
  // Sàn 40px để ô quá nhỏ (lúc đang dựng layout, width≈0) không ra bán kính âm.
  return Math.max(40, half - LABEL_RING);
}

export default function PowerCircle({ data }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = containerRef.current;
    const chart = echarts.init(el);
    const box = { width: el.clientWidth, height: el.clientHeight };

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
      // center 50%/50%: mốc lệch (54% cũ, rồi 42%) là để né title vẽ trong canvas
      // và để bù phần dư; title đã chuyển ra ngoài, còn phần dư thì nay hết vì bán
      // kính tính theo px. Lệch tâm chỉ dồn khoảng trắng về một phía chứ không bớt.
      polar: {
        radius: ["4%", outerRadiusPx(box.width, box.height)],
        center: ["50%", "50%"],
      },
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

    // Bán kính là px nên PHẢI tính lại khi ô đổi kích thước — `chart.resize()` một
    // mình chỉ kéo canvas, đường tròn vẫn giữ nguyên bán kính cũ.
    const ro = new ResizeObserver(() => {
      chart.resize();
      chart.setOption({
        polar: {
          radius: ["4%", outerRadiusPx(el.clientWidth, el.clientHeight)],
          center: ["50%", "50%"],
        },
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.off("click", onClick);
      chart.dispose();
    };
  }, [data, navigate]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
