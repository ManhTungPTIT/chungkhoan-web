import { useState, useCallback } from "react";

/* ─────────────────── DATA ─────────────────── */
const CASE_LABELS = {
  new: "Mở TK mới",
  expired: "Giấy tờ hết hạn",
  info: "Thay đổi thông tin",
  upgrade: "Nâng hạn mức",
  ekyc: "eKYC thất bại",
  unlock: "Mở khóa TK",
  org: "Tổ chức / NN",
};

const CASE_COUNTS = {
  new: 142,
  expired: 58,
  info: 31,
  upgrade: 24,
  ekyc: 18,
  unlock: 7,
  org: 4,
};

const AVATAR_COLORS = [
  { bg: "#1e3a5f", c: "#60a5fa" },
  { bg: "#14532d", c: "#4ade80" },
  { bg: "#2e1065", c: "#c084fc" },
  { bg: "#451a03", c: "#fb923c" },
  { bg: "#134e4a", c: "#2dd4bf" },
];

const INITIAL_ROWS = [
  {
    id: "KH-03421",
    init: "TH",
    name: "Trần Thị Hương",
    cas: "new",
    doc: "CCCD gắn chip",
    date: "15/05/2026",
    hrs: 2,
    status: "pending",
    cccd: "079203012345",
    dob: "12/04/1995",
    phone: "0901 234 567",
    addr: "12 Nguyễn Huệ, Q.1, TP.HCM",
    faceScore: null,
  },
  {
    id: "KH-02891",
    init: "NL",
    name: "Ngô Văn Long",
    cas: "expired",
    doc: "Hộ chiếu",
    date: "14/05/2026",
    hrs: 26,
    status: "pending",
    cccd: "B3421098",
    dob: "08/11/1980",
    phone: "0912 345 678",
    addr: "45 Lê Duẩn, Q. Hải Châu, Đà Nẵng",
    faceScore: null,
  },
  {
    id: "KH-00589",
    init: "PD",
    name: "Phạm Thị Duyên",
    cas: "ekyc",
    doc: "CCCD gắn chip",
    date: "13/05/2026",
    hrs: 51,
    status: "fail",
    cccd: "001200078901",
    dob: "30/06/1992",
    phone: "0934 567 890",
    addr: "78 Trần Phú, Q. Ninh Kiều, Cần Thơ",
    faceScore: 54,
  },
  {
    id: "KH-01102",
    init: "VB",
    name: "Vũ Đình Bắc",
    cas: "upgrade",
    doc: "CCCD gắn chip",
    date: "13/05/2026",
    hrs: 49,
    status: "pending",
    cccd: "031084001234",
    dob: "22/03/1984",
    phone: "0978 901 234",
    addr: "99 Bà Triệu, Q. Hai Bà Trưng, HN",
    faceScore: null,
  },
  {
    id: "KH-04231",
    init: "LM",
    name: "Lê Thị Mai",
    cas: "info",
    doc: "CCCD gắn chip",
    date: "12/05/2026",
    hrs: 72,
    status: "pending",
    cccd: "056196054321",
    dob: "15/09/1996",
    phone: "0945 678 901",
    addr: "23 Pasteur, Q.3, TP.HCM",
    faceScore: null,
  },
  {
    id: "KH-00312",
    init: "HD",
    name: "Huỳnh Tấn Đạt",
    cas: "unlock",
    doc: "CCCD gắn chip",
    date: "12/05/2026",
    hrs: 74,
    status: "pending",
    cccd: "079180098765",
    dob: "04/01/1980",
    phone: "0923 456 789",
    addr: "56 Võ Thị Sáu, Q.3, TP.HCM",
    faceScore: null,
  },
  {
    id: "KH-00089",
    init: "CT",
    name: "Cty TNHH Ánh Sao",
    cas: "org",
    doc: "Giấy phép KD",
    date: "11/05/2026",
    hrs: 96,
    status: "pending",
    cccd: "0312456789",
    dob: "—",
    phone: "028 3456 7890",
    addr: "Tầng 8, 123 Đinh Tiên Hoàng, Q.1",
    faceScore: null,
  },
  {
    id: "KH-05012",
    init: "BQ",
    name: "Bùi Thanh Quang",
    cas: "new",
    doc: "Hộ chiếu",
    date: "15/05/2026",
    hrs: 1,
    status: "pending",
    cccd: "P9876543",
    dob: "17/12/1990",
    phone: "0967 890 123",
    addr: "34 Nguyễn Trãi, Q.5, TP.HCM",
    faceScore: null,
  },
];

/* ─────────────────── HELPERS ─────────────────── */
function hrsLabel(h) {
  if (h < 1) return "< 1 giờ";
  if (h < 24) return `${h} giờ`;
  const d = Math.floor(h / 24),
    r = h % 24;
  return r ? `${d}n ${r}h` : `${d} ngày`;
}

function CaseBadge({ cas }) {
  const styles = {
    new: { bg: "#0f2942", c: "#60a5fa", border: "#1e4976" },
    expired: { bg: "#2d1b00", c: "#fb923c", border: "#6b3a00" },
    info: { bg: "#1e0a4a", c: "#c084fc", border: "#4c1d95" },
    upgrade: { bg: "#0d3321", c: "#4ade80", border: "#14532d" },
    ekyc: { bg: "#2d0a0a", c: "#f87171", border: "#7f1d1d" },
    unlock: { bg: "#1a2040", c: "#818cf8", border: "#3730a3" },
    org: { bg: "#0f2942", c: "#22d3ee", border: "#155e75" },
  };
  const s = styles[cas] || styles.new;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        background: s.bg,
        color: s.c,
        border: `0.5px solid ${s.border}`,
      }}
    >
      {CASE_LABELS[cas]}
    </span>
  );
}

function StatusBadge({ status }) {
  const s =
    status === "fail"
      ? { bg: "#2d0a0a", c: "#f87171", border: "#7f1d1d", label: "eKYC lỗi" }
      : { bg: "#2d1b00", c: "#fb923c", border: "#6b3a00", label: "Chờ duyệt" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.c,
        border: `0.5px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ init, idx, size = 30 }) {
  const av = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: av.bg,
        color: av.c,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
        border: `1px solid ${av.c}30`,
      }}
    >
      {init}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      style={{
        background: "#161b27",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#8b92a8",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

/* ─────────────────── DETAIL PANEL ─────────────────── */
function DetailPanel({ row, idx, onClose, onApprove, onReject }) {
  const [note, setNote] = useState("");
  if (!row) return null;

  const urgent = row.hrs >= 48;

  return (
    <div
      style={{
        background: "#161b27",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 20,
        marginTop: 14,
        animation: "slideIn 0.18s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <Avatar init={row.init} idx={idx} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{row.name}</div>
          <div style={{ fontSize: 11, color: "#8b92a8", marginTop: 2 }}>
            {row.id} · {row.doc} · Nộp {row.date}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CaseBadge cas={row.cas} />
          {urgent && (
            <span
              style={{
                background: "#2d0a0a",
                color: "#f87171",
                border: "0.5px solid #7f1d1d",
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              ⚠ Khẩn
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#8b92a8",
            cursor: "pointer",
            fontSize: 18,
            padding: 4,
            borderRadius: 6,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Alert banners */}
      {row.status === "fail" && (
        <div
          style={{
            background: "#2d0a0a",
            border: "0.5px solid #7f1d1d",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#f87171",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span>⚠</span>
          <span>
            eKYC tự động thất bại — độ tương đồng khuôn mặt đạt{" "}
            <strong>{row.faceScore}%</strong> (ngưỡng 80%). Cần admin xét duyệt
            thủ công.
          </span>
        </div>
      )}
      {row.cas === "upgrade" && (
        <div
          style={{
            background: "#2d1b00",
            border: "0.5px solid #6b3a00",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#fb923c",
            display: "flex",
            gap: 8,
          }}
        >
          <span>↑</span>
          <span>
            Yêu cầu nâng hạn mức giao dịch từ <strong>500 triệu</strong> lên{" "}
            <strong>2 tỷ đồng/ngày</strong>. Cần xác minh bổ sung.
          </span>
        </div>
      )}
      {row.cas === "unlock" && (
        <div
          style={{
            background: "#1e0a4a",
            border: "0.5px solid #4c1d95",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#c084fc",
            display: "flex",
            gap: 8,
          }}
        >
          <span>🔓</span>
          <span>
            TK bị khóa do 5 lần nhập sai mật khẩu. KH đã nộp giải trình và xác
            minh lại danh tính.
          </span>
        </div>
      )}
      {row.cas === "expired" && (
        <div
          style={{
            background: "#2d1b00",
            border: "0.5px solid #6b3a00",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#fb923c",
            display: "flex",
            gap: 8,
          }}
        >
          <span>📅</span>
          <span>
            Giấy tờ tùy thân hết hạn. KH đã nộp giấy tờ mới để cập nhật hồ sơ.
          </span>
        </div>
      )}

      {/* Info grid */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555e74",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        Thông tin định danh
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {[
          ["Số CCCD / Hộ chiếu", row.cccd],
          ["Ngày sinh", row.dob],
          ["Số điện thoại", row.phone],
          ["Địa chỉ", row.addr],
        ].map(([label, val]) => (
          <div
            key={label}
            style={{
              background: "#1c2334",
              borderRadius: 8,
              padding: "9px 12px",
              gridColumn: label === "Địa chỉ" ? "span 2" : undefined,
            }}
          >
            <div style={{ fontSize: 11, color: "#8b92a8", marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Documents */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555e74",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        Tài liệu đính kèm
      </div>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
      >
        {[
          { label: "Mặt trước CCCD", icon: "🪪", ok: true },
          { label: "Mặt sau CCCD", icon: "🪪", ok: true },
          {
            label: "Ảnh selfie",
            icon: "🤳",
            ok: row.status !== "fail",
            failMsg: `Không khớp (${row.faceScore}%)`,
          },
          ...(row.cas === "org"
            ? [{ label: "Giấy phép KD", icon: "📄", ok: true }]
            : []),
        ].map((doc) => (
          <div
            key={doc.label}
            style={{
              flex: "1 1 130px",
              minWidth: 120,
              border: `0.5px solid ${doc.ok ? "rgba(255,255,255,0.07)" : "#7f1d1d"}`,
              borderRadius: 8,
              padding: "10px 12px",
              background: doc.ok ? "#1c2334" : "#2d0a0a",
            }}
          >
            <div style={{ fontSize: 11, color: "#8b92a8", marginBottom: 6 }}>
              {doc.label}
            </div>
            <div
              style={{
                height: 64,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                border: "0.5px dashed rgba(255,255,255,0.08)",
              }}
            >
              {doc.icon}
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 6,
                color: doc.ok ? "#4ade80" : "#f87171",
              }}
            >
              {doc.ok ? "✓ Đã nộp" : `✗ ${doc.failMsg || "Lỗi"}`}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555e74",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        Ghi chú admin
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nhập lý do từ chối hoặc ghi chú xét duyệt..."
        style={{
          width: "100%",
          minHeight: 64,
          background: "#1c2334",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          color: "#e8eaf0",
          fontFamily: "'IBM Plex Sans', sans-serif",
          resize: "vertical",
          outline: "none",
        }}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onApprove(row.id)}
          style={btnStyle("#14532d", "#4ade80", "#166534")}
        >
          ✓ Duyệt hồ sơ
        </button>
        <button
          onClick={() => onReject(row.id)}
          style={btnStyle("#2d0a0a", "#f87171", "#7f1d1d")}
        >
          ✕ Từ chối
        </button>
        <button
          onClick={onClose}
          style={btnStyle("#1c2334", "#8b92a8", "rgba(255,255,255,0.1)")}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg, color, border) {
  return {
    height: 34,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 500,
    background: bg,
    color,
    border: `0.5px solid ${border}`,
    borderRadius: 8,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: "opacity 0.15s",
  };
}

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function KycAdmin() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [activeCase, setActiveCase] = useState("all");
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [docFilter, setDocFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, color = "#4ade80") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  const filtered = rows.filter((r) => {
    if (activeCase !== "all" && r.cas !== activeCase) return false;
    if (
      search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !r.id.toLowerCase().includes(search.toLowerCase()) &&
      !r.cccd.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (urgencyFilter === "urgent" && r.hrs < 48) return false;
    if (urgencyFilter === "normal" && r.hrs >= 48) return false;
    if (docFilter === "cccd" && !r.doc.includes("CCCD")) return false;
    if (docFilter === "passport" && r.doc !== "Hộ chiếu") return false;
    if (docFilter === "biz" && r.doc !== "Giấy phép KD") return false;
    return true;
  });

  const detailRow = filtered.find((r) => r.id === detailId) || null;
  const detailIdx = filtered.findIndex((r) => r.id === detailId);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const toggleAll = (checked) => {
    setSelectedIds(checked ? new Set(filtered.map((r) => r.id)) : new Set());
  };

  const removeRows = (ids) => {
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
    setSelectedIds(new Set());
    setDetailId(null);
  };

  const handleApprove = (id) => {
    removeRows([id]);
    showToast("Đã duyệt hồ sơ thành công", "#4ade80");
  };

  const handleReject = (id) => {
    removeRows([id]);
    showToast("Đã từ chối hồ sơ", "#f87171");
  };

  const handleBulkApprove = () => {
    const ids = [...selectedIds];
    removeRows(ids);
    showToast(`Đã duyệt ${ids.length} hồ sơ`, "#4ade80");
    setBulkMode(false);
  };

  const handleBulkReject = () => {
    const ids = [...selectedIds];
    removeRows(ids);
    showToast(`Đã từ chối ${ids.length} hồ sơ`, "#f87171");
    setBulkMode(false);
  };

  const urgentCount = rows.filter((r) => r.hrs >= 48).length;

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: "#0f1117",
        minHeight: "100vh",
        padding: 24,
        color: "#e8eaf0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes toastIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .row-hover:hover td { background: rgba(255,255,255,0.025) !important; }
        .row-hover.sel td   { background: rgba(79,142,247,0.06) !important; }
        .act-btn { background:none; border:none; cursor:pointer; color:#555e74; padding:4px; border-radius:5px; display:inline-flex; align-items:center; font-size:15px; transition:color 0.12s; }
        .act-btn:hover { color:#e8eaf0; }
        .cf-btn { padding:5px 12px; font-size:12px; border:0.5px solid rgba(255,255,255,0.1); border-radius:20px; background:transparent; color:#8b92a8; cursor:pointer; font-family:'IBM Plex Sans',sans-serif; transition:all 0.15s; }
        .cf-btn.on { background:#1e3a5f; color:#60a5fa; border-color:#1e4976; font-weight:500; }
        .cf-btn:hover:not(.on) { background:rgba(255,255,255,0.05); color:#e8eaf0; }
        input::placeholder { color:#555e74; }
        textarea::placeholder { color:#555e74; }
        textarea:focus { border-color:rgba(79,142,247,0.4) !important; }
        input[type=text]:focus { border-color:rgba(79,142,247,0.4) !important; outline:none; }
        select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b92a8'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            background: "#1c2334",
            border: `0.5px solid ${toast.color}40`,
            borderLeft: `3px solid ${toast.color}`,
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            color: toast.color,
            animation: "toastIn 0.2s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555e74",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 4,
            }}
          >
            Quản lý người dùng
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            KYC / Định danh
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={btnStyle("#1c2334", "#8b92a8", "rgba(255,255,255,0.1)")}
          >
            ↓ Xuất báo cáo
          </button>
          <button style={btnStyle("#1e3a5f", "#60a5fa", "#1e4976")}>
            + Nhập hồ sơ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Chờ duyệt"
          value={rows.length}
          color="#fb923c"
          icon="⏳"
        />
        <StatCard
          label="Đã duyệt hôm nay"
          value={47}
          color="#4ade80"
          icon="✓"
        />
        <StatCard label="Từ chối hôm nay" value={12} color="#f87171" icon="✕" />
        <StatCard
          label="Chờ > 48h"
          value={urgentCount}
          color="#f87171"
          icon="⚠"
        />
      </div>

      {/* Case filter pills */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}
      >
        <button
          className={`cf-btn${activeCase === "all" ? " on" : ""}`}
          onClick={() => setActiveCase("all")}
        >
          Tất cả ({rows.length})
        </button>
        {Object.entries(CASE_COUNTS).map(([cas, cnt]) => (
          <button
            key={cas}
            className={`cf-btn${activeCase === cas ? " on" : ""}`}
            onClick={() => setActiveCase(cas)}
          >
            {CASE_LABELS[cas]} ({cnt})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, CCCD, mã KH..."
          style={{
            flex: 1,
            minWidth: 160,
            height: 34,
            fontSize: 13,
            padding: "0 12px",
            borderRadius: 8,
            outline: "none",
            background: "#1c2334",
            border: "0.5px solid rgba(255,255,255,0.1)",
            color: "#e8eaf0",
            fontFamily: "'IBM Plex Sans', sans-serif",
            transition: "border-color 0.15s",
          }}
        />
        {[
          {
            id: "urgency",
            val: urgencyFilter,
            set: setUrgencyFilter,
            opts: [
              ["all", "Tất cả mức độ"],
              ["urgent", "Khẩn (>48h)"],
              ["normal", "Bình thường"],
            ],
          },
          {
            id: "doc",
            val: docFilter,
            set: setDocFilter,
            opts: [
              ["all", "Tất cả giấy tờ"],
              ["cccd", "CCCD gắn chip"],
              ["passport", "Hộ chiếu"],
              ["biz", "Giấy phép KD"],
            ],
          },
        ].map(({ id, val, set, opts }) => (
          <select
            key={id}
            value={val}
            onChange={(e) => set(e.target.value)}
            style={{
              height: 34,
              fontSize: 13,
              padding: "0 28px 0 10px",
              borderRadius: 8,
              background: "#1c2334",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "#e8eaf0",
              cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            {opts.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ))}
        <button
          onClick={() => {
            setBulkMode((b) => !b);
            setSelectedIds(new Set());
          }}
          style={btnStyle(
            bulkMode ? "#1e3a5f" : "#1c2334",
            bulkMode ? "#60a5fa" : "#8b92a8",
            bulkMode ? "#1e4976" : "rgba(255,255,255,0.1)",
          )}
        >
          ☑ Chọn nhiều
        </button>
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: "#1e3a5f",
            border: "0.5px solid #1e4976",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
            color: "#60a5fa",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <span>{selectedIds.size} hồ sơ được chọn</span>
          <button
            onClick={handleBulkApprove}
            style={btnStyle("#14532d", "#4ade80", "#166534")}
          >
            ✓ Duyệt tất cả
          </button>
          <button
            onClick={handleBulkReject}
            style={btnStyle("#2d0a0a", "#f87171", "#7f1d1d")}
          >
            ✕ Từ chối tất cả
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              ...btnStyle("#1c2334", "#8b92a8", "rgba(255,255,255,0.1)"),
              marginLeft: "auto",
            }}
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#161b27",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#1c2334" }}>
              {bulkMode && (
                <th
                  style={{ width: 38, padding: "9px 12px", textAlign: "left" }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={(e) => toggleAll(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                </th>
              )}
              {[
                ["Khách hàng", "180px"],
                ["Mã KH", "90px"],
                ["Lý do KYC", "130px"],
                ["Giấy tờ", "110px"],
                ["Ngày nộp", "95px"],
                ["Thời gian", "72px"],
                ["Trạng thái", "90px"],
                ["Thao tác", "90px"],
              ].map(([label, w]) => (
                <th
                  key={label}
                  style={{
                    width: w,
                    padding: "9px 12px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#555e74",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#555e74",
                    fontSize: 13,
                  }}
                >
                  Không có hồ sơ phù hợp
                </td>
              </tr>
            )}
            {filtered.map((row, i) => {
              const urgent = row.hrs >= 48;
              const isDetail = row.id === detailId;
              return (
                <tr
                  key={row.id}
                  className={`row-hover${isDetail ? " sel" : ""}`}
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                    cursor: "default",
                  }}
                >
                  {bulkMode && (
                    <td style={{ padding: "9px 12px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  )}
                  <td style={{ padding: "9px 12px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Avatar init={row.init} idx={i} size={28} />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      color: "#8b92a8",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                    }}
                  >
                    {row.id}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <CaseBadge cas={row.cas} />
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      color: "#8b92a8",
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.doc}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      color: "#8b92a8",
                      fontSize: 12,
                    }}
                  >
                    {row.date}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: urgent ? 600 : 400,
                        color: urgent ? "#f87171" : "#8b92a8",
                      }}
                    >
                      {urgent ? "⚠ " : ""}
                      {hrsLabel(row.hrs)}
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button
                        className="act-btn"
                        title="Xem hồ sơ"
                        onClick={() => setDetailId(isDetail ? null : row.id)}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            color: isDetail ? "#60a5fa" : undefined,
                          }}
                        >
                          👁
                        </span>
                      </button>
                      <button
                        className="act-btn"
                        title="Duyệt"
                        onClick={() => handleApprove(row.id)}
                        style={{ color: "#4ade80" }}
                      >
                        ✓
                      </button>
                      <button
                        className="act-btn"
                        title="Từ chối"
                        onClick={() => handleReject(row.id)}
                        style={{ color: "#f87171" }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          fontSize: 12,
          color: "#8b92a8",
        }}
      >
        <span>
          Hiển thị 1–{filtered.length} / {filtered.length} hồ sơ
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["‹", "1", "2", "3", "…", "36", "›"].map((p, i) => (
            <button
              key={i}
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: 12,
                cursor: "pointer",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                background: p === "1" ? "#1e3a5f" : "#1c2334",
                color: p === "1" ? "#60a5fa" : "#8b92a8",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {detailRow && (
        <DetailPanel
          row={detailRow}
          idx={detailIdx}
          onClose={() => setDetailId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
