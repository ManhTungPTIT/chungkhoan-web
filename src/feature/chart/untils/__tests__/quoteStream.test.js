import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// FakeWebSocket: test tự điều khiển open/message/close; ghi lại mọi instance
// và mọi frame đã send để assert.
class FakeWebSocket {
  static instances = [];
  static CONNECTING = 0;
  static OPEN = 1;
  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }
  send(data) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  // helper cho test
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
  message(obj) {
    this.onmessage?.({ data: JSON.stringify(obj) });
  }
  messageRaw(text) {
    this.onmessage?.({ data: text });
  }
}

let subscribeQuote;
let subscribeConnectionStatus;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", FakeWebSocket);
  FakeWebSocket.instances = [];
  // module giữ state singleton → nạp module MỚI cho mỗi test
  vi.resetModules();
  ({ subscribeQuote, subscribeConnectionStatus } = await import("../quoteStream"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const lastWs = () => FakeWebSocket.instances.at(-1);

describe("subscribeQuote", () => {
  it("subscribe đầu tiên mở WS tới /ws/quotes rồi gửi lệnh subscribe (mã hoa) khi open", () => {
    subscribeQuote("fpt", vi.fn());
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(lastWs().url).toContain("/ws/quotes");
    expect(lastWs().url).toMatch(/^ws/);
    expect(lastWs().sent).toEqual([]); // chưa open → chưa gửi gì

    lastWs().open();
    expect(lastWs().sent).toEqual([{ action: "subscribe", symbol: "FPT" }]);
  });

  it("nhiều mã dùng chung MỘT kết nối", () => {
    subscribeQuote("FPT", vi.fn());
    subscribeQuote("VCB", vi.fn());
    expect(FakeWebSocket.instances).toHaveLength(1);
    lastWs().open();
    expect(lastWs().sent).toEqual([
      { action: "subscribe", symbol: "FPT" },
      { action: "subscribe", symbol: "VCB" },
    ]);
  });

  it("message đúng mã → callback nhận quote normalize (bỏ field symbol); mã khác/JSON hỏng → im lặng", () => {
    const onFpt = vi.fn();
    subscribeQuote("FPT", onFpt);
    lastWs().open();

    lastWs().message({ symbol: "FPT", price: 73.2, volume: 100, time: 1783412345 });
    expect(onFpt).toHaveBeenCalledWith({ price: 73.2, volume: 100, time: 1783412345 });

    lastWs().message({ symbol: "VCB", price: 62.9, time: 1783412345 });
    lastWs().messageRaw("khong phai json");
    lastWs().message({ symbol: "FPT", price: 0, time: 1783412345 }); // giá <=0 → normalize loại
    expect(onFpt).toHaveBeenCalledTimes(1);
  });

  it("rớt kết nối → callback nhận null, tự nối lại sau 1s và re-subscribe", () => {
    const onQuote = vi.fn();
    subscribeQuote("FPT", onQuote);
    lastWs().open();

    lastWs().close(); // server rớt
    expect(onQuote).toHaveBeenCalledWith(null); // hook sẽ fallback poll

    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2); // đã mở lại
    lastWs().open();
    expect(lastWs().sent).toEqual([{ action: "subscribe", symbol: "FPT" }]); // re-subscribe
  });

  it("unsubscribe cuối của mã → gửi unsubscribe; hết mã → đóng sau grace 30s, không reconnect", () => {
    const un1 = subscribeQuote("FPT", vi.fn());
    const un2 = subscribeQuote("FPT", vi.fn());
    const ws = lastWs();
    ws.open();

    un1();
    expect(ws.sent).toEqual([{ action: "subscribe", symbol: "FPT" }]); // còn listener → chưa gửi unsubscribe

    un2();
    expect(ws.sent).toEqual([
      { action: "subscribe", symbol: "FPT" },
      { action: "unsubscribe", symbol: "FPT" },
    ]);
    expect(ws.readyState).toBe(1); // CHƯA đóng ngay: còn trong grace period

    vi.advanceTimersByTime(30000); // hết grace → đóng hẳn
    expect(ws.readyState).toBe(3);
    vi.advanceTimersByTime(60000);
    expect(FakeWebSocket.instances).toHaveLength(1); // không tự mở lại
  });

  it("đổi mã (unsubscribe mã cũ rồi subscribe mã mới ngay) tái dùng CÙNG socket, không mở mới", () => {
    const un1 = subscribeQuote("FPT", vi.fn());
    lastWs().open();
    expect(FakeWebSocket.instances).toHaveLength(1);

    // React đổi mã: cleanup effect mã cũ rồi chạy effect mã mới liền nhau
    un1();
    const un2 = subscribeQuote("VCB", vi.fn());

    expect(FakeWebSocket.instances).toHaveLength(1); // KHÔNG mở socket mới
    expect(lastWs().readyState).toBe(1); // socket cũ vẫn mở (grace period đã bị hủy)
    expect(lastWs().sent).toEqual([
      { action: "subscribe", symbol: "FPT" },
      { action: "unsubscribe", symbol: "FPT" },
      { action: "subscribe", symbol: "VCB" },
    ]);

    // không có hẹn đóng nào còn treo vì đã có mã mới
    vi.advanceTimersByTime(30000);
    expect(lastWs().readyState).toBe(1);
    un2();
  });
});

describe("subscribeConnectionStatus", () => {
  it("gọi ngay với trạng thái hiện tại (false khi chưa kết nối)", () => {
    const cb = vi.fn();
    subscribeConnectionStatus(cb);
    expect(cb).toHaveBeenCalledWith(false);
  });

  it("báo true khi WS mở, false khi WS rớt", () => {
    // isMarketOpen() chặn connect() ngoài giờ GD (kể cả cuối tuần) → cố định
    // giờ hệ thống vào 1 phiên GD thật (thứ Hai 10h VN) để test không phụ
    // thuộc ngày/giờ chạy CI.
    vi.setSystemTime(new Date("2026-07-13T10:00:00+07:00"));
    const cb = vi.fn();
    subscribeQuote("FPT", vi.fn()); // mở WS
    subscribeConnectionStatus(cb);
    cb.mockClear();

    lastWs().open();
    expect(cb).toHaveBeenCalledWith(true);

    lastWs().close();
    expect(cb).toHaveBeenCalledWith(false);
  });

  it("hủy đăng ký → không nhận thông báo nữa", () => {
    vi.setSystemTime(new Date("2026-07-13T10:00:00+07:00")); // xem lý do ở test trên
    const cb = vi.fn();
    const unsubscribe = subscribeConnectionStatus(cb);
    unsubscribe();
    cb.mockClear();

    subscribeQuote("FPT", vi.fn());
    lastWs().open();
    expect(cb).not.toHaveBeenCalled();
  });
});
