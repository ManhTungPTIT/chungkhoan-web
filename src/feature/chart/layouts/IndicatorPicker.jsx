import { useState } from "react";
import { ALL_INDICATORS } from "./chart";

// Nút + dropdown chọn chỉ báo. Đặt cạnh mã cổ phiếu (trong panel info) nên
// tự bám theo mã ở mọi kích thước màn hình (kể cả mobile).
export default function IndicatorPicker({ active, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", zIndex: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          fontSize: "0.8rem",
          border: "1px solid var(--border, #d6dae3)",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Chỉ báo ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            padding: "6px 4px",
            minWidth: 200,
            maxHeight: "60dvh",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e6e8ef",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(16,24,40,0.12)",
            textAlign: "left",
            textTransform: "none",
          }}
        >
          {ALL_INDICATORS.map((ind) => (
            <label
              key={ind.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 10px",
                fontSize: "0.82rem",
                cursor: "pointer",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={!!active[ind.name]}
                onChange={() => onToggle(ind.name)}
              />
              {ind.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
