import { useMemo } from "react";
import ValueShareBarChart from "../../../components/ValueShareBarChart";
import { usePriceBands } from "../hooks/usePriceBands";
import { buildPriceBands } from "../untils/priceBandData";

function PriceBandChart() {
  const { data, isLoading, isError, refetch } = usePriceBands();
  const bars = useMemo(() => buildPriceBands(data), [data]);

  return (
    <ValueShareBarChart
      id="price-band"
      title="DÒNG TIỀN THEO NHÓM GIÁ CỔ PHIẾU"
      note="Toàn thị trường 3 sàn · giá trị khớp lệnh · đơn vị: tỷ đồng"
      bars={bars}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}

export default PriceBandChart;
