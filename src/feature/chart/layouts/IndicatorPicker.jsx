import { useState, useEffect, useRef } from "react";
import { ALL_INDICATORS } from "./chart";
import { TbMathFunction } from "react-icons/tb";


// Nút + dropdown chọn chỉ báo. Đặt cạnh mã cổ phiếu (trong panel info) nên
// tự bám theo mã ở mọi kích thước màn hình (kể cả mobile).
export default function IndicatorPicker({ active, onToggle }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  // Bấm ra ngoài nút + dropdown → đóng. pointerdown để bắt cả chuột lẫn chạm.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Lọc theo tên (VD: "EMA") hoặc nhãn (VD: "Khối lượng"), bỏ qua hoa/thường.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ALL_INDICATORS.filter(
        (ind) =>
          ind.name.toLowerCase().includes(q) ||
          ind.label.toLowerCase().includes(q),
      )
    : ALL_INDICATORS;

  return (
    <div ref={rootRef} translate="no" style={{ position: "relative", zIndex: 20 }}>
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
      <TbMathFunction />
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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm chỉ báo..."
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              margin: "0 0 6px",
              padding: "6px 10px",
              fontSize: "0.82rem",
              border: "1px solid var(--border, #d6dae3)",
              borderRadius: 6,
              outline: "none",
            }}
          />
          {filtered.length === 0 && (
            <div
              style={{
                padding: "8px 10px",
                fontSize: "0.8rem",
                color: "#98a2b3",
                whiteSpace: "nowrap",
              }}
            >
              Không tìm thấy chỉ báo
            </div>
          )}
          {filtered.map((ind) => (
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
