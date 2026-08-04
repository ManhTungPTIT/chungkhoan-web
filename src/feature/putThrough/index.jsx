import { useMemo, useState } from "react";
import "../../styles/treemapPage.scss";
import ChartHeader from "../../components/ChartHeader";
import { usePutThrough, DEFAULT_MIN_TY } from "./hooks/usePutThrough";
import { usePrefersDark } from "../../untils/usePrefersDark";
import { buildPutThrough } from "./untils/putThroughData";
import PutThroughTreemap from "./layouts/PutThroughTreemap";
import PutThroughTable from "./layouts/PutThroughTable";

function CashStackHeaderIcon() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Dòng tiền thực hiện">
      <path d="M8 22 32 10l24 12-24 12L8 22Z" fill="currentColor" opacity="0.95" />
      <path d="M8 32 32 44l24-12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
      <path d="M8 42 32 54l24-12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.48" />
      <path d="M25 20h14a5 5 0 0 1 0 8H25a5 5 0 0 1 0-8Zm7 3.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" fill="#1c338c" opacity="0.75" />
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

export default function PutThroughPage() {
  const { data, isLoading, isError } = usePutThrough(DEFAULT_MIN_TY);
  const dark = usePrefersDark();
  const [view, setView] = useState("chart");

  const { items, total } = useMemo(() => buildPutThrough(data, dark), [data, dark]);

  if (isLoading) {
    return <div className="tm-state">Đang tải giao dịch thỏa thuận…</div>;
  }
  if (isError) {
    return <div className="tm-state">Không tải được dữ liệu thỏa thuận</div>;
  }
  if (items.length === 0) {
    return (
      <div className="tm-state">
        Chưa mã nào đạt {DEFAULT_MIN_TY} tỷ giá trị thỏa thuận trong phiên
      </div>
    );
  }

  return (
    <div className="tm-page">
      <ChartHeader
        id="put-through-title"
        icon={<CashStackHeaderIcon />}
        title="CÁC MÃ GIAO DỊCH THỎA THUẬN (TỶ)"
        variant="blue"
        accent="#62d98b"
        className="tm-head tm-head--put-through"
        control={
          <div className="tm-toggle" role="group" aria-label="Chế độ xem">
            <button
              type="button"
              className={view === "chart" ? "is-active" : ""}
              aria-pressed={view === "chart"}
              onClick={() => setView("chart")}
            >
              <ChartButtonIcon />
              Biểu đồ
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
          <PutThroughTreemap items={items} total={total} dark={dark} />
        </div>
      ) : (
        <PutThroughTable items={items} total={total} />
      )}
    </div>
  );
}
