import { useLocation, useNavigate } from "react-router-dom";
import { BsFunnel } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { LuArrowUpNarrowWide } from "react-icons/lu";
import { MdStackedLineChart } from "react-icons/md";

import { activeTabKey } from "../untils/navigation";

// Dùng lại đúng bộ icon sidebar bản web đang dùng: không thêm dependency, và
// người đã quen bản web nhận ra ngay từng mục.
//
// Tab "Bot" không có `path` — nó mở bottom sheet để chọn 1 trong 3 bot, vì cả ba
// đều dẫn về "/" chỉ khác tham số `?bot=`.
const TABS = [
  { key: "bot", label: "Bot", Icon: LuArrowUpNarrowWide },
  { key: "filter", label: "Bộ lọc", Icon: BsFunnel, path: "/chart/filter" },
  { key: "market", label: "Biểu đồ", Icon: MdStackedLineChart, path: "/chart/market" },
  { key: "account", label: "Tài khoản", Icon: FaUserCircle, path: "/info" },
];

function BottomTabBar({ onBotClick, botSheetOpen = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeTabKey(pathname);

  return (
    <nav className="appnav" aria-label="Điều hướng chính">
      {TABS.map(({ key, label, Icon, path }) => {
        const isActive = key === active;
        const opensSheet = !path;

        return (
          <button
            key={key}
            type="button"
            className={`appnav-item${isActive ? " is-active" : ""}`}
            aria-current={isActive && !opensSheet ? "page" : undefined}
            aria-haspopup={opensSheet ? "dialog" : undefined}
            aria-expanded={opensSheet ? botSheetOpen : undefined}
            onClick={() => (opensSheet ? onBotClick() : navigate(path))}
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
