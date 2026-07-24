import { useCallback, useMemo } from "react";
import { BsCashCoin } from "react-icons/bs";
import StackedSessionBarChart from "../../../components/StackedSessionBarChart";
import { useSectorFlow } from "../../../untils/useSectorFlow";
import {
  buildSectorFlowSeries,
  labelThreshold,
  MIN_LABEL_TY,
} from "../../../untils/sectorFlowSeries";

const fmt = (ty) => ty.toLocaleString("vi-VN");

function SectorFlowValueChart({ sessions = 5 }) {
  const { data, isLoading, isError, refetch } = useSectorFlow(sessions);
  const series = useMemo(() => buildSectorFlowSeries(data), [data]);
  const pick = useCallback((g, i) => g.tys[i], []);
  // Đỉnh trục ≈ cột cao nhất → ngưỡng nhãn theo chiều cao khúc, không theo con số.
  const minLabel = useMemo(() => {
    const perSession = series.labels.map((_, i) =>
      series.industries.reduce((sum, g) => sum + g.tys[i], 0),
    );
    return labelThreshold(Math.max(0, ...perSession), MIN_LABEL_TY);
  }, [series]);

  return (
    <StackedSessionBarChart
      id="sector-flow-value"
      title={`GIÁ TRỊ TIỀN KHỚP LỆNH ${sessions} PHIÊN GẦN NHẤT (ĐV: TỶ)`}
      headerIcon={<BsCashCoin />}
      headerTitle={`TỔNG GIÁ TRỊ LỆNH KHỚP ${sessions} PHIÊN GẦN ĐÂY`}
      headerVariant="navy"
      headerAccent="#e6b52e"
      note="Toàn thị trường 3 sàn · giá trị ≈ khối lượng × giá đóng cửa · ngành ICB cấp 3"
      labels={series.labels}
      industries={series.industries}
      pick={pick}
      minLabel={minLabel}
      formatLabel={fmt}
      axisName="Tỷ đồng"
      axisFormatter={fmt}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}

export default SectorFlowValueChart;
