import { useMemo, useState } from "react";
import "../../styles/treemapPage.scss";
import ChartHeader from "../../components/ChartHeader";
import { useMoneyFlowSector } from "./hooks/useMoneyFlowSector";
import { usePrefersDark } from "../../untils/usePrefersDark";
import { buildMoneyFlow } from "./untils/moneyFlowData";
import SectorFlowTreemap from "./layouts/SectorFlowTreemap";
import SectorFlowTable from "./layouts/SectorFlowTable";

function SectorHeaderIcon() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Phân bổ dòng vốn">
      <path d="M32 8a24 24 0 1 0 24 24H39.5A7.5 7.5 0 1 1 32 24.5V8Z" fill="currentColor" opacity="0.9" />
      <path d="M38 7v19h19A24 24 0 0 0 38 7Z" fill="currentColor" opacity="0.55" />
      <path d="M42 31h16a25 25 0 0 1-6.6 16.9L40.1 36.6A8 8 0 0 0 42 31Z" fill="currentColor" opacity="0.72" />
      <path d="M32 2a30 30 0 1 0 30 30" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.45" />
    </svg>
  );
}

function ChartButtonIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 14h14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12V8m4 4V4m4 8V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 6.5 7 4l3 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TableButtonIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 3h12v12H3zM3 7h12M3 11h12M7 3v12M11 3v12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
      <ChartHeader
        id="money-flow-title"
        icon={<SectorHeaderIcon />}
        title="PHÂN BỔ DÒNG VỐN THEO NGÀNH"
        variant="teal"
        accent="#62d98b"
        className="tm-head tm-head--moneyflow"
        control={
          <div className="tm-toggle" role="group" aria-label="Chế độ xem">
            <button
              type="button"
              className={view === "chart" ? "is-active" : ""}
              aria-pressed={view === "chart"}
              onClick={() => setView("chart")}
            >
              <ChartButtonIcon />
              Chi tiết
            </button>
            <button
              type="button"
              className={view === "table" ? "is-active" : ""}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <TableButtonIcon />
              Bảng
            </button>
          </div>
        }
      />

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
