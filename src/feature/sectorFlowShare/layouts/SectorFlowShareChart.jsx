import { useCallback, useMemo } from "react";
import { BsPieChartFill } from "react-icons/bs";
import StackedSessionBarChart from "../../../components/StackedSessionBarChart";
import { useSectorFlow } from "../../../untils/useSectorFlow";
import {
  buildSectorFlowSeries,
  labelThreshold,
  MIN_LABEL_PCT,
} from "../../../untils/sectorFlowSeries";

const fmt = (pct) => `${pct}%`;

function SectorFlowShareChart({ sessions = 5 }) {
  const { data, isLoading, isError, refetch } = useSectorFlow(sessions);
  const series = useMemo(() => buildSectorFlowSeries(data), [data]);
  const pick = useCallback((g, i) => g.pcts[i], []);

  return (
    <StackedSessionBarChart
      id="sector-flow-share"
      title={`TỶ TRỌNG GIÁ TRỊ TIỀN KHỚP LỆNH ${sessions} PHIÊN GẦN NHẤT`}
      headerIcon={<BsPieChartFill />}
      headerTitle={`CƠ CẤU TỶ TRỌNG GIÁ TRỊ LỆNH KHỚP ${sessions} PHIÊN GẦN ĐÂY`}
      headerVariant="navy"
      headerAccent="#5aa9ff"
      note="Tự chuẩn hóa nên mỗi cột luôn đủ 100% · ngành ICB cấp 3"
      labels={series.labels}
      industries={series.industries}
      pick={pick}
      minLabel={labelThreshold(100, MIN_LABEL_PCT)}
      formatLabel={fmt}
      axisName="Tỷ trọng (%)"
      axisMax={100}
      axisFormatter={(v) => `${v}%`}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}

export default SectorFlowShareChart;
