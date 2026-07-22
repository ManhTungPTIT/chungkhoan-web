import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import {
  buildRadarOption,
  buildSquareGridGraphic,
  buildSeriesRayGraphic,
  buildZonedPayload,
  computeAxisBounds,
} from "../untils/tplusWaveOption";

// Radar nhiều trục: mỗi trục 1 mã đang buy, 3 series = mức tăng cao nhất
// trong cửa sổ T+2/T+3/T+5 phiên kể từ ngày báo. Lưới nền là các hình vuông
// đồng tâm (graphic overlay); giá trị vẽ dạng TIA MÀU từ tâm tới điểm từng mã
// (không nối polygon vòng quanh) — cả hai đều pixel tuyệt đối, vẽ lại khi resize.
export default function TplusWaveRadar({ payload }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const chart = echarts.init(containerRef.current);
    // Radar 3 VÙNG khi BE trả `zones` (mỗi cửa sổ T+ top mã riêng, nhãn tô màu
    // vùng); BE cũ chưa có zones → dùng payload gốc (3 series chung bộ trục).
    const view = buildZonedPayload(payload) ?? payload;
    const bounds = computeAxisBounds(view);

    const drawGrid = () =>
      chart.setOption({
        graphic: [
          ...buildSquareGridGraphic(chart.getWidth(), chart.getHeight(), bounds),
          ...buildSeriesRayGraphic(chart.getWidth(), chart.getHeight(), bounds, view),
        ],
      });

    chart.setOption(buildRadarOption(view));
    drawGrid();

    // Click vào tên trục (mã) → mở mã đó trên trang chart chính.
    const onClick = (p) => {
      const sym = p?.name;
      if (sym && (view?.symbols ?? []).includes(sym)) {
        navigate(`/?symbol=${encodeURIComponent(sym)}`);
      }
    };
    chart.on("click", onClick);

    // Resize: chart co giãn xong mới vẽ lại lưới vuông theo kích thước mới.
    const ro = new ResizeObserver(() => {
      chart.resize();
      drawGrid();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.off("click", onClick);
      chart.dispose();
    };
  }, [payload, navigate]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
