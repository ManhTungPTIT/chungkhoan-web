import "./styles/tplusWave.scss";
import { useTplusWave } from "./hooks/useTplusWave";
import TplusWaveRadar from "./layouts/TplusWaveRadar";

export default function TplusWavePage() {
  const { data, isLoading, isError } = useTplusWave();

  if (isLoading) {
    return <div className="tplus-wave-state">Đang tải dữ liệu…</div>;
  }
  if (isError) {
    return <div className="tplus-wave-state">Không tải được dữ liệu</div>;
  }
  if (!data || data.symbols.length === 0) {
    return <div className="tplus-wave-state">Hiện chưa có mã nào đang có sóng tăng T+</div>;
  }

  return (
    <div className="tplus-wave-page">
      <div className="tplus-wave-chart">
        <TplusWaveRadar payload={data} />
      </div>
    </div>
  );
}
