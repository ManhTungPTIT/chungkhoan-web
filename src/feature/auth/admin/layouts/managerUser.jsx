import { useCallback, useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { FaLock, FaLockOpen, FaTrashAlt } from "react-icons/fa";
import { BsCalendarEvent } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { MdAccessTime } from "react-icons/md";
import "../styles/managerUser.scss";
import axiosAdmin from "../untils/axiosAdmin";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../services/pendingUser";
import {
  getUsers,
  lockUser,
  unlockUser,
  deleteUser,
  setPackage,
  getPackageRequests,
  approvePackageRequest,
  rejectPackageRequest,
} from "../services/adminUsers";

// Lấy { total, online, offline } từ BE (đi qua interceptor refresh của axiosAdmin)
async function fetchUserStats() {
  const { data } = await axiosAdmin.get("/user/stats");
  return data;
}

// ─── Helpers ──────────────────────────────────────────────
const initialsOf = (name) =>
  (name || "?")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

// Định danh hiển thị: email → SĐT → "Sàn · Số TK" (user đăng ký bằng TK chứng khoán).
const identityOf = (u) =>
  u.email ||
  u.phoneNumber ||
  (u.broker && u.brokerAccount ? `${u.broker} · ${u.brokerAccount}` : "—");

const avatarIdx = (name) =>
  ((name || "?").charCodeAt(0) % AVATAR_COLORS.length) + 1;

const isExpired = (expiresAt) =>
  !!expiresAt && new Date(expiresAt).getTime() < Date.now();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
// "Sắp hết hạn" = tài khoản đang active, CHƯA hết hạn, còn ≤ 7 ngày.
// Loại trừ tài khoản đã hết hạn (diff < 0) và các trạng thái khác (locked/pending/...).
const isExpiringSoon = (u) => {
  if (u.status !== "active" || !u.expiresAt) return false;
  const diff = new Date(u.expiresAt).getTime() - Date.now();
  return diff >= 0 && diff <= SEVEN_DAYS;
};

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
const STATUS_META = {
  active: { bg: "#dcfce7", c: "#166534", border: "#bbf7d0", label: "Hoạt động" },
  locked: { bg: "#fff7ed", c: "#9a3412", border: "#fed7aa", label: "Khóa" },
  pending: { bg: "#eff6ff", c: "#1d4ed8", border: "#bfdbfe", label: "Chờ duyệt" },
  rejected: { bg: "#fef2f2", c: "#991b1b", border: "#fecaca", label: "Từ chối" },
  expired: { bg: "#f3f4f6", c: "#6b7280", border: "#e5e7eb", label: "Hết hạn" },
};

function Status({ status, expiresAt }) {
  const key = status === "active" && isExpired(expiresAt) ? "expired" : status;
  const s = STATUS_META[key] || {
    bg: "#f3f4f6", c: "#6b7280", border: "#e5e7eb", label: status || "—",
  };
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
  { id: 30, label: "30", unit: "ng\u00e0y" },
  { id: 90, label: "90", unit: "ng\u00e0y" },
  { id: 180, label: "180", unit: "ng\u00e0y" },
  { id: 365, label: "1", unit: "n\u0103m" },
  { id: 730, label: "2", unit: "n\u0103m" },
  { id: 1095, label: "3", unit: "n\u0103m" },
  { id: 1825, label: "5", unit: "n\u0103m" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  "Th\u00e1ng M\u1ed9t",
  "Th\u00e1ng Hai",
  "Th\u00e1ng Ba",
  "Th\u00e1ng T\u01b0",
  "Th\u00e1ng N\u0103m",
  "Th\u00e1ng S\u00e1u",
  "Th\u00e1ng B\u1ea3y",
  "Th\u00e1ng T\u00e1m",
  "Th\u00e1ng Ch\u00edn",
  "Th\u00e1ng M\u01b0\u1eddi",
  "Th\u00e1ng M\u01b0\u1eddi M\u1ed9t",
  "Th\u00e1ng M\u01b0\u1eddi Hai",
];
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const toDateInputValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateFromInputValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const endOfDayIso = (value) => {
  const date = dateFromInputValue(value);
  if (!date) return null;
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const daysUntil = (value) => {
  const date = dateFromInputValue(value);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((date.getTime() - today.getTime()) / DAY_MS));
};

const sameDate = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function ExpiryCalendar({ value, month, onMonthChange, onSelect }) {
  const selectedDate = dateFromInputValue(value);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const days = Array.from({ length: leadingDays + monthEnd.getDate() }, (_, index) => {
    const day = index - leadingDays + 1;
    return day > 0 ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });

  return (
    <div className="expiry-calendar">
      <div className="expiry-calendar-head">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label={"Th\u00e1ng tr\u01b0\u1edbc"}
        >
          &lt;
        </button>
        <strong>{MONTH_NAMES[month.getMonth()]} {month.getFullYear()}</strong>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label={"Th\u00e1ng sau"}
        >
          &gt;
        </button>
      </div>
      <div className="expiry-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="expiry-calendar-grid">
        {days.map((date, index) => (
          <button
            key={date ? date.toISOString() : `blank-${index}`}
            type="button"
            className={date && sameDate(date, selectedDate) ? "is-selected" : ""}
            disabled={!date}
            onClick={() => onSelect(toDateInputValue(date))}
          >
            {date ? date.getDate() : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UserModal({ user, busy, onClose, onLock, onUnlock, onDelete, onSetPackage }) {
  const defaultExpiryDate = toDateInputValue(user.expiresAt || addDays(new Date(), 90));
  const [selectedPkg, setSelectedPkg] = useState(90);
  const [selectedPkgTitle, setSelectedPkgTitle] = useState("90 ng\u00e0y");
  const [packageMode, setPackageMode] = useState("preset");
  const [selectedExpiryDate, setSelectedExpiryDate] = useState(defaultExpiryDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = dateFromInputValue(defaultExpiryDate) || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const locked = user.status === "locked";
  const customDays = daysUntil(selectedExpiryDate);

  const handleOverlayClick = () => onClose();

  const handleDelete = () => {
    if (window.confirm(`X\u00f3a t\u00e0i kho\u1ea3n "${user.fullName}"?`)) onDelete();
  };

  const handleSelectExpiryDate = (value) => {
    const date = dateFromInputValue(value);
    setSelectedExpiryDate(value);
    setPackageMode("date");
    setCalendarOpen(false);
    if (date) setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleSavePackage = () => {
    if (packageMode === "date") {
      onSetPackage(`\u0110\u1ebfn ${fmtDate(selectedExpiryDate)}`, customDays, endOfDayIso(selectedExpiryDate));
      return;
    }
    onSetPackage(selectedPkgTitle, selectedPkg);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IoClose /></button>

        {/* Header */}
        <div className="modal-header">
          <Avatar init={initialsOf(user.fullName)} idx={avatarIdx(user.fullName)} size={64} />
          <div className="modal-name">{user.fullName}</div>
          <div className="modal-code">{identityOf(user)}</div>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">{"Th\u00f4ng tin"}</div>
          <div className="modal-info-row">
            <span>{"Tr\u1ea1ng th\u00e1i"}</span>
            <Status status={user.status} expiresAt={user.expiresAt} />
          </div>
          <div className="modal-info-row">
            <span>{"Ng\u00e0y t\u1ea1o"}</span>
            <span>{fmtDate(user.createdAt)}</span>
          </div>
          <div className="modal-info-row">
            <span>{"L\u1ea7n cu\u1ed1i ho\u1ea1t \u0111\u1ed9ng"}</span>
            <span>{fmtDate(user.lastActive)}</span>
          </div>
          <div className="modal-info-row">
            <span><MdAccessTime style={{ verticalAlign: "middle" }} /> {"H\u1ebft h\u1ea1n"}</span>
            <strong>{user.expiresAt ? fmtDate(user.expiresAt) : "Kh\u00f4ng gi\u1edbi h\u1ea1n"}</strong>
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">
            <BsCalendarEvent style={{ verticalAlign: "middle", marginRight: 6 }} />
            {"Ch\u1ecdn g\u00f3i th\u1eddi h\u1ea1n"}
          </div>
          <div className="modal-packages">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`pkg-card${packageMode === "preset" && selectedPkg === pkg.id ? " active" : ""}`}
                onClick={() => {
                  setPackageMode("preset");
                  setSelectedPkg(pkg.id);
                  setSelectedPkgTitle(`${pkg.label} ${pkg.unit}`);
                }}
              >
                <div className="pkg-num">{pkg.label}</div>
                <div className="pkg-unit">{pkg.unit}</div>
              </div>
            ))}
          </div>

          <div className={`expiry-picker${packageMode === "date" ? " active" : ""}`}>
            <button
              type="button"
              className="expiry-picker-trigger"
              onClick={() => {
                setPackageMode("date");
                setCalendarOpen((open) => !open);
              }}
            >
              <span>{"Ng\u00e0y h\u1ebft h\u1ea1n"}</span>
              <strong>{fmtDate(selectedExpiryDate)}</strong>
              <BsCalendarEvent />
            </button>

            {calendarOpen && (
              <ExpiryCalendar
                value={selectedExpiryDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={handleSelectExpiryDate}
              />
            )}
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">{"Thao t\u00e1c t\u00e0i kho\u1ea3n"}</div>
          <button
            className="modal-action-btn lock"
            disabled={busy}
            onClick={locked ? onUnlock : onLock}
          >
            {locked ? <FaLockOpen /> : <FaLock />}{" "}
            {locked ? "M\u1edf kh\u00f3a t\u00e0i kho\u1ea3n" : "Kh\u00f3a t\u00e0i kho\u1ea3n"}
          </button>
          <button
            className="modal-action-btn delete"
            disabled={busy}
            onClick={handleDelete}
          >
            <FaTrashAlt /> {"X\u00f3a t\u00e0i kho\u1ea3n"}
          </button>
        </div>

        <div className="modal-footer">
          <button className="modal-footer-cancel" onClick={onClose}>{"H\u1ee7y"}</button>
          <button
            className="modal-footer-save"
            disabled={busy}
            onClick={handleSavePackage}
          >
            {packageMode === "date"
              ? `L\u01b0u \u0111\u1ebfn ${fmtDate(selectedExpiryDate)}`
              : `L\u01b0u g\u00f3i ${selectedPkgTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Card
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
      {item.map((tab) => (
        <button key={tab.id} className={active === tab.id ? "activeTab" : "btTab"}
          onClick={() => onChange(tab.id)}>
          {tab.label} ({tab.cnt})
        </button>
      ))}
    </div>
  );
}

// ─── UsersTable (dữ liệu thật) ────────────────────────────
function UsersTable({ users, onAction, emptyText }) {
  if (users.length === 0) {
    return <p className="pending-empty">{emptyText}</p>;
  }
  return (
    <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Khách hàng</th>
          <th>Email / SĐT / Số TK</th>
          <th>Trạng thái</th>
          <th>Hết hạn</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="td-user">
              <Avatar init={initialsOf(u.fullName)} idx={avatarIdx(u.fullName)} />
              <span className="u-name">{u.fullName}</span>
            </td>
            <td>{identityOf(u)}</td>
            <td><Status status={u.status} expiresAt={u.expiresAt} /></td>
            <td>{u.expiresAt ? fmtDate(u.expiresAt) : "Không giới hạn"}</td>
            <td>
              <button onClick={() => onAction(u)}>
                <FaRegEye /> Thao tác
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

// ─── PendingUsersTable (tài khoản chờ duyệt) ──────────────
function PendingUsersTable({ users, busyId, onApprove, onReject }) {
  if (users.length === 0) {
    return <p className="pending-empty">Không có tài khoản nào chờ duyệt.</p>;
  }
  return (
    <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Khách hàng</th>
          <th>Email / Số điện thoại</th>
          <th>Ngày đăng ký</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="td-user">
              <Avatar init={initialsOf(u.fullName)} idx={avatarIdx(u.fullName)} />
              <span className="u-name">{u.fullName}</span>
            </td>
            <td>{identityOf(u)}</td>
            <td>{fmtDate(u.createdAt)}</td>
            <td style={{ display: "flex", gap: "0.4rem" }}>
              <button
                className="pending-approve"
                disabled={busyId === u.id}
                onClick={() => onApprove(u.id)}
              >
                Duyệt
              </button>
              <button
                className="pending-reject"
                disabled={busyId === u.id}
                onClick={() => onReject(u.id)}
              >
                Từ chối
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

// ─── ManagerUser ──────────────────────────────────────────
function PackageRequestsTable({ requests, busyId, onApprove, onReject }) {
  if (requests.length === 0) {
    return <p className="pending-empty">Không có yêu cầu gói nào chờ duyệt.</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Email / SĐT / Số TK</th>
            <th>Gói yêu cầu</th>
            <th>Ngày yêu cầu</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const u = request.user ?? request;
            const id = request.id ?? request._id;
            return (
              <tr key={id}>
                <td className="td-user">
                  <Avatar init={initialsOf(u.fullName)} idx={avatarIdx(u.fullName)} />
                  <span className="u-name">{u.fullName || "Người dùng"}</span>
                </td>
                <td>{identityOf(u)}</td>
                <td>{request.titles ?? `${request.days} ngày`}</td>
                <td>{fmtDate(request.requestedAt ?? request.createdAt)}</td>
                <td style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    className="pending-approve"
                    disabled={busyId === id}
                    onClick={() => onApprove(id)}
                  >
                    Duyệt
                  </button>
                  <button
                    className="pending-reject"
                    disabled={busyId === id}
                    onClick={() => onReject(id)}
                  >
                    Từ chối
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerUser() {
  const [activeTab, setActiveTab] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [packageRequests, setPackageRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  
  useEffect(() => {
    let active = true;
    fetchUserStats()
      .then((data) => active && setStats(data))
      .catch(() => {}); // 401 đã được interceptor xử lý; lỗi khác thì giữ 0
    return () => {
      active = false;
    };
  }, []);

  const loadUsers = useCallback(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const loadPending = useCallback(() => {
    getPendingUsers()
      .then(setPending)
      .catch(() => setPending([]));
  }, []);

  const loadPackageRequests = useCallback(() => {
    getPackageRequests()
      .then(setPackageRequests)
      .catch(() => setPackageRequests([]));
  }, []);

  useEffect(() => {
    loadUsers();
    loadPending();
    loadPackageRequests();
  }, [loadUsers, loadPending, loadPackageRequests]);

  // ── Duyệt / từ chối (tab Tài khoản mới)
  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveUser(id);
      loadPending();
      loadUsers();
    } catch {
      /* interceptor xử lý 401; lỗi khác bỏ qua */
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    try {
      await rejectUser(id);
      loadPending();
      loadUsers();
    } catch {
      /* interceptor xử lý 401; lỗi khác bỏ qua */
    } finally {
      setBusyId(null);
    }
  };

  // ── Thao tác trong modal (khóa/mở/xóa/gói) — gọi API rồi refetch + đóng
  const handleApprovePackageRequest = async (id) => {
    setBusyId(id);
    try {
      await approvePackageRequest(id);
      loadPackageRequests();
      loadUsers();
    } catch {
      
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectPackageRequest = async (id) => {
    setBusyId(id);
    try {
      await rejectPackageRequest(id);
      loadPackageRequests();
    } catch {
      
    } finally {
      setBusyId(null);
    }
  };

  const actOnUser = async (fn) => {
    if (!selectedUser) return;
    setBusyId(selectedUser.id);
    try {
      await fn(selectedUser.id);
      loadUsers();
      setSelectedUser(null);
    } catch {
      /* interceptor xử lý 401; lỗi khác bỏ qua */
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

  const lockedUsers = users.filter((u) => u.status === "locked");
  const expiringUsers = users.filter(isExpiringSoon);
  const vpsUsers = users.filter((u) => u.broker === "VPS");
  const tcbsUsers = users.filter((u) => u.broker === "TCBS");
  const q = search.trim().toLowerCase();
  const searchedUsers = users.filter((u) => {
    if (!q) return true;
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").toLowerCase().includes(q) ||
      (u.brokerAccount || "").toLowerCase().includes(q)
    );
  });

  const listTabs = [
    { id: 1, label: "Danh sách", cnt: String(users.length) },
    { id: 2, label: "Tài khoản duyệt", cnt: String(pending.length) },
    { id: 3, label: "Tài khoản khóa", cnt: String(lockedUsers.length) },
    { id: 4, label: "Tài khoản sắp hết hạn", cnt: String(expiringUsers.length) },
    { id: 5, label: "Nâng hạn mức", cnt: String(expiringUsers.length) },
    { id: 6, label: "Gói chờ duyệt", cnt: String(packageRequests.length) },
    { id: 7, label: "VPS", cnt: String(vpsUsers.length) },
    { id: 8, label: "TCBS", cnt: String(tcbsUsers.length) },
  ];

  return (
    <div className="managerUser">
      <div className="managerUser_card">
        <Card label="Tổng người dùng" value={fmt(stats.total)} icon="👥" color="blue" />
        <Card label="Đang online" value={fmt(stats.online)} icon="✓" color="green" />
        <Card label="Offline" value={fmt(stats.offline)} icon="✕" color="red" />
      </div>
      <Tab item={listTabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 1 && (
        <>
          <input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <UsersTable
            users={searchedUsers}
            onAction={setSelectedUser}
            emptyText="Chưa có người dùng nào."
          />
        </>
      )}

      {activeTab === 2 && (
        <PendingUsersTable
          users={pending}
          busyId={busyId}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {activeTab === 3 && (
        <UsersTable
          users={lockedUsers}
          onAction={setSelectedUser}
          emptyText="Không có tài khoản bị khóa."
        />
      )}

      {activeTab === 4 && (
        <UsersTable
          users={expiringUsers}
          onAction={setSelectedUser}
          emptyText="Không có tài khoản sắp hết hạn."
        />
      )}

      {activeTab === 6 && (
        <PackageRequestsTable
          requests={packageRequests}
          busyId={busyId}
          onApprove={handleApprovePackageRequest}
          onReject={handleRejectPackageRequest}
        />
      )}

      {activeTab === 7 && (
        <UsersTable
          users={vpsUsers}
          onAction={setSelectedUser}
          emptyText="Không có tài khoản VPS nào."
        />
      )}

      {activeTab === 8 && (
        <UsersTable
          users={tcbsUsers}
          onAction={setSelectedUser}
          emptyText="Không có tài khoản TCBS nào."
        />
      )}

      {selectedUser && (
        <UserModal
          user={selectedUser}
          busy={busyId === selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onLock={() => actOnUser(lockUser)}
          onUnlock={() => actOnUser(unlockUser)}
          onDelete={() => actOnUser(deleteUser)}
          onSetPackage={(titles, days, expiresAt) => actOnUser((id) => setPackage(id, titles, days, expiresAt))}
        />
      )}
    </div>
  );
}
