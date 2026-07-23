import { useMemo, useState } from "react";
import "../../styles/treemapPage.scss";
import { useMoneyFlowSector } from "./hooks/useMoneyFlowSector";
import { usePrefersDark } from "../../untils/usePrefersDark";
import { buildMoneyFlow } from "./untils/moneyFlowData";
import SectorFlowTreemap from "./layouts/SectorFlowTreemap";
import SectorFlowTable from "./layouts/SectorFlowTable";

export default function MoneyFlowPage() {
  const { data, isLoading, isError } = useMoneyFlowSector();
  const dark = usePrefersDark();
  const [view, setView] = useState("chart");

  const { items, total } = useMemo(() => buildMoneyFlow(data, dark), [data, dark]);

  if (isLoading) {
    return <div className="tm-state">Đang tải dòng tiền theo ngành…</div>;
  }
  if (isError) {
    return <div className="tm-state">Không tải được dữ liệu ngành</div>;
  }
  if (items.length === 0) {
    return <div className="tm-state">Chưa có dữ liệu khớp lệnh phiên này</div>;
  }

  return (
    <div className="tm-page">
      <div className="tm-head">
        <h2 className="tm-title">Tỷ trọng dòng tiền khớp lệnh theo ngành</h2>
        <div className="tm-toggle" role="group" aria-label="Chế độ xem">
          <button
            type="button"
            className={view === "chart" ? "is-active" : ""}
            aria-pressed={view === "chart"}
            onClick={() => setView("chart")}
          >
            Biểu đồ
          </button>
          <button
            type="button"
            className={view === "table" ? "is-active" : ""}
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            Bảng
          </button>
        </div>
      </div>
      {/* Rổ VN100, giá trị khớp lệnh (đã loại thoả thuận) — nói rõ để không bị
          hiểu nhầm là tỷ trọng toàn thị trường. */}
      
      {view === "chart" ? (
        <div className="tm-chart">
          <SectorFlowTreemap items={items} dark={dark} />
        </div>
      ) : (
        <SectorFlowTable items={items} total={total} />
      )}
    </div>
  );
}
