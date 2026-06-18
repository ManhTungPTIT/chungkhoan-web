import "./styles/power.scss";
import { useVn100 } from "../chart/hooks/useVn100";
import { buildPowerData } from "./untils/powerData";
import PowerCircle from "./layouts/PowerCircle";

const LEGEND = [
  { color: "#2e9e5b", label: "Mã tăng giá tích cực" },
  { color: "#e53935", label: "Mã giảm tiêu cực" },
  { color: "#8e24aa", label: "Mã Dòng Tiền Vào Mạnh" },
];

export default function PowerPage() {
  const { data, isLoading, isError } = useVn100();

  if (isLoading) {
    return <div className="power-state">Đang tải dữ liệu…</div>;
  }
  if (isError) {
    return <div className="power-state">Không tải được dữ liệu</div>;
  }

  const powerData = buildPowerData(data);
  if (powerData.length === 0) {
    return <div className="power-state">Không có dữ liệu</div>;
  }

  return (
    <div className="power-page">
      <div className="power-legend">
        {LEGEND.map((l) => (
          <span key={l.label} className="power-legend-item">
            <i style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <div className="power-chart">
        <PowerCircle data={powerData} />
      </div>
    </div>
  );
}
