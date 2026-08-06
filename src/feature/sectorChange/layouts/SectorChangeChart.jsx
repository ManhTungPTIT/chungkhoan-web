import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { BsGraphUpArrow } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useSectorBreadth } from "../../../untils/useSectorBreadth";
import {
  buildSectorBreadth,
  fmtTy,
  fmtPct,
  UP_COLOR,
  DOWN_COLOR,
  VALUE_COLOR,
  valueLabelDistances,
} from "../../../untils/sectorBreadthSeries";
import "../../../components/sectorRows.scss";

const ROW_H = 22;
const AVG_PRICE_COLOR = "#e8b100";
// Phải khớp với `grid.left` / `grid.right` bên dưới — dùng để suy ra bề rộng
// vùng vẽ mà tính chỗ đặt nhãn.
const GRID_LEFT = 176;
const GRID_RIGHT = 56;
// Màn hẹp (điện thoại): cột tên ngành 176px nuốt gần nửa khung 390px, vùng vẽ
// còn ~158px nên nhãn của 3 series chen nhau quanh vạch 0. Compact: thu cột tên,
// thưa mốc trục, ẩn nhãn đường giá TB (tooltip vẫn còn đủ số).
const COMPACT_W = 520;
const GRID_LEFT_COMPACT = 120;
const GRID_RIGHT_COMPACT = 40;

// Trục % ĐỐI XỨNG quanh 0, làm tròn lên bội số 5 — mốc 0% phải đứng yên một chỗ,
// không nhảy theo dữ liệu từng phiên.
function pctAxisMax(rows) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.changePct)));
  return Math.ceil(max / 5) * 5;
}

// Trục tiền làm tròn lên bội số 500 cho nhãn chẵn.
function valueAxisMax(rows) {
  const max = Math.max(1, ...rows.map((r) => r.valueTy));
  return Math.ceil(max / 500) * 500;
}

function SectorChangeChart() {
  const { data, isLoading, isError, refetch } = useSectorBreadth();
  // Giữ NGUYÊN thứ tự BE trả (tổng GT khớp lệnh giảm dần) — chart này và "bản đồ
  // dòng tiền" phải xếp hàng y hệt nhau thì mới đối chiếu ngang được.
  const rows = useMemo(() => buildSectorBreadth(data), [data]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || rows.length === 0) return undefined;
    const chart = echarts.init(containerRef.current);

    const isCompact = () => (containerRef.current?.clientWidth || 0) < COMPACT_W;
    const gridLeft = () => (isCompact() ? GRID_LEFT_COMPACT : GRID_LEFT);
    const gridRight = () => (isCompact() ? GRID_RIGHT_COMPACT : GRID_RIGHT);

    // Bề rộng vùng vẽ để tính né chồng nhãn; tính lại mỗi lần đổi kích thước vì
    // khoảng cách né phụ thuộc số pixel trên một đơn vị trục.
    const plotWidth = () =>
      Math.max(0, (containerRef.current?.clientWidth || 0) - gridLeft() - gridRight());

    // Ba series chồng trên CÙNG một hàng, hai trục X: trục dưới là tiền (tỷ) cho
    // cột tím + đường giá trung bình, trục trên là % thay đổi cho cột xanh/đỏ.
    //
    // Lưu ý khi sửa: độ dài cột tím và cột xanh/đỏ KHÔNG so sánh được với nhau vì
    // chúng đo hai thang khác nhau. Bố cục này là lựa chọn có chủ đích của người
    // dùng (đã cân nhắc phương án tách hai khung riêng) — đừng "sửa" thành một
    // trục chung, mọi con số sẽ sai hết.
    const render = () => {
      const axisMax = valueAxisMax(rows);
      const distances = valueLabelDistances(rows, plotWidth(), axisMax);
      const compact = isCompact();
      chart.setOption({
      // Cột nhãn ngành đặt cố định bằng `left` thay vì containLabel — để nó tự co
      // thì tên ngành dài nuốt mất vùng vẽ.
      grid: { top: 34, left: gridLeft(), right: gridRight(), bottom: 34 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) => {
          const row = rows[items[0].dataIndex];
          return [
            `<strong>${row.name}</strong> · ${row.count} mã`,
            `Thay đổi bình quân: ${fmtPct(row.changePct)}`,
            `GT khớp lệnh: ${fmtTy(row.valueTy)} tỷ`,
            `Giá trung bình: ${row.avgPriceNghin} nghìn`,
          ].join("<br/>");
        },
      },
      xAxis: [
        {
          type: "value",
          position: "bottom",
          min: 0,
          max: axisMax,
          // 10 mốc trong vùng vẽ ~230px của điện thoại là dính chữ.
          splitNumber: compact ? 4 : 10,
          axisLabel: { color: "#898781", fontSize: 9, formatter: (v) => fmtTy(v) },
          splitLine: { lineStyle: { color: "#eceae4" } },
        },
        {
          type: "value",
          position: "top",
          min: -pctAxisMax(rows),
          max: pctAxisMax(rows),
          axisLabel: { color: "#898781", fontSize: 9, formatter: (v) => `${v}%` },
          splitLine: { lineStyle: { color: "#eceae4" } },
        },
      ],
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((r) => r.shortLabel),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#c3c2b7" } },
        axisLabel: {
          color: "#3d4756",
          fontSize: compact ? 9 : 10,
          // Cột tên compact hẹp hơn (120px) — tên dài cắt bớt, tên đầy đủ vẫn
          // đọc được trong tooltip.
          ...(compact ? { width: GRID_LEFT_COMPACT - 8, overflow: "truncate" } : {}),
        },
      },
      series: [
        {
          name: "Giá trị khớp lệnh (Tỷ)",
          type: "bar",
          xAxisIndex: 0,
          barWidth: 9,
          // z thấp nhất: cột tím có thể dài hết bề ngang (Ngân hàng ~5.700 tỷ) và
          // sẽ phủ lên cột % cùng nhãn của nó nếu vẽ đè lên trên.
          z: 1,
          itemStyle: { color: VALUE_COLOR },
          label: {
            show: true,
            position: "right",
            fontSize: 9,
            color: "#4a4a55",
            // Viền trắng mảnh: ba series chồng nhau nên nhãn nào cũng có thể rơi
            // trúng cột của series khác.
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => (p.value > 0 ? fmtTy(p.value) : ""),
          },
          // Compact: vùng vẽ ~230px không đủ cho nhãn GT + nhãn % cùng chen quanh
          // vạch 0 ở mọi hàng — nhãn nào đè thì ẩn, tooltip vẫn đủ số.
          ...(compact ? { labelLayout: { hideOverlap: true } } : {}),
          data: rows.map((r, i) => ({
            value: r.valueTy,
            // Ngành giao dịch ít thì cột tím quá ngắn, nhãn của nó rơi trúng nhãn
            // vàng ở sát mép trái → đẩy sang phải vừa đủ (xem valueLabelDistances).
            label: { distance: distances[i] },
          })),
        },
        {
          name: "% thay đổi",
          type: "bar",
          xAxisIndex: 1,
          barWidth: 9,
          // barGap -100%: nằm CHỒNG lên cột tím trong cùng hàng thay vì đứng cạnh.
          // Hai cột không đè nhau về mặt hình vì tiền tính từ mép trái còn % tính
          // từ mốc 0% ở giữa trục trên.
          barGap: "-100%",
          z: 2,
          ...(compact ? { labelLayout: { hideOverlap: true } } : {}),
          label: {
            show: true,
            fontSize: 9,
            fontWeight: 700,
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => fmtPct(p.value),
          },
          data: rows.map((r) => {
            const up = r.changePct >= 0;
            return {
              value: r.changePct,
              itemStyle: { color: up ? UP_COLOR : DOWN_COLOR },
              label: {
                color: up ? UP_COLOR : DOWN_COLOR,
                // position phải đặt trên TỪNG điểm: dạng hàm ở cấp series không
                // được ECharts áp dụng, nhãn rơi về đầu cột thay vì cuối cột.
                position: up ? "right" : "left",
              },
            };
          }),
        },
        {
          name: "Đường giá trung bình (Nghìn)",
          type: "line",
          xAxisIndex: 0,
          symbol: "circle",
          symbolSize: 7,
          itemStyle: { color: "#fff", borderColor: AVG_PRICE_COLOR, borderWidth: 1.6 },
          lineStyle: { color: AVG_PRICE_COLOR, width: 1 },
          label: {
            // Compact TẮT nhãn giá TB: đây là nguồn chen chính quanh vạch 0
            // ("34.3" + "-3.12%" dính thành "34.3.2%"); tooltip vẫn có đủ số.
            show: !compact,
            position: "right",
            distance: 4,
            fontSize: 9,
            color: "#a07c00",
            textBorderColor: "#fff",
            textBorderWidth: 2.5,
            formatter: (p) => (p.value > 0 ? p.value : ""),
          },
          data: rows.map((r) => r.avgPriceNghin),
          z: 4,
        },
      ],
      });
    };

    render();
    const ro = new ResizeObserver(() => {
      chart.resize();
      render();
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [rows]);

  return (
    <section className="sector-rows" aria-labelledby="sector-change-title">
      <ChartHeader
        id="sector-change-title"
        icon={<BsGraphUpArrow />}
        title=" DIỄN GIẢI CHI TIẾT DÒNG TIỀN TÍCH CỰC - TIÊU CỰC NGÀNH"
        variant="navy"
        accent="#e061b8"
        className="sector-rows__header"
      />

      {isLoading && <div className="sector-rows__state">Đang tải dữ liệu…</div>}
      {isError && (
        <div className="sector-rows__state sector-rows__state--error">
          Không tải được dữ liệu.
          <button type="button" onClick={() => refetch()}>Thử lại</button>
        </div>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <div className="sector-rows__state">Chưa có dữ liệu thị trường.</div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <ul className="sector-rows__legend" aria-label="Chú giải">
            <li>
              <i style={{ background: VALUE_COLOR }} aria-hidden="true" />
              Giá trị khớp lệnh (Tỷ)
            </li>
            <li>
              <i
                className="sector-rows__legend-ring"
                style={{ borderColor: AVG_PRICE_COLOR }}
                aria-hidden="true"
              />
              Đường giá trung bình (Nghìn)
            </li>
            <li>
              <i style={{ background: UP_COLOR }} aria-hidden="true" />
              Mã tăng giá
            </li>
            <li>
              <i style={{ background: DOWN_COLOR }} aria-hidden="true" />
              Mã giảm giá
            </li>
          </ul>
          <div
            className="sector-rows__chart"
            ref={containerRef}
            style={{ height: `${rows.length * ROW_H + 90}px` }}
          />
         
        </>
      )}
    </section>
  );
}

export default SectorChangeChart;
