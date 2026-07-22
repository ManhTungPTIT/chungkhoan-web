import { useState } from "react";
import "./styles/tplusWave.scss";
import { useTplusWave } from "./hooks/useTplusWave";
import TplusWaveRadar from "./layouts/TplusWaveRadar";

const WIN_MIN = 1;
const WIN_MAX = 30;
const WIN_MAX_COUNT = 6;

export default function TplusWavePage() {
  const [windows, setWindows] = useState([2, 3, 5]);
  const [draft, setDraft] = useState("");
  const windowsKey = windows.length ? windows.join(",") : "2,3,5";
  const { data, isLoading, isError } = useTplusWave(windowsKey);

  const addWindow = () => {
    const n = parseInt(draft, 10);
    setDraft("");
    if (!Number.isFinite(n) || n < WIN_MIN || n > WIN_MAX) return;
    setWindows((prev) =>
      prev.includes(n) || prev.length >= WIN_MAX_COUNT
        ? prev
        : [...prev, n].sort((a, b) => a - b),
    );
  };
  const removeWindow = (n) => setWindows((prev) => prev.filter((x) => x !== n));

  const hasData =
    data &&
    ((data.zones &&
      Object.values(data.zones).some((z) => (z?.symbols?.length ?? 0) > 0)) ||
      data.symbols.length > 0);

  return (
    <div className="tplus-wave-page">
      <div className="tplus-wave-controls">
        <span className="tplus-wave-controls__label">Chọn T+:</span>
        {windows.map((n) => (
          <button
            key={n}
            type="button"
            className="tplus-wave-chip"
            onClick={() => removeWindow(n)}
            title="Bỏ cửa sổ này"
          >
            T+{n} <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          type="number"
          min={WIN_MIN}
          max={WIN_MAX}
          value={draft}
          placeholder="vd 4"
          className="tplus-wave-controls__input"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWindow()}
        />
        <button
          type="button"
          className="tplus-wave-controls__add"
          onClick={addWindow}
          disabled={windows.length >= WIN_MAX_COUNT}
        >
          Thêm
        </button>
      </div>

      <div className="tplus-wave-chart">
        {isLoading ? (
          <div className="tplus-wave-state">Đang tải dữ liệu…</div>
        ) : isError ? (
          <div className="tplus-wave-state">Không tải được dữ liệu</div>
        ) : !hasData ? (
          <div className="tplus-wave-state">
            Hiện chưa có mã nào đang có sóng tăng ở các T+ đã chọn
          </div>
        ) : (
          <TplusWaveRadar payload={data} />
        )}
      </div>
    </div>
  );
}
