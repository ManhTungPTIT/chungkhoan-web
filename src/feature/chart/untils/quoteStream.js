import { normalizeQuote } from "../hooks/useQuotes";

// Singleton WebSocket tới BE /ws/quotes — MỘT kết nối cho mọi hook/mã.
// Rớt → báo null cho mọi listener (hook trả null → index.jsx rơi về poll 5s)
// rồi tự nối lại với backoff 1,2,4…30s; nối lại được thì re-subscribe toàn bộ
// mã đang theo dõi. Hết listener → đóng hẳn, không giữ kết nối thừa.

const FIRST_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

let ws = null;
let reconnectTimer = null;
let reconnectDelay = FIRST_RECONNECT_DELAY_MS;
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

function connect() {
  if (ws || reconnectTimer) return;
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
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelay);
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
      // hết người xem → dọn sạch: hủy hẹn nối lại, đóng socket
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      reconnectDelay = FIRST_RECONNECT_DELAY_MS;
      const socket = ws;
      ws = null;
      socket?.close();
    }
  };
}
