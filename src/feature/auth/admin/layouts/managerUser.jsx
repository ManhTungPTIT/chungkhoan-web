import { useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { FaLock, FaTrashAlt } from "react-icons/fa";
import { BsCalendarEvent } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { MdAccessTime } from "react-icons/md";
import "../styles/managerUser.scss";

// ─── Avatar ───────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#ccf0e8", c: "#0a7c5c" },
  { bg: "#fde8cc", c: "#c25f00" },
  { bg: "#e5e7eb", c: "#6b7280" },
];

function Avatar({ init, idx, size = 30 }) {
  const av = AVATAR_COLORS[(idx - 1) % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: av.bg, color: av.c,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      }}
    >
      {init}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────
function Status({ status }) {
  const s =
    status === 1
      ? { bg: "#dcfce7", c: "#166534", border: "#bbf7d0", label: "Hoạt động" }
      : status === 2
        ? { bg: "#fff7ed", c: "#9a3412", border: "#fed7aa", label: "Khóa" }
        : { bg: "#f3f4f6", c: "#6b7280", border: "#e5e7eb", label: "Không hoạt động" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: s.bg, color: s.c,
      border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ─── Time packages ────────────────────────────────────────
const PACKAGES = [
  { id: 30, label: "30", unit: "ngày" },
  { id: 90, label: "90", unit: "ngày" },
  { id: 180, label: "180", unit: "ngày" },
  { id: 365, label: "1", unit: "năm" },
];

// ─── User Modal ───────────────────────────────────────────
function UserModal({ user, onClose }) {
  const initial = user.name.trim().split(" ").map(w => w[0]).join("").toUpperCase();

  const [selectedPkg, setSelectedPkg] = useState(90);
  const [activeAction, setActiveAction] = useState(null);

  const toggleAction = (key) =>
    setActiveAction((prev) => (prev === key ? null : key));

  const handleOverlayClick = () => {
    setActiveAction(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="user-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IoClose /></button>

        {/* Header */}
        <div className="modal-header">
          <Avatar init={initial} idx={user.status} size={64} />
          <div className="modal-name">{user.name}</div>
          <div className="modal-code">{user.code}</div>
        </div>

        {/* Thông tin */}
        <div className="modal-section">
          <div className="modal-section-title">Thông tin</div>
          <div className="modal-info-row">
            <span>Trạng thái</span>
            <Status status={user.status} />
          </div>
          <div className="modal-info-row">
            <span>Ngày tạo</span>
            <span>{user.date}</span>
          </div>
          <div className="modal-info-row">
            <span>Lần cuối đăng nhập</span>
            <span>Hôm nay, 14:02</span>
          </div>
          <div className="modal-info-row">
            <span><MdAccessTime style={{ verticalAlign: "middle" }} /> Thời gian dùng</span>
            <strong>3h 55m</strong>
          </div>
        </div>

        {/* Gói thời hạn */}
        <div className="modal-section">
          <div className="modal-section-title">
            <BsCalendarEvent style={{ verticalAlign: "middle", marginRight: 6 }} />
            Chọn gói thời hạn
          </div>
          <div className="modal-packages">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`pkg-card${selectedPkg === pkg.id ? " active" : ""}`}
                onClick={() => setSelectedPkg(pkg.id)}
              >
                <div className="pkg-num">{pkg.label}</div>
                <div className="pkg-unit">{pkg.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Thao tác tài khoản */}
        <div className="modal-section">
          <div className="modal-section-title">Thao tác tài khoản</div>
          <button
            className={`modal-action-btn lock${activeAction === "lock" ? " active" : ""}`}
            onClick={() => toggleAction("lock")}
          >
            <FaLock /> Khóa tài khoản
          </button>
          <button
            className={`modal-action-btn delete${activeAction === "delete" ? " active" : ""}`}
            onClick={() => toggleAction("delete")}
          >
            <FaTrashAlt /> Xóa tài khoản
          </button>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-footer-cancel" onClick={onClose}>Hủy</button>
          <button className="modal-footer-save">Lưu</button>
        </div>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────
function Card({ label, value, icon, color }) {
  return (
    <div className="card">
      <div className="card_header"><span>{icon}</span>{label}</div>
      <div className="card_value" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────
function Tab({ item, active, onChange }) {
  return (
    <div className="tab">
      {item.map(tab => (
        <button key={tab.id} className={active === tab.id ? "activeTab" : "btTab"}
          onClick={() => onChange(tab.id)}>
          {tab.label} ({tab.cnt})
        </button>
      ))}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────
function DataTable({ columns, data, onAction }) {
  return (
    <table>
      <thead>
        <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((row, i) => {
          const initial = row.name.trim().split(" ").map(w => w[0]).join("").toUpperCase();
          return (
            <tr key={i}>
              <td style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <Avatar init={initial} idx={row.status} />
                {row.name}
              </td>
              <td><Status status={row.status} /></td>
              <td>{row.date}</td>
              <td>
                <button onClick={() => onAction(row)}>
                  <FaRegEye /> Thao tác
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── ManagerUser ──────────────────────────────────────────
const DATA = [
  { id: 1, name: "Nguyễn Văn A", code: "KH001", status: 1, date: "15/05/2026" },
  { id: 2, name: "Nguyễn Văn B", code: "KH002", status: 2, date: "16/05/2026" },
  { id: 3, name: "Nguyễn Văn C", code: "KH003", status: 3, date: "17/05/2026" },
  { id: 4, name: "Phạm Thị Hương", code: "KH004", status: 2, date: "15/05/2026" },
  { id: 5, name: "Mặc Đăng Khoa", code: "KH012", status: 1, date: "11/05/2026" },
  { id: 6, name: "Châu Việt Cường", code: "KH103", status: 3, date: "17/05/2026" },
  { id: 7, name: "Nguyễn Văn Liêm", code: "KH001", status: 1, date: "15/05/2026" },
  { id: 8, name: "Trương Tấn Dũng", code: "KH022", status: 1, date: "16/05/2026" },
  { id: 9, name: "Phạm Hùng", code: "KH113", status: 3, date: "09/05/2026" },
];

export default function ManagerUser() {
  const [activeTab, setActiveTab] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");

  const listTabs = [
    { id: 1, label: "Danh sách", cnt: "20" },
    { id: 2, label: "Tài khoản mới", cnt: "5" },
    { id: 3, label: "Tài khoản khóa", cnt: "4" },
    { id: 4, label: "Nâng hạn mức", cnt: "5" },
  ];
  const columns = ["Khách hàng", "Trạng thái", "Ngày tạo tài khoản", "Thao tác"];

  return (
    <div className="managerUser">
      <div className="managerUser_card">
        <Card label="Tổng khách hàng" value="11,200" icon="👥" color="blue" />
        <Card label="Hoạt động" value="11,000" icon="✓" color="green" />
        <Card label="Khóa" value="100" icon="✕" color="red" />
      </div>
      <Tab item={listTabs} active={activeTab} onChange={setActiveTab} />
      <input
        placeholder="Tìm theo tên, mã KH..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <DataTable
        columns={columns}
        data={DATA.filter((u) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q);
        })}
        onAction={setSelectedUser}
      />

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
