import { useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";

import BottomTabBar from "./components/BottomTabBar";
import BotSheet from "./components/BotSheet";
import { isKnownBot, loadBot } from "../feature/chart/untils/botPreference";
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
  const [searchParams] = useSearchParams();

  // Bot đang xem, để tấm trượt đánh dấu đúng mục. URL là nguồn sự thật; chỉ màn
  // "/" mới đặt `?bot=`, nên đứng ở Bộ lọc/Biểu đồ/Tài khoản thì đọc trí nhớ.
  //
  // CHỈ ĐỌC. Việc ghi `chart.bot.v1` có một chủ duy nhất là feature/chart/index.jsx
  // — hai nơi cùng ghi thì sớm muộn lệch nhau.
  //
  // Import ngược sang feature/ là có chủ ý: botPreference kéo theo botSignals →
  // indicators, dời nó lên layouts/untils/ thì tầng dùng chung phải gánh cả đống
  // đó. MainLayout.jsx đã có tiền lệ import util từ feature/auth/user/.
  const botFromUrl = searchParams.get("bot");
  const bot = isKnownBot(botFromUrl) ? botFromUrl : loadBot();

  return (
    <div className="appLayout">
      <div className="appLayout-content">
        <Outlet />
      </div>

      <BottomTabBar
        botSheetOpen={botSheetOpen}
        onBotClick={() => setBotSheetOpen((open) => !open)}
      />
      <BotSheet
        open={botSheetOpen}
        bot={bot}
        onClose={() => setBotSheetOpen(false)}
      />
    </div>
  );
}

export default AppLayout;
