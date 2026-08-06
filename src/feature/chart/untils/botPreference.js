import { SIGNAL_GENERATORS } from "./botSignals";

// BOT đang chọn được nhớ lại giữa các lần mở màn biểu đồ.
//
// Chỗ nhớ đặt Ở ĐÂY chứ không ở thanh tab: đường vào màn biểu đồ có nhiều lối
// (tab Bot, bấm một dòng ở Bộ lọc, link có sẵn), mà chỉ lối đầu đi qua thanh tab.
// Để màn biểu đồ tự đắp `?bot=` khi URL thiếu thì mọi lối đều đúng.
//
// Khuôn `resolveStorage` + `try/catch` chép theo `indicatorSettings.js` trong cùng
// thư mục: localStorage ném lỗi ở chế độ riêng tư và trong iframe bị hạn chế.

export const BOT_STORAGE_KEY = "chart.bot.v1";

export const DEFAULT_BOT = "trend";

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/**
 * Giá trị bot có hợp lệ không — suy thẳng từ `SIGNAL_GENERATORS` để không phải
 * nuôi bảng thứ hai khi thêm bot mới.
 */
export function isKnownBot(value) {
  return Object.prototype.hasOwnProperty.call(SIGNAL_GENERATORS, String(value));
}

/** Bot đã lưu. Chưa lưu gì, giá trị lạ, hoặc storage chết → `trend`. */
export function loadBot(storage) {
  try {
    const stored = resolveStorage(storage)?.getItem(BOT_STORAGE_KEY);
    return isKnownBot(stored) ? stored : DEFAULT_BOT;
  } catch {
    return DEFAULT_BOT;
  }
}

/** Ghi nhớ bot. Giá trị lạ thì bỏ qua chứ không ghi đè bằng mặc định. */
export function saveBot(bot, storage) {
  if (!isKnownBot(bot)) return;
  try {
    resolveStorage(storage)?.setItem(BOT_STORAGE_KEY, bot);
  } catch {
    // Không lưu được thì thôi — mất trí nhớ giữa các phiên, không phải lỗi chặn.
  }
}
