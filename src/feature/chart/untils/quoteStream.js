import { normalizeQuote } from "../hooks/useQuotes";

// Singleton WebSocket tới BE /ws/quotes — MỘT kết nối cho mọi hook/mã.
// Rớt → báo null cho mọi listener (hook trả null → index.jsx rơi về poll 5s)
// rồi tự nối lại với backoff 1,2,4…30s; nối lại được thì re-subscribe toàn bộ
// mã đang theo dõi. Hết listener → giữ thêm một khoảng ngắn (grace) rồi mới đóng.

const FIRST_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
// Ngoài giờ giao dịch: KHÔNG mở socket, chỉ kiểm lại mỗi phút để tới giờ mở phiên
// thì tự nối. Nhờ vậy không còn spam handshake 404 khi BE realtime không phục vụ.
const MARKET_CLOSED_RETRY_MS = 60000;
// Hết mã theo dõi → chưa đóng ngay, giữ socket thêm 30s. App chỉ có 1 consumer
// (index.jsx) nên đổi mã sẽ unsubscribe mã cũ rồi subscribe mã mới trong cùng một
// nhịp; đóng-mở ngay sẽ tạo handshake WS mới MỖI lần đổi mã. Grace period cho
// phép tái dùng kết nối đang mở khi đổi mã, chỉ đóng khi thật sự rời (idle > 30s).
const IDLE_CLOSE_DELAY_MS = 30000;

let ws = null;
let reconnectTimer = null;
let reconnectDelay = FIRST_RECONNECT_DELAY_MS;
let idleTimer = null; // hẹn đóng khi hết mã; đổi mã kịp thời sẽ hủy hẹn này
const listeners = new Map(); // symbol (hoa) -> Set<callback>

function wsUrl() {
  // VITE_PYTHON_API_URL đã gồm /api/python → chỉ thay scheme http->ws
  const base = import.meta.env.VITE_PYTHON_API_URL ?? "";
  return `${base.replace(/^http/, "ws")}/ws/quotes`;
}

function send(action, symbol) {
  if (ws?.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify({ action, symbol }));
}

// Phiên giao dịch HOSE: Thứ 2–6, 09:00–15:00 (giờ VN, Asia/Ho_Chi_Minh). Ngoài
// khung này thị trường đứng yên → không cần WebSocket; UI vẫn có dữ liệu qua poll.
function isMarketOpen(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 9 * 60 && minutes <= 15 * 60;
}

// Hẹn thử nối lại sau `delay` — bỏ qua nếu không còn ai xem hoặc đã có hẹn.
function scheduleReconnect(delay) {
  if (listeners.size === 0 || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

// Đóng hẳn socket + dọn mọi hẹn (nối lại / đóng idle). Dùng khi thật sự rời.
function teardown() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  clearTimeout(idleTimer);
  idleTimer = null;
  reconnectDelay = FIRST_RECONNECT_DELAY_MS;
  const socket = ws;
  ws = null;
  socket?.close();
}

// Hết mã theo dõi → hẹn đóng sau grace period, KHÔNG đóng ngay. Nếu trong lúc
// chờ có mã mới subscribe (đổi mã), subscribeQuote sẽ hủy hẹn này để tái dùng
// socket đang mở. Bỏ qua nếu đã có hẹn.
function scheduleIdleClose() {
  if (idleTimer) return;
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (listeners.size > 0) return; // có người xem lại trước khi hết giờ → giữ
    teardown();
  }, IDLE_CLOSE_DELAY_MS);
}

function connect() {
  if (ws || reconnectTimer) return;
  // Ngoài giờ giao dịch: KHÔNG mở socket (tránh spam handshake lỗi trên console),
  // chỉ hẹn kiểm lại — tới giờ mở phiên vòng sau sẽ tự nối.
  if (!isMarketOpen()) {
    scheduleReconnect(MARKET_CLOSED_RETRY_MS);
    return;
  }
  ws = new WebSocket(wsUrl());

  ws.onopen = () => {
    reconnectDelay = FIRST_RECONNECT_DELAY_MS; // nối được → reset backoff
    for (const symbol of listeners.keys()) send("subscribe", symbol);
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
      
    } catch {
      return; // frame hỏng → bỏ, giữ kết nối
    }
    const symbol =
      typeof msg?.symbol === "string" ? msg.symbol.toUpperCase() : "";
    const quote = normalizeQuote(msg); // cùng shape quote poll: {price,time,volume?}
    if (!symbol || !quote) return;
    for (const cb of listeners.get(symbol) ?? []) cb(quote);
  };

  ws.onclose = () => {
    ws = null;
    // Báo mất kết nối để hook trả null → UI fallback về poll ngay lập tức
    for (const set of listeners.values()) for (const cb of set) cb(null);
    if (listeners.size === 0) return; // không ai xem → khỏi nối lại
    // Ngoài giờ → chỉ kiểm lại thưa (không mở socket); trong giờ → backoff 1,2,4…30s
    if (!isMarketOpen()) {
      scheduleReconnect(MARKET_CLOSED_RETRY_MS);
      return;
    }
    scheduleReconnect(reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  };

  ws.onerror = () => {
    // browser luôn bắn close sau error; đóng chủ động cho chắc ở môi trường khác
    ws?.close();
  };
}

/**
 * Theo dõi giá realtime một mã. callback nhận quote {price,time,volume?}
 * mỗi tick, nhận null khi mất kết nối. Trả về hàm hủy đăng ký.
 */
export function subscribeQuote(symbol, callback) {
  const key = String(symbol ?? "").trim().toUpperCase();
  if (!key) return () => {};

  // Có mã mới → hủy hẹn đóng idle: tái dùng socket đang mở (mượt khi đổi mã).
  clearTimeout(idleTimer);
  idleTimer = null;

  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
    send("subscribe", key); // ws đang mở thì gửi ngay; chưa mở thì onopen gửi
  }
  set.add(callback);
  connect();

  return () => {
    const cur = listeners.get(key);
    if (!cur || !cur.delete(callback)) return;
    if (cur.size === 0) {
      listeners.delete(key);
      send("unsubscribe", key);
    }
    if (listeners.size === 0) {
      // hết người xem → CHƯA đóng ngay: hẹn đóng sau grace period để đổi mã
      // (unsubscribe cũ + subscribe mới liền nhau) tái dùng được socket đang mở.
      scheduleIdleClose();
    }
  };
}

// Vite HMR (chỉ DEV): khi module bị nạp lại, đóng socket + hủy hẹn của bản cũ
// trước khi bản mới chạy — nếu không, socket cũ mất tham chiếu nhưng vẫn mở
// (orphan) và bản mới lại mở thêm socket → tích tụ nhiều kết nối "Pending".
// `import.meta.hot` là undefined trong build production nên block này bị loại bỏ.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    teardown();
    listeners.clear();
  });
}
