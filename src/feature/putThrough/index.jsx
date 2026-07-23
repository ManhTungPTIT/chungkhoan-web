import { useMemo, useState } from "react";
import "../../styles/treemapPage.scss";
import { usePutThrough, DEFAULT_MIN_TY } from "./hooks/usePutThrough";
import { usePrefersDark } from "../../untils/usePrefersDark";
import { buildPutThrough } from "./untils/putThroughData";
import PutThroughTreemap from "./layouts/PutThroughTreemap";
import PutThroughTable from "./layouts/PutThroughTable";

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
    // Ngưỡng {DEFAULT_MIN_TY} tỷ khiến đầu phiên thường chưa mã nào đạt — nói rõ
    // là "chưa đạt ngưỡng" chứ không phải lỗi tải dữ liệu.
    return (
      <div className="tm-state">
        Chưa mã nào đạt {DEFAULT_MIN_TY} tỷ giá trị thỏa thuận trong phiên
      </div>
    );
  }

  return (
    <div className="tm-page">
      <div className="tm-head">
        <h2 className="tm-title">Dòng tiền giao dịch thỏa thuận (đơn vị: tỷ)</h2>
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
      <p className="tm-note">
        3 sàn · chỉ giao dịch thỏa thuận (không gồm khớp lệnh) · từ {DEFAULT_MIN_TY} tỷ
        trở lên · màu theo ngành · cập nhật mỗi phút
      </p>

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
