import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import {
  buildRadarOption,
  buildSquareGridGraphic,
  computeAxisBounds,
} from "../untils/tplusWaveOption";

// Radar nhiều trục: mỗi trục 1 mã đang buy, 3 series = mức tăng cao nhất
// trong cửa sổ T+2/T+3/T+5 phiên kể từ ngày báo. Lưới nền là các hình vuông
// đồng tâm (graphic overlay) thay cho lưới đa giác mặc định.
export default function TplusWaveRadar({ payload }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const chart = echarts.init(containerRef.current);
    const bounds = computeAxisBounds(payload);

    const drawGrid = () =>
      chart.setOption({
        graphic: buildSquareGridGraphic(chart.getWidth(), chart.getHeight(), bounds),
      });

    chart.setOption(buildRadarOption(payload));
    drawGrid();

    // Click vào tên trục (mã) → mở mã đó trên trang chart chính.
    const onClick = (p) => {
      const sym = p?.name;
      if (sym && (payload?.symbols ?? []).includes(sym)) {
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
