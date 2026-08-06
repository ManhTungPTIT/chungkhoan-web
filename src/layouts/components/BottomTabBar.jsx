import { useLocation, useNavigate } from "react-router-dom";
import { BsFunnel } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { LuArrowUpNarrowWide } from "react-icons/lu";
import { MdStackedLineChart } from "react-icons/md";

import { activeTabKey } from "../untils/navigation";

// Dùng lại đúng bộ icon sidebar bản web đang dùng: không thêm dependency, và
// người đã quen bản web nhận ra ngay từng mục.
//
// BỐN tab, bốn màn hình — kể cả tab "Bot". Bản trước nó không có `path` mà mở một
// tấm trượt bắt chọn 1 trong 3 bot; ba bot không phải ba đích đến, chúng là ba
// thuật toán chạy trên CÙNG màn "/". Việc đổi bot nay nằm trong thanh công cụ của
// màn đó (feature/chart/layouts/BotPicker.jsx), còn bot đang chọn thì chính màn
// đó nhớ lấy — thanh tab không cần biết bot là gì.
const TABS = [
  { key: "bot", label: "Trang chủ", Icon: LuArrowUpNarrowWide, path: "/" },
  { key: "filter", label: "Bộ lọc", Icon: BsFunnel, path: "/chart/filter" },
  { key: "market", label: "Biểu đồ", Icon: MdStackedLineChart, path: "/chart/market" },
  { key: "account", label: "Tài khoản", Icon: FaUserCircle, path: "/info" },
];

function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeTabKey(pathname);

  return (
    <nav className="appnav" aria-label="Điều hướng chính">
      {TABS.map(({ key, label, Icon, path }) => {
        const isActive = key === active;

        return (
          <button
            key={key}
            type="button"
            className={`appnav-item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(path)}
          >
            <Icon className="appnav-icon" aria-hidden="true" />
            <span className="appnav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
