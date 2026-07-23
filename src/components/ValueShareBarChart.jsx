import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { fmtTy } from "../untils/valueBarFormat";
import "./valueShareBar.scss";

// Biểu đồ cột dùng chung cho dạng "một cột Tổng + các nhóm thành phần", mỗi cột
// mang HAI con số: giá trị (tỷ đồng) và % trên tổng.
//
// Dùng bởi: chart "Dòng tiền phe bò và phe gấu", "Dòng tiền theo nhóm giá cổ
// phiếu". Thêm biểu đồ cùng dạng thì tái dùng component này, đừng chép lại —
// phần khó ở đây là bố trí nhãn khi cột vừa thấp vừa hẹp (xem chú thích ở series).

export default function ValueShareBarChart({
  id,
  title,
  note,
  bars,
  isLoading,
  isError,
  onRetry,
  emptyText = "Chưa có dữ liệu khớp lệnh phiên này.",
}) {
  const containerRef = useRef(null);
  const hasData = bars.length > 0 && bars[0].value > 0;

  useEffect(() => {
    if (!containerRef.current || !hasData) return undefined;
    const chart = echarts.init(containerRef.current);

    chart.setOption({
      grid: { top: 52, left: 8, right: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const b = bars[p.dataIndex];
          return `${b.label}<br/>${fmtTy(b.ty)} tỷ<br/>${b.pct}%`;
        },
      },
      xAxis: {
        type: "category",
        data: bars.map((b) => b.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#c3c2b7" } },
        // interval:0 để không nhãn nào bị bỏ; width+break cho tên dài xuống dòng
        // thay vì chen sát nhau.
        axisLabel: {
          color: "#5c667a",
          fontSize: 11,
          interval: 0,
          width: 72,
          overflow: "break",
          lineHeight: 13,
        },
      },
      yAxis: {
        type: "value",
        name: "Tỷ đồng",
        nameTextStyle: { color: "#898781", fontSize: 11, align: "left" },
        axisLabel: { color: "#898781", fontSize: 11, formatter: (v) => fmtTy(v) },
        splitLine: { lineStyle: { color: "#e1e0d9" } },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 46,
          // Cả hai con số nằm TRÊN đầu cột: giá trị ở dòng trên, % ngay dưới nó.
          //
          // Đã thử đặt % vào TRONG cột như bản mẫu: hỏng khi biểu đồ có nhiều
          // cột — cột hẹp lại còn ~34px nên "37.44%" tràn hẳn ra hai bên mép, và
          // cột thấp thì không nhét được chữ nên phải xử lý riêng, dẫn tới hai
          // kiểu bố cục lẫn lộn trong cùng một biểu đồ. Đặt hết lên trên thì mọi
          // cột giống nhau, không phụ thuộc chiều cao lẫn bề rộng cột.
          label: { show: true, position: "top", fontWeight: 700, fontSize: 14 },
          data: bars.map((b) => ({
            value: b.ty,
            itemStyle: { color: b.color, borderRadius: [3, 3, 0, 0] },
            label: {
              formatter: `{v|${fmtTy(b.ty)}}\n{p|${b.pct}%}`,
              lineHeight: 15,
              rich: {
                v: { color: "#172033", fontWeight: 700, fontSize: 14 },
                // % lấy màu của chính cột để vẫn nhận ra thuộc cột nào.
                p: { color: b.color, fontWeight: 800, fontSize: 14 },
              },
            },
          })),
        },
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [bars, hasData]);

  const titleId = `${id}-title`;

  return (
    <section className="value-bar" aria-labelledby={titleId}>
      <header className="value-bar__header">
        <h2 id={titleId}>{title}</h2>
      </header>

      {isLoading && <div className="value-bar__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="value-bar__state value-bar__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={onRetry}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && !hasData && (
        <div className="value-bar__state">{emptyText}</div>
      )}

      {!isLoading && !isError && hasData && (
        <>
          <div className="value-bar__chart" ref={containerRef} />
          {note && <p className="value-bar__note">{note}</p>}
          <table className="value-bar__table">
            <caption className="sr-only">
              {title} — tổng {fmtTy(bars[0].ty)} tỷ đồng
            </caption>
            <thead>
              <tr>
                <th scope="col">Nhóm</th>
                <th scope="col">Giá trị (tỷ)</th>
                <th scope="col">%</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.key}>
                  <th scope="row">
                    <i style={{ background: b.color }} aria-hidden="true" />
                    {b.label}
                  </th>
                  <td>{fmtTy(b.ty)}</td>
                  <td>{b.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
