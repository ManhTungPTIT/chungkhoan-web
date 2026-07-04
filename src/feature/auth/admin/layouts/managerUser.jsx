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
  { id: 30, label: "30", unit: "ngày" },
  { id: 90, label: "90", unit: "ngày" },
  { id: 180, label: "180", unit: "ngày" },
  { id: 365, label: "1", unit: "năm" },
  { id: 730, label: "2", unit: "năm" },
  { id: 1095, label: "3", unit: "năm" },
  { id: 1825, label: "5", unit: "năm" },
];

// ─── User Modal ───────────────────────────────────────────
// export để test trực tiếp phần chọn gói (không phải dựng cả trang ManagerUser).
export function UserModal({ user, busy, onClose, onLock, onUnlock, onDelete, onSetPackage }) {
  const [selectedPkg, setSelectedPkg] = useState(90);
  const [selectedPkgTitle, setSelectedPkgTitle] = useState("90 ngày");
  const locked = user.status === "locked";

  const handleOverlayClick = () => onClose();

  const handleDelete = () => {
    if (window.confirm(`Xóa tài khoản "${user.fullName}"?`)) onDelete();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IoClose /></button>

        {/* Header */}
        <div className="modal-header">
          <Avatar init={initialsOf(user.fullName)} idx={avatarIdx(user.fullName)} size={64} />
          <div className="modal-name">{user.fullName}</div>
          <div className="modal-code">{user.email || user.phoneNumber || "—"}</div>
        </div>

        {/* Thông tin */}
        <div className="modal-section">
          <div className="modal-section-title">Thông tin</div>
          <div className="modal-info-row">
            <span>Trạng thái</span>
            <Status status={user.status} expiresAt={user.expiresAt} />
          </div>
          <div className="modal-info-row">
            <span>Ngày tạo</span>
            <span>{fmtDate(user.createdAt)}</span>
          </div>
          <div className="modal-info-row">
            <span>Lần cuối hoạt động</span>
            <span>{fmtDate(user.lastActive)}</span>
          </div>
          <div className="modal-info-row">
            <span><MdAccessTime style={{ verticalAlign: "middle" }} /> Hết hạn</span>
            <strong>{user.expiresAt ? fmtDate(user.expiresAt) : "Không giới hạn"}</strong>
          </div>
        </div>

        {/* Gói thời hạn */}
        <div className="modal-section">
          <div className="modal-section-title">
            <BsCalendarEvent style={{ verticalAlign: "middle", marginRight: 6 }} />
            Chọn gói thời hạn
          </div>
          <div className="modal-packages">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`pkg-card${selectedPkg === pkg.id ? " active" : ""}`}
                onClick={() => {
                  setSelectedPkg(pkg.id);
                  setSelectedPkgTitle(`${pkg.label} ${pkg.unit}`);
                }}
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
            className="modal-action-btn lock"
            disabled={busy}
            onClick={locked ? onUnlock : onLock}
          >
            {locked ? <FaLockOpen /> : <FaLock />}{" "}
            {locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          </button>
          <button
            className="modal-action-btn delete"
            disabled={busy}
            onClick={handleDelete}
          >
            <FaTrashAlt /> Xóa tài khoản
          </button>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-footer-cancel" onClick={onClose}>Hủy</button>
          <button
            className="modal-footer-save"
            disabled={busy}
            onClick={() => onSetPackage(selectedPkgTitle ,selectedPkg)}
          >
            Lưu gói {selectedPkg} ngày
          </button>
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
          <th>Email / SĐT</th>
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
            <td>{u.email || u.phoneNumber || "—"}</td>
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
            <td>{u.email || u.phoneNumber || "—"}</td>
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
            <th>Email / Số điện thoại</th>
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
                <td>{u.email || u.phoneNumber || "—"}</td>
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
  const q = search.trim().toLowerCase();
  const searchedUsers = users.filter((u) => {
    if (!q) return true;
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").toLowerCase().includes(q)
    );
  });

  const listTabs = [
    { id: 1, label: "Danh sách", cnt: String(users.length) },
    { id: 2, label: "Tài khoản duyệt", cnt: String(pending.length) },
    { id: 3, label: "Tài khoản khóa", cnt: String(lockedUsers.length) },
    { id: 4, label: "Tài khoản sắp hết hạn", cnt: String(expiringUsers.length) },
    { id: 5, label: "Nâng hạn mức", cnt: String(expiringUsers.length) },
    { id: 6, label: "Gói chờ duyệt", cnt: String(packageRequests.length) },
    
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

      {selectedUser && (
        <UserModal
          user={selectedUser}
          busy={busyId === selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onLock={() => actOnUser(lockUser)}
          onUnlock={() => actOnUser(unlockUser)}
          onDelete={() => actOnUser(deleteUser)}
          onSetPackage={(titles, days) => actOnUser((id) => setPackage(id, titles, days))}
        />
      )}
    </div>
  );
}
