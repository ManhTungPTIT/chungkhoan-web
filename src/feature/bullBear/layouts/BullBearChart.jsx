import { useMemo } from "react";
import { BsCurrencyExchange } from "react-icons/bs";
import ValueShareBarChart from "../../../components/ValueShareBarChart";
import { useBullBear } from "../hooks/useBullBear";
import { buildBullBear } from "../untils/bullBearData";

function BullBearChart() {
  const { data, isLoading, isError, refetch } = useBullBear();
  const bars = useMemo(() => buildBullBear(data), [data]);

  return (
    <ValueShareBarChart
      id="bull-bear"
      title="DÒNG TIỀN PHE BÒ VÀ PHE GẤU"
      headerIcon={<BsCurrencyExchange />}
      headerTitle="CƠ CẤU DÒNG TIỀN PHE BÒ VÀ PHE GẤU"
      headerVariant="navy"
      headerAccent="#3fd0a6"
      note="Toàn thị trường 3 sàn · giá trị khớp lệnh · đơn vị: tỷ đồng"
      bars={bars}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}

export default BullBearChart;
