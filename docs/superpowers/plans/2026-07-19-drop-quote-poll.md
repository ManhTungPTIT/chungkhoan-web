# Bỏ REST poll `/quotes`, chỉ dùng WS cho giá realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chart chỉ lấy giá realtime từ WS `/ws/quotes` (không còn REST poll `/quotes` 5s dự phòng); `/intraday` (lịch sử) không đổi. Thêm banner báo lỗi khi WS mất kết nối liên tục ≥5s (debounce, tránh nhấp nháy theo backoff reconnect bình thường).

**Architecture:** `quoteStream.js` (singleton WS) thêm 1 pub/sub trạng thái kết nối bên cạnh pub/sub quote hiện có; hook mới `useQuoteConnectionStatus` bọc pub/sub đó với debounce 5s. `normalizeQuote` (hàm thuần, dùng chung bởi WS) tách khỏi `useQuotes.js` sang file riêng trước khi xoá `useQuotes.js`.

**Tech Stack:** React, Vitest + @testing-library/react (`renderHook`, fake timers), WebSocket (mock qua `FakeWebSocket` trong test có sẵn).

## Global Constraints

- `/intraday`, `useIntraday.js`, backend (`tick_hub.py`, `/ws/quotes`, `/quotes` REST): KHÔNG đổi hành vi.
- Cơ chế reconnect/backoff của `quoteStream.js` (1s→30s, market-closed retry 60s, idle-close 30s): KHÔNG đổi, chỉ thêm broadcast trạng thái kết nối.
- `DataStatusBanner.jsx` giữ nguyên signature props (`isError`, `hasData`).
- Banner lỗi kết nối WS PHẢI debounce 5s: chỉ báo lỗi nếu mất kết nối liên tục ≥5s; nối lại trong lúc chờ (backoff bình thường) → không bao giờ hiện banner.
- `normalizeQuote` phải là hàm thuần (không phụ thuộc axios/react-query) để `quoteStream.js` (WS, không dùng react-query) import được sạch.
- Theo spec: `docs/superpowers/specs/2026-07-19-drop-quote-poll-design.md`.

---

### Task 1: Tách `normalizeQuote` ra file riêng, dọn test tương ứng

**Files:**
- Create: `src/feature/chart/untils/normalizeQuote.js`
- Create: `src/feature/chart/untils/__tests__/normalizeQuote.test.js`
- Modify: `src/feature/chart/untils/quoteStream.js:1`
- Modify: `src/feature/chart/hooks/useQuotes.js:1-35`
- Modify: `src/feature/chart/hooks/__tests__/useQuotes.test.js:4,9-48`

**Interfaces:**
- Produces: `normalizeQuote(item, fallbackTime) -> {price, time, volume?} | null` tại `untils/normalizeQuote.js` (export named).

- [ ] **Step 1: Tạo `untils/normalizeQuote.js`**

```js
// Chuẩn hoá 1 quote thô (từ REST /quotes cũ hoặc WS /ws/quotes) về
// {price, time, volume?} — dùng chung bởi quoteStream.js (WS).
export function normalizeQuote(item, fallbackTime) {
  if (!item) return null;
  const price = Number(item.price);
  const rawTime = item.time ?? fallbackTime;
  const time =
    typeof rawTime === "number"
      ? rawTime
      : Math.floor(new Date(rawTime).getTime() / 1000);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(time))
    return null;

  const volume = Number(item.volume);
  return {
    price,
    time,
    ...(Number.isFinite(volume) ? { volume } : {}),
  };
}
```

- [ ] **Step 2: Tạo `untils/__tests__/normalizeQuote.test.js`**

```js
import { describe, it, expect } from "vitest";
import { normalizeQuote } from "../normalizeQuote";

describe("normalizeQuote", () => {
  it("ép price/volume chuỗi thành number, giữ time unix", () => {
    const out = normalizeQuote({ price: "12.34", volume: "5000", time: 1751856245 });
    expect(out).toEqual({ price: 12.34, volume: 5000, time: 1751856245 });
  });

  it("time chuỗi ngày giờ → unix giây", () => {
    const out = normalizeQuote({ price: "1", time: "2026-07-07" });
    expect(out.time).toBe(Date.UTC(2026, 6, 7) / 1000);
  });

  it("item thiếu time → dùng fallbackTime của snapshot (ISO có timezone)", () => {
    const out = normalizeQuote({ price: "12" }, "2026-07-07T10:30:00+07:00");
    expect(out.time).toBe(Date.UTC(2026, 6, 7, 3, 30) / 1000);
  });

  it("item có time riêng → thắng fallbackTime", () => {
    const out = normalizeQuote(
      { price: "12", time: 1751856245 },
      "2026-07-07T10:30:00+07:00",
    );
    expect(out.time).toBe(1751856245);
  });

  it("price/time không hợp lệ → null (loại khỏi snapshot)", () => {
    expect(normalizeQuote({ price: "nan", time: 1751856245 })).toBeNull();
    expect(normalizeQuote({ price: "12" })).toBeNull();
    expect(normalizeQuote(null)).toBeNull();
  });

  it("price <= 0 (mã chưa khớp lệnh) → null, không merge low=0 vào nến", () => {
    expect(normalizeQuote({ price: 0, time: 1751856245 })).toBeNull();
    expect(normalizeQuote({ price: "-1", time: 1751856245 })).toBeNull();
  });

  it("volume thiếu/'nan' → bỏ field, không thành NaN", () => {
    const out = normalizeQuote({ price: "12", time: 1751856245, volume: "nan" });
    expect(out).toEqual({ price: 12, time: 1751856245 });
  });
});
```

- [ ] **Step 3: Chạy test mới, xác nhận PASS**

Run: `npx vitest run src/feature/chart/untils/__tests__/normalizeQuote.test.js`
Expected: 7 passed

- [ ] **Step 4: Đổi import trong `quoteStream.js`**

Dòng 1, đổi:
```js
import { normalizeQuote } from "../hooks/useQuotes";
```
thành:
```js
import { normalizeQuote } from "./normalizeQuote";
```

- [ ] **Step 5: Xoá định nghĩa `normalizeQuote` khỏi `useQuotes.js`, import từ vị trí mới**

Trong `src/feature/chart/hooks/useQuotes.js`, đổi 3 dòng đầu:
```js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
```
thành:
```js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { normalizeQuote } from "../untils/normalizeQuote";
```

Xoá toàn bộ định nghĩa hàm (dòng 18-35 gốc):
```js
export function normalizeQuote(item, fallbackTime) {
  if (!item) return null;
  const price = Number(item.price);
  const rawTime = item.time ?? fallbackTime;
  const time =
    typeof rawTime === "number"
      ? rawTime
      : Math.floor(new Date(rawTime).getTime() / 1000);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(time))
    return null;

  const volume = Number(item.volume);
  return {
    price,
    time,
    ...(Number.isFinite(volume) ? { volume } : {}),
  };
}

```
(xoá cả dòng trống thừa ngay sau, giữ nguyên phần comment contract BE phía trên và `export const fetchQuotes = ...` phía dưới không đổi).

- [ ] **Step 6: Dọn `useQuotes.test.js`**

Dòng 4, đổi:
```js
import { normalizeQuote, fetchQuotes } from "../useQuotes";
```
thành:
```js
import { fetchQuotes } from "../useQuotes";
```

Xoá toàn bộ block `describe("normalizeQuote", ...)` (dòng 9-48 gốc — từ `describe("normalizeQuote", () => {` tới dấu `});` đóng block đó, ngay trước `describe("fetchQuotes", ...)`).

- [ ] **Step 7: Chạy lại các test liên quan, xác nhận PASS**

Run: `npx vitest run src/feature/chart/untils/__tests__/quoteStream.test.js src/feature/chart/hooks/__tests__/useQuotes.test.js src/feature/chart/untils/__tests__/normalizeQuote.test.js`
Expected: tất cả pass (quoteStream.test.js hành vi không đổi vì `normalizeQuote` vẫn cùng logic, chỉ đổi nguồn import; `useQuotes.test.js` mất nhóm `normalizeQuote` nhưng còn `fetchQuotes` + `useLiveCandles` vẫn pass).

- [ ] **Step 8: Commit**

```bash
git add src/feature/chart/untils/normalizeQuote.js src/feature/chart/untils/__tests__/normalizeQuote.test.js src/feature/chart/untils/quoteStream.js src/feature/chart/hooks/useQuotes.js src/feature/chart/hooks/__tests__/useQuotes.test.js
git commit -m "refactor: tach normalizeQuote khoi useQuotes.js sang file rieng"
```

---

### Task 2: Thêm trạng thái kết nối WS vào `quoteStream.js` + hook debounce 5s

**Files:**
- Modify: `src/feature/chart/untils/quoteStream.js`
- Modify: `src/feature/chart/untils/__tests__/quoteStream.test.js`
- Create: `src/feature/chart/hooks/useQuoteConnectionStatus.js`
- Create: `src/feature/chart/hooks/__tests__/useQuoteConnectionStatus.test.js`

**Interfaces:**
- Consumes: `ws.onopen`/`ws.onclose` hiện có trong `quoteStream.js` (Task 1 giữ nguyên phần này).
- Produces: `subscribeConnectionStatus(callback: (connected: boolean) => void) -> unsubscribe: () => void` tại `untils/quoteStream.js`; `useQuoteConnectionStatus() -> isDisconnected: boolean` tại `hooks/useQuoteConnectionStatus.js`.

- [ ] **Step 1: Viết test cho `subscribeConnectionStatus` (RED)**

Trong `src/feature/chart/untils/__tests__/quoteStream.test.js`, đổi khai báo đầu file:
```js
let subscribeQuote;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", FakeWebSocket);
  FakeWebSocket.instances = [];
  // module giữ state singleton → nạp module MỚI cho mỗi test
  vi.resetModules();
  ({ subscribeQuote } = await import("../quoteStream"));
});
```
thành:
```js
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
```

Thêm vào cuối file (sau `describe("subscribeQuote", ...)`):
```js

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
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npx vitest run src/feature/chart/untils/__tests__/quoteStream.test.js`
Expected: FAIL — `subscribeConnectionStatus is not a function` (chưa export)

- [ ] **Step 3: Cài đặt `subscribeConnectionStatus` trong `quoteStream.js`**

Sau dòng `const listeners = new Map(); // symbol (hoa) -> Set<callback>`, thêm:
```js
const statusListeners = new Set(); // callback(isConnected: boolean)
let connected = false;

function notifyStatus(isConnected) {
  connected = isConnected;
  for (const cb of statusListeners) cb(isConnected);
}
```

Trong `ws.onopen`, thêm `notifyStatus(true);` ngay đầu:
```js
  ws.onopen = () => {
    reconnectDelay = FIRST_RECONNECT_DELAY_MS; // nối được → reset backoff
    notifyStatus(true);
    for (const symbol of listeners.keys()) send("subscribe", symbol);
  };
```

Trong `ws.onclose`, thêm `notifyStatus(false);` ngay đầu (giữ nguyên comment cũ, sẽ cập nhật ở Task 3):
```js
  ws.onclose = () => {
    ws = null;
    notifyStatus(false);
    // Báo mất kết nối để hook trả null → UI fallback về poll ngay lập tức
    for (const set of listeners.values()) for (const cb of set) cb(null);
```

Ngay sau hàm `subscribeQuote` (trước block `// Vite HMR (chỉ DEV)...`), thêm:
```js
/**
 * Theo dõi trạng thái kết nối WS (KHÔNG theo mã — 1 kết nối dùng chung).
 * callback nhận true khi vừa mở/nối lại, false khi vừa rớt. Gọi ngay với
 * trạng thái hiện tại lúc đăng ký. Trả về hàm hủy đăng ký.
 */
export function subscribeConnectionStatus(callback) {
  statusListeners.add(callback);
  callback(connected);
  return () => statusListeners.delete(callback);
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npx vitest run src/feature/chart/untils/__tests__/quoteStream.test.js`
Expected: tất cả pass (bao gồm 3 test mới + toàn bộ test `subscribeQuote` cũ không đổi hành vi)

- [ ] **Step 5: Viết test cho hook `useQuoteConnectionStatus` (RED)**

Tạo `src/feature/chart/hooks/__tests__/useQuoteConnectionStatus.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { subscribeConnectionStatus } from "../../untils/quoteStream";
import { useQuoteConnectionStatus } from "../useQuoteConnectionStatus";

vi.mock("../../untils/quoteStream", () => ({ subscribeConnectionStatus: vi.fn() }));

describe("useQuoteConnectionStatus", () => {
  let pushStatus;
  let unsubscribe;

  beforeEach(() => {
    vi.useFakeTimers();
    unsubscribe = vi.fn();
    vi.mocked(subscribeConnectionStatus).mockReset().mockImplementation((cb) => {
      pushStatus = cb;
      return unsubscribe;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mặc định false (chưa báo lỗi) dù trạng thái ban đầu là false", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    expect(result.current).toBe(false); // chưa đủ 5s
  });

  it("mất kết nối ĐỦ 5s liên tục → true", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(true);
  });

  it("nối lại TRƯỚC 5s → không bao giờ báo lỗi", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(3000));
    act(() => pushStatus(true));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(false);
  });

  it("đã báo lỗi rồi, nối lại → reset về false ngay", () => {
    const { result } = renderHook(() => useQuoteConnectionStatus());
    act(() => pushStatus(false));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(true);

    act(() => pushStatus(true));
    expect(result.current).toBe(false);
  });

  it("unmount → hủy đăng ký", () => {
    const { unmount } = renderHook(() => useQuoteConnectionStatus());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Chạy test để xác nhận FAIL**

Run: `npx vitest run src/feature/chart/hooks/__tests__/useQuoteConnectionStatus.test.js`
Expected: FAIL — không resolve được module `../useQuoteConnectionStatus`

- [ ] **Step 7: Cài đặt hook `useQuoteConnectionStatus`**

Tạo `src/feature/chart/hooks/useQuoteConnectionStatus.js`:
```js
import { useEffect, useRef, useState } from "react";
import { subscribeConnectionStatus } from "../untils/quoteStream";

const GRACE_MS = 5000;

/**
 * true khi WS mất kết nối LIÊN TỤC ≥5s (debounce) — dùng để báo banner lỗi
 * mà không nhấp nháy theo mỗi lần backoff reconnect (1s/2s/4s) bình thường.
 * Nối lại bất cứ lúc nào trong 5s đầu → không bao giờ báo lỗi.
 */
export function useQuoteConnectionStatus() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const unsubscribe = subscribeConnectionStatus((connected) => {
      clearTimer();
      if (connected) {
        setIsDisconnected(false);
        return;
      }
      timerRef.current = setTimeout(() => setIsDisconnected(true), GRACE_MS);
    });

    return () => {
      clearTimer();
      unsubscribe();
    };
  }, []);

  return isDisconnected;
}
```

- [ ] **Step 8: Chạy test để xác nhận PASS**

Run: `npx vitest run src/feature/chart/hooks/__tests__/useQuoteConnectionStatus.test.js`
Expected: 5 passed

- [ ] **Step 9: Commit**

```bash
git add src/feature/chart/untils/quoteStream.js src/feature/chart/untils/__tests__/quoteStream.test.js src/feature/chart/hooks/useQuoteConnectionStatus.js src/feature/chart/hooks/__tests__/useQuoteConnectionStatus.test.js
git commit -m "feat: them trang thai ket noi WS + hook debounce 5s cho banner loi"
```

---

### Task 3: Bỏ REST poll khỏi `index.jsx`, xoá `useQuotes.js`, dọn test, cập nhật comment lỗi thời

**Files:**
- Modify: `src/feature/chart/index.jsx`
- Delete: `src/feature/chart/hooks/useQuotes.js`
- Delete: `src/feature/chart/hooks/__tests__/useQuotes.test.js`
- Create: `src/feature/chart/hooks/__tests__/useLiveCandles.test.js`
- Modify: `src/feature/chart/hooks/useQuoteStream.js:6-8`
- Modify: `src/feature/chart/hooks/useLiveCandles.js:7`
- Modify: `src/feature/chart/hooks/useIntraday.js:75`
- Modify: `src/feature/chart/untils/quoteStream.js` (comment trong `ws.onclose`)
- Modify: `src/feature/chart/layouts/DataStatusBanner.jsx:1-3`

**Interfaces:**
- Consumes: `useQuoteConnectionStatus()` (Task 2), `subscribeConnectionStatus`/`normalizeQuote` (Task 1-2, không đổi thêm).

- [ ] **Step 1: Chuyển test `useLiveCandles` (hook) sang file riêng**

Tạo `src/feature/chart/hooks/__tests__/useLiveCandles.test.js`:
```js
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLiveCandles } from "../useLiveCandles";

describe("useLiveCandles", () => {
  const T0 = Date.UTC(2026, 6, 7) / 1000; // nến ngày 07/07
  const tick = (price, offsetSec) => ({
    price,
    time: Date.UTC(2026, 6, 7, 3, 0, offsetSec) / 1000,
  });
  const base = [
    { time: T0, open: 100, high: 100, low: 100, close: 100, volume: 0 },
  ];

  it("không có quote → trả nguyên lịch sử", () => {
    const { result } = renderHook(() => useLiveCandles(base, null, "AAA", "1d"));
    expect(result.current).toBe(base);
  });

  it("merge quote vào nến cuối và GIỮ kết quả qua các tick sau", () => {
    const { result, rerender } = renderHook(
      ({ quote }) => useLiveCandles(base, quote, "AAA", "1d"),
      { initialProps: { quote: tick(105, 0) } },
    );
    expect(result.current[0].close).toBe(105);
    expect(result.current[0].high).toBe(105);

    // Tick sau giá tụt: high 105 phải được giữ (tích luỹ, không tính lại từ base)
    rerender({ quote: tick(101, 10) });
    expect(result.current[0].close).toBe(101);
    expect(result.current[0].high).toBe(105);
  });

  it("đổi mã (symbol) → reset về lịch sử mới, bỏ nến đã merge của mã cũ", () => {
    const baseBBB = [
      { time: T0, open: 50, high: 50, low: 50, close: 50, volume: 0 },
    ];
    const { result, rerender } = renderHook(
      ({ candles, quote, sym }) => useLiveCandles(candles, quote, sym, "1d"),
      { initialProps: { candles: base, quote: tick(105, 0), sym: "AAA" } },
    );
    expect(result.current[0].close).toBe(105);

    rerender({ candles: baseBBB, quote: null, sym: "BBB" });
    expect(result.current).toBe(baseBBB);
  });

  it("lịch sử refetch (đổi reference) → lấy lịch sử mới làm gốc", () => {
    const { result, rerender } = renderHook(
      ({ candles, quote }) => useLiveCandles(candles, quote, "AAA", "1d"),
      { initialProps: { candles: base, quote: tick(105, 0) } },
    );
    expect(result.current[0].close).toBe(105);

    const refreshed = [
      { time: T0, open: 100, high: 106, low: 99, close: 106, volume: 0 },
    ];
    rerender({ candles: refreshed, quote: null });
    expect(result.current).toBe(refreshed);
  });

  it("candles undefined (đang tải lần đầu) → mảng rỗng ổn định", () => {
    const { result } = renderHook(() =>
      useLiveCandles(undefined, tick(105, 0), "AAA", "1d"),
    );
    expect(result.current).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy test mới, xác nhận PASS**

Run: `npx vitest run src/feature/chart/hooks/__tests__/useLiveCandles.test.js`
Expected: 5 passed

- [ ] **Step 3: Xoá `useQuotes.js` và `useQuotes.test.js`**

```bash
git rm src/feature/chart/hooks/useQuotes.js src/feature/chart/hooks/__tests__/useQuotes.test.js
```

- [ ] **Step 4: Sửa `index.jsx` — bỏ import + usage `useQuotes`, thêm `useQuoteConnectionStatus`**

Dòng 29, xoá:
```js
import { useQuotes } from "./hooks/useQuotes";
```

Thêm ngay dưới dòng `import { useLiveCandles } from "./hooks/useLiveCandles";`:
```js
import { useQuoteConnectionStatus } from "./hooks/useQuoteConnectionStatus";
```

Đổi khối (khoảng dòng 144-153 gốc):
```js
  // Giá realtime: 1 endpoint /quotes chung cho mọi mã, poll 5s. Merge giá
  // của mã đang xem vào nến cuối (hoặc append nến mới khi sang khung mới).
  // Đang hiện nến placeholder của mã CŨ thì không merge giá mã mới vào.
  const { data: quotes, isError: isQuotesError } = useQuotes();
  // Giá realtime từ WS /ws/quotes (tick tức thì); rớt/chưa có tick → null
  // → rơi về quote poll 5s bên dưới. Mọi lỗi stream đều degrade về poll.
  const streamQuote = useQuoteStream(chanelCode);
  const liveQuote = isPlaceholderData
    ? null
    : (streamQuote ?? quotes?.[chanelCode] ?? null);
```
thành:
```js
  // Giá realtime CHỈ từ WS /ws/quotes (tick tức thì) — không còn REST poll
  // dự phòng: WS (DNSE v2) đã ổn định, poll chỉ còn là gọi API thừa mỗi 5s.
  // Đang hiện nến placeholder của mã CŨ thì không merge giá mã mới vào.
  const streamQuote = useQuoteStream(chanelCode);
  const liveQuote = isPlaceholderData ? null : streamQuote;
  // true khi WS mất kết nối LIÊN TỤC ≥5s (debounce) — báo banner lỗi mà
  // không nhấp nháy theo mỗi lần backoff reconnect bình thường.
  const isQuoteDisconnected = useQuoteConnectionStatus();
```

Đổi khối `DataStatusBanner` (khoảng dòng 460-463 gốc):
```js
        <DataStatusBanner
          isError={isHistoryError || isQuotesError}
          hasData={candles.length > 0}
        />
```
thành:
```js
        <DataStatusBanner
          isError={isHistoryError || isQuoteDisconnected}
          hasData={candles.length > 0}
        />
```

- [ ] **Step 5: Cập nhật comment lỗi thời nhắc tới `useQuotes`/poll**

`src/feature/chart/hooks/useQuoteStream.js`, dòng 6-8, đổi:
```js
 * Trả {price, time, volume?} — CÙNG shape với quote poll của useQuotes —
 * hoặc null khi: chưa có tick, mất kết nối, symbol rỗng, vừa đổi mã.
 * Caller (index.jsx) dùng `streamQuote ?? quotePoll` nên null = fallback poll.
```
thành:
```js
 * Trả {price, time, volume?} hoặc null khi: chưa có tick, mất kết nối,
 * symbol rỗng, vừa đổi mã. Không còn REST poll dự phòng — null nghĩa là
 * chưa có giá để hiển thị (xem useQuoteConnectionStatus cho banner lỗi).
```

`src/feature/chart/hooks/useLiveCandles.js`, dòng 7, đổi:
```js
 * Gộp giá realtime (useQuotes) vào lịch sử nến (useIntraday) và TÍCH LUỸ
```
thành:
```js
 * Gộp giá realtime (WS /ws/quotes qua useQuoteStream) vào lịch sử nến (useIntraday) và TÍCH LUỸ
```

`src/feature/chart/hooks/useIntraday.js`, dòng 75, đổi:
```js
    // useQuotes (1 endpoint chung mọi mã) và merge bằng useLiveCandles.
```
thành:
```js
    // WS /ws/quotes (useQuoteStream) và merge bằng useLiveCandles.
```

`src/feature/chart/untils/quoteStream.js`, trong `ws.onclose`, đổi:
```js
    // Báo mất kết nối để hook trả null → UI fallback về poll ngay lập tức
```
thành:
```js
    // Báo mất kết nối để hook trả null; useQuoteConnectionStatus báo banner
    // lỗi nếu mất kết nối liên tục ≥5s (xem debounce trong hook đó).
```

`src/feature/chart/layouts/DataStatusBanner.jsx`, dòng 1-3, đổi:
```js
// Cảnh báo khi poll dữ liệu 5s thất bại (backend :8000 chết, mất mạng...).
// Không có banner này lỗi hoàn toàn im lặng: react-query giữ nến cũ
// (keepPreviousData/gcTime) nên chart trông như "đứng hình" không rõ lý do.
```
thành:
```js
// Cảnh báo khi mất nguồn dữ liệu: /intraday lỗi (backend :8000 chết, mất
// mạng...) hoặc WS /ws/quotes mất kết nối liên tục ≥5s. Không có banner này
// lỗi hoàn toàn im lặng: react-query giữ nến cũ (keepPreviousData/gcTime)
// nên chart trông như "đứng hình" không rõ lý do.
```

- [ ] **Step 6: Chạy toàn bộ test suite + lint**

Run: `npm test`
Expected: tất cả pass, không còn test nào tham chiếu `useQuotes.js` đã xoá.

Run: `npm run lint`
Expected: không lỗi mới (đặc biệt: không còn import `useQuotes` nào sót lại — ESLint `no-unused-vars`/import lỗi sẽ bắt được nếu sót).

- [ ] **Step 7: Commit**

```bash
git add -A -- src/feature/chart
git commit -m "feat: bo REST poll /quotes khoi chart, chi dung WS cho gia realtime"
```

---

### Task 4: Xác minh cuối cùng

**Files:** không tạo/sửa file mới — chỉ chạy kiểm tra.

- [ ] **Step 1: Chạy toàn bộ test suite**

Run: `npm test`
Expected: tất cả pass.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: không lỗi.

- [ ] **Step 3: Grep xác nhận không còn tham chiếu `useQuotes`/`isQuotesError` nào sót**

Run: `grep -rn "useQuotes\|isQuotesError" src/`
Expected: không có kết quả nào (file `useQuotes.js` đã xoá hẳn ở Task 3).

- [ ] **Step 4: Rà lại spec vs code**

Đối chiếu từng mục trong `docs/superpowers/specs/2026-07-19-drop-quote-poll-design.md` với code đã sửa (bỏ poll khỏi index.jsx, normalizeQuote tách file, connection-status pub/sub + debounce 5s, dọn test, cập nhật comment) — xác nhận không mục nào bị bỏ sót.

**Lưu ý ngoài phạm vi tự động hoá được:** hành vi thực tế của banner khi WS thật sự rớt (mất mạng, BE restart) trong giờ giao dịch chỉ kiểm chứng được bằng test giả lập (Task 2) — muốn xác nhận trên trình duyệt thật cần chạy `npm run dev` trong giờ GD và tắt/bật lại backend WS thủ công.
