import { useState } from "react";
import { Outlet } from "react-router-dom";

import BottomTabBar from "./components/BottomTabBar";
import BotSheet from "./components/BotSheet";
import "./styles/appNav.scss";

/**
 * Khung màn hình của bản đóng gói thành app native.
 *
 * Thay cho MainLayout (sidebar) của bản web. Chọn giữa hai khung ở tầng route
 * bằng cờ build IS_APP — xem routes/AppRoute.jsx.
 *
 * MainLayout cố ý KHÔNG bị sửa: bản web đang chạy, tách hẳn hai khung thì đổi
 * điều hướng app không có đường nào làm hỏng web.
 */
function AppLayout() {
  const [botSheetOpen, setBotSheetOpen] = useState(false);

  return (
    <div className="appLayout">
      <div className="appLayout-content">
        <Outlet />
      </div>

      <BottomTabBar
        botSheetOpen={botSheetOpen}
        onBotClick={() => setBotSheetOpen((open) => !open)}
      />
      <BotSheet open={botSheetOpen} onClose={() => setBotSheetOpen(false)} />
    </div>
  );
}

export default AppLayout;
