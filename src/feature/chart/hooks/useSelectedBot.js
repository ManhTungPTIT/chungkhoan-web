import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { isKnownBot, loadBot, saveBot } from "../untils/botPreference";

/**
 * BOT đang chọn, đọc từ `?bot=` và tự đắp vào URL khi thiếu.
 *
 * URL là nguồn sự thật, localStorage chỉ là trí nhớ giữa các lần mở. Màn nào
 * gọi hook này thì mọi lối vào màn đó đều giữ đúng bot — kể cả lối không đi qua
 * thanh tab (bấm một dòng ở Bộ lọc, link có sẵn, mở lại app).
 *
 * Tách khỏi feature/chart/index.jsx để trang bộ lọc dùng đúng MỘT cơ chế, không
 * phải bản chép thứ hai lệch dần theo thời gian.
 */
export function useSelectedBot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const botFromUrl = searchParams.get("bot");
  const bot = isKnownBot(botFromUrl) ? botFromUrl : loadBot();

  useEffect(() => {
    if (isKnownBot(botFromUrl)) {
      saveBot(botFromUrl);
      return;
    }
    // `replace` để không thêm mục lịch sử — nếu không, bấm back một lần chỉ quay
    // về chính trang này với URL cũ.
    setSearchParams(
      (params) => {
        params.set("bot", bot);
        return params;
      },
      { replace: true },
    );
  }, [botFromUrl, bot, setSearchParams]);

  return bot;
}
