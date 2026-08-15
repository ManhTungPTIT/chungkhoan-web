import { BsBullseye } from "react-icons/bs";
import ChartHeader from "../../components/ChartHeader";
import "./styles/power.scss";
import { usePower } from "./hooks/usePower";
import { buildPowerDataNormal } from "./untils/powerDataNormal";
import PowerCircle from "./layouts/PowerCircle";

const LEGEND = [
  { color: "#2e9e5b", label: "Mã tăng giá tích cực" },
  { color: "#e53935", label: "Mã giảm tiêu cực" },
  { color: "#8e24aa", label: "Mã Dòng Tiền Vào Mạnh" },
];

// Trạng thái tải/lỗi vẫn dựng NGUYÊN khung trang (header + card): trả về mỗi
// dòng chữ thì panel trong lưới Biểu đồ thị trường thành cái hộp viền trống
// không tiêu đề, và ô ghép cặp bên cạnh mất mốc canh chiều cao.
function PowerBody({ data, isLoading, isError }) {
  if (isLoading) return <div className="power-state">Đang tải dữ liệu…</div>;
  if (isError) return <div className="power-state">Không tải được dữ liệu</div>;

  const powerData = buildPowerDataNormal(data);
  if (powerData.length === 0) {
    return <div className="power-state">Không có dữ liệu</div>;
  }

  return (
    <>
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
    </>
  );
}

export default function PowerPageNormal() {
  const { data, isLoading, isError } = usePower();

  return (
    <div className="power-page">
      {/* Tiêu đề nằm ở ĐÂY chứ không ở section của Biểu đồ thị trường: trang
          riêng /chart/power cũng dùng component này, mà chữ tiêu đề cũ vẽ trong
          canvas ECharts đã bị gỡ. */}
      <ChartHeader
        id="power-map-title"
        icon={<BsBullseye />}
        title="BẢN ĐỒ SỨC MẠNH DÒNG TIỀN"
        variant="navy"
        accent="#b06ae0"
        className="power-page__header"
      />
      <PowerBody data={data} isLoading={isLoading} isError={isError} />
    </div>
  );
}
