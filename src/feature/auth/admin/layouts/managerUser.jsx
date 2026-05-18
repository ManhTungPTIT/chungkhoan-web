import { useState } from "react";
import "../styles/managerUser.scss";

function Card({ label, value, icon, color }) {
  return (
    <div className="card">
      <div className="card_header">
        <span>{icon}</span>
        {label}
      </div>
      <div className="card_value" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Tab({ item, active, onChange }) {
  return (
    <div className="tab">
      {item.map((tab, index) => (
        <button
          key={tab.id}
          className={active === tab.id ? "activeTab" : "btTab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.label} ({tab.cnt})
        </button>
      ))}
    </div>
  );
}

function DataTable({ columns, data }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index}>{col}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => {
          const initial = row.name
            .trim()
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase();
          const sc = AVATAR_COLORS[row.status - 1];

          return (
            <tr key={index}>
              <td style={{ display: "flex", gap: "0.2rem" }}>
                <Avatar init={initial} idx={row.status} />
                <span></span>
                {row.name}
              </td>
              <td>{row.code}</td>
              <td>
                <Status status={row.status} />
              </td>
              <td>{row.date}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const AVATAR_COLORS = [
  { bg: "#14532d", c: "#4ade80" },
  { bg: "#451a03", c: "#fb923c" },
  { bg: "#979da5", c: "#f9f9f9" },
];
function Avatar({ init, idx, size = 30 }) {
  const av = AVATAR_COLORS[idx - 1];
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
function Status({ status }) {
  const s =
    status === 1
      ? { bg: "#14532d", c: "#4ade80", border: "#166534", label: "Hoạt động" }
      : status === 2
        ? { bg: "#451a03", c: "#fb923c", border: "#7f1d1d", label: "Khóa" }
        : {
            bg: "#979da5",
            c: "#f9f9f9",
            border: "#979da5",
            label: "Không hoạt động",
          };
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

export default function ManagerUser() {
  const [activeTab, setActiveTab] = useState(1);
  const listTabs = [
    { id: 1, label: "Danh sách", cnt: "20" },
    { id: 2, label: "Tài khoản mới", cnt: "5" },
    { id: 3, label: "Tài khoản khóa", cnt: "4" },
    { id: 4, label: "Nâng hạn mức", cnt: "5" },
  ];
  const columns = ["Khách hàng", "Mã KH", "Trạng thái", "Ngày tạo tài khoản"];
  const data = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      code: "KH001",
      status: 1,
      date: "15/05/2026",
    },
    {
      id: 2,
      name: "Nguyễn Văn B",
      code: "KH002",
      status: 2,
      date: "16/05/2026",
    },
    {
      id: 3,
      name: "Nguyễn Văn C",
      code: "KH003",
      status: 3,
      date: "17/05/2026",
    },
    {
      id: 4,
      name: "Phạm Thị Hương",
      code: "KH001",
      status: 2,
      date: "15/05/2026",
    },
    {
      id: 5,
      name: "Mặc Đăng Khoa",
      code: "KH012",
      status: 1,
      date: "11/05/2026",
    },
    {
      id: 6,
      name: "Châu Việt Cường",
      code: "KH103",
      status: 3,
      date: "17/05/2026",
    },
    {
      id: 7,
      name: "Nguyễn Văn Liêm",
      code: "KH001",
      status: 1,
      date: "15/05/2026",
    },
    {
      id: 8,
      name: "Trương Tấn Dũng",
      code: "KH022",
      status: 1,
      date: "16/05/2026",
    },
    {
      id: 9,
      name: "Phạm Hùng",
      code: "KH113",
      status: 3,
      date: "09/05/2026",
    },
  ];
  return (
    <div className="managerUser">
      <div className="managerUser_card">
        <Card label="Tổng khách hàng" value="11,200" icon="👥" color="blue" />
        <Card label="Hoạt động" value="11,000" icon="✓" color="green" />
        <Card label="Khóa" value="100" icon="✕" color="red" />
      </div>
      <Tab
        item={listTabs}
        active={activeTab}
        onChange={(value) => setActiveTab(value)}
      />
      <input placeholder="Tìm theo tên, mã KH..." />
      <DataTable columns={columns} data={data} />
    </div>
  );
}
