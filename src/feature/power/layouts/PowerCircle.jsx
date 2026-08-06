import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import { colorForCategory } from "../untils/powerData";

const fmtPct = (pct) => `${pct >= 0 ? "+" : ""}${pct}%`;

// Chỗ chừa cho VÀNH NHÃN MÃ vẽ bên ngoài đường tròn: `axisLabel.margin` 8 + bề
// ngang chữ. Mã 3–4 ký tự ở 11px ĐẬM rộng ~32px, nên 40 chứ không phải 30 — mốc
// 30 tính hồi nhãn còn 10px nét thường, giữ nguyên thì trên màn hẹp (vòng tròn ăn
// hết bề ngang) nhãn ở hai mép trái/phải bị cắt cụt.
const LABEL_RING = 40;

// Cỡ chữ tên mã. Phải đi kèm fontWeight 700 ở CẢ axisLabel lẫn từng style rich —
// xem chú thích tại chỗ khai báo rich bên dưới.
const LABEL_SIZE = 11;

// Màu lưới: #e5e5e5 cũ gần như chìm vào nền trắng, nan hoa và vòng đồng tâm không
// đọc ra được. #ccd2dc còn nhạt hơn chữ nhiều nên không tranh chỗ với dữ liệu.
const GRID_COLOR = "#ccd2dc";

// Bề ngang tia. 55% cũ làm các tia gần như dính nhau, che hết nan hoa của lưới nên
// vòng tròn trông thành một khối đặc, thô. 36% để lộ lưới giữa các tia.
const BAR_WIDTH = "36%";

// Phần bán kính thực dùng sau khi đã trừ vành nhãn. Ăn trọn cạnh ngắn (1.0) thì
// đường tròn chạm sát mép trên/dưới của ô, trông chật và nhãn mã dính vào viền
// khung. 0.82 chừa một vành trống quanh biểu đồ.
const CIRCLE_SCALE = 0.82;

/**
 * Bán kính ngoài tính bằng PX theo ô vẽ thật, thay cho phần trăm cố định.
 *
 * ECharts tính `radius: "72%"` theo **cạnh ngắn** của ô. Ô vẽ ở đây gần như không
 * bao giờ vuông (desktop 1440×770, điện thoại 359×702), nên một con số phần trăm
 * hợp cạnh này thì hụt cạnh kia: đo được dư 185px chiều dọc trên desktop và hơn
 * 400px trên điện thoại. Tính theo px thì đường tròn bám đúng cạnh ngắn, chừa vành
 * nhãn rồi mới thu lại theo CIRCLE_SCALE.
 */
function outerRadiusPx(width, height) {
  const half = Math.min(width, height) / 2;
  // Sàn 40px để ô quá nhỏ (lúc đang dựng layout, width≈0) không ra bán kính âm.
  return Math.max(40, (half - LABEL_RING) * CIRCLE_SCALE);
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
        splitLine: { show: true, lineStyle: { color: GRID_COLOR } },
        axisLabel: {
          interval: 0, // ép hiện TẤT CẢ nhãn (mặc định "auto" tự ẩn nhãn chen nhau)
          fontSize: LABEL_SIZE,
          margin: 8,
          fontWeight: 700,
          // ECharts 6 không áp dụng color dạng hàm cho angleAxis → dùng rich text:
          // mỗi mã gắn style theo nhóm để nhãn cùng màu với tia của nó.
          formatter: (value, index) =>
            `{${data[index]?.category ?? "green"}|${value}}`,
          // ⚠️ `fontWeight` PHẢI lặp lại trong từng style rich. Khối rich không kế
          // thừa thuộc tính của axisLabel cha, nên đặt fontWeight ở trên mà quên ở
          // đây thì nhãn vẫn vẽ nét thường — đó chính là lý do tên mã trông mờ.
          rich: {
            green: { color: colorForCategory("green"), fontSize: LABEL_SIZE, fontWeight: 700 },
            red: { color: colorForCategory("red"), fontSize: LABEL_SIZE, fontWeight: 700 },
            purple: { color: colorForCategory("purple"), fontSize: LABEL_SIZE, fontWeight: 700 },
          },
        },
      },
      radiusAxis: {
        min: 0,
        max: maxMag,
        axisLabel: { fontSize: 10, color: "#6b7280" },
        splitLine: { lineStyle: { color: GRID_COLOR } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          coordinateSystem: "polar",
          barWidth: BAR_WIDTH,
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
