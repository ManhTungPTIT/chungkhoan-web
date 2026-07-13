import { describe, it, expect } from "vitest";
import { bucketStart, mergeQuoteIntoCandles } from "../liveCandle";

// Nến tối giản: time unix giây, OHLC number (như useIntraday đã normalize)
const candle = (time, close, extra = {}) => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume: 0,
  ...extra,
});

// 2026-07-07 03:04:05 UTC (10:04:05 giờ VN, trong phiên)
const T = Date.UTC(2026, 6, 7, 3, 4, 5) / 1000;

// Nửa đêm giờ VN (UTC+7) của một ngày, tính bằng giây unix. Nến ngày/tuần/tháng
// từ vnstock được đóng dấu tại mốc này (vd 2026-07-10 → 2026-07-09 17:00 UTC).
const VN_OFFSET = 7 * 60 * 60;
const vnMidnight = (y, m, d) => Date.UTC(y, m, d) / 1000 - VN_OFFSET;

describe("bucketStart", () => {
  it("khung phút/giờ: floor về đầu khung", () => {
    expect(bucketStart(T, "1m")).toBe(Date.UTC(2026, 6, 7, 3, 4) / 1000);
    expect(bucketStart(T, "5m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "15m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "30m")).toBe(Date.UTC(2026, 6, 7, 3, 0) / 1000);
    expect(bucketStart(T, "1h")).toBe(Date.UTC(2026, 6, 7, 3) / 1000);
  });

  it("khung ngày: floor về nửa đêm giờ VN của ngày giao dịch (khớp stamp nến ngày vnstock)", () => {
    expect(bucketStart(T, "1d")).toBe(vnMidnight(2026, 6, 7));
  });

  it("khung tuần: floor về thứ Hai đầu tuần (nửa đêm giờ VN)", () => {
    // 2026-07-07 là thứ Ba → tuần bắt đầu thứ Hai 2026-07-06
    expect(bucketStart(T, "1w")).toBe(vnMidnight(2026, 6, 6));
    // Chính thứ Hai thì giữ nguyên ngày
    expect(bucketStart(Date.UTC(2026, 6, 6, 5) / 1000, "1w")).toBe(
      vnMidnight(2026, 6, 6),
    );
  });

  it("khung tháng: floor về ngày 1 đầu tháng (nửa đêm giờ VN)", () => {
    expect(bucketStart(T, "1mth")).toBe(vnMidnight(2026, 6, 1));
  });
});

describe("mergeQuoteIntoCandles — cùng khung nến cuối", () => {
  it("cập nhật close, nới high/low, giữ nguyên time và open", () => {
    const last = candle(Date.UTC(2026, 6, 7) / 1000, 100, { open: 98, high: 101, low: 97 });
    const out = mergeQuoteIntoCandles([last], { price: 103, time: T }, "1d");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ time: last.time, open: 98, high: 103, low: 97, close: 103 });
  });

  it("giá giảm sâu → hạ low, giữ high", () => {
    const last = candle(Date.UTC(2026, 6, 7) / 1000, 100, { high: 101, low: 97 });
    const out = mergeQuoteIntoCandles([last], { price: 95, time: T }, "1d");
    expect(out[0]).toMatchObject({ high: 101, low: 95, close: 95 });
  });

  it("nến cuối không stamp đúng đầu khung (vd nến tuần stamp thứ Sáu) vẫn nhận ra cùng khung", () => {
    // Nến tuần stamp thứ Tư 2026-07-08? — dùng thứ Hai tuần đó +2 ngày
    const last = candle(Date.UTC(2026, 6, 8) / 1000, 100);
    const out = mergeQuoteIntoCandles([last], { price: 102, time: T }, "1w");
    expect(out).toHaveLength(1);
    expect(out[0].close).toBe(102);
  });

  it("quote không đổi gì → trả về đúng reference cũ (không re-render thừa)", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    const out = mergeQuoteIntoCandles(candles, { price: 100, time: T }, "1d");
    expect(out).toBe(candles);
  });
});

describe("mergeQuoteIntoCandles — sang khung mới", () => {
  it("append nến mới seed từ giá quote (OHLC = price)", () => {
    const last = candle(Date.UTC(2026, 6, 6) / 1000, 100); // nến ngày hôm qua
    const out = mergeQuoteIntoCandles([last], { price: 104, time: T }, "1d");
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({
      time: vnMidnight(2026, 6, 7),
      open: 104,
      high: 104,
      low: 104,
      close: 104,
    });
  });

  it("khung 1m: tick sau 2 phút append nến ở đầu khung phút mới", () => {
    const last = candle(Date.UTC(2026, 6, 7, 3, 2) / 1000, 100);
    const out = mergeQuoteIntoCandles([last], { price: 101, time: T }, "1m");
    expect(out).toHaveLength(2);
    expect(out[1].time).toBe(Date.UTC(2026, 6, 7, 3, 4) / 1000);
  });
});

describe("mergeQuoteIntoCandles — volume", () => {
  it("volume quote (KL cộng dồn trong ngày) chỉ áp vào nến khung 1d", () => {
    const day = candle(Date.UTC(2026, 6, 7) / 1000, 100, { volume: 500 });
    const outDay = mergeQuoteIntoCandles([day], { price: 101, time: T, volume: 900 }, "1d");
    expect(outDay[0].volume).toBe(900);

    const minute = candle(Date.UTC(2026, 6, 7, 3, 4) / 1000, 100, { volume: 50 });
    const outMin = mergeQuoteIntoCandles([minute], { price: 101, time: T, volume: 900 }, "1m");
    expect(outMin[0].volume).toBe(50); // giữ nguyên, không ghi đè KL ngày vào nến phút
  });
});

describe("mergeQuoteIntoCandles — dữ liệu xấu", () => {
  it("quote cũ hơn nến cuối → bỏ qua, trả reference cũ", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    const out = mergeQuoteIntoCandles(
      candles,
      { price: 90, time: Date.UTC(2026, 6, 5, 3) / 1000 },
      "1d",
    );
    expect(out).toBe(candles);
  });

  it("quote thiếu/không hợp lệ → trả nguyên candles", () => {
    const candles = [candle(Date.UTC(2026, 6, 7) / 1000, 100)];
    expect(mergeQuoteIntoCandles(candles, null, "1d")).toBe(candles);
    expect(mergeQuoteIntoCandles(candles, { price: NaN, time: T }, "1d")).toBe(candles);
    expect(mergeQuoteIntoCandles(candles, { price: 100 }, "1d")).toBe(candles);
  });

  it("seeds a temporary candle from quote when history is empty", () => {
    expect(mergeQuoteIntoCandles([], { price: 100, time: T, volume: 900 }, "1d")).toEqual([
      {
        time: vnMidnight(2026, 6, 7),
        open: 100,
        high: 100,
        low: 100,
        close: 100,
        volume: 900,
      },
    ]);
  });
});

describe("mergeQuoteIntoCandles — chặn nến ma khi nối phiên ngày mới (regression signal lệch panel)", () => {
  // Nến ngày T6 2026-07-10 (close 8.5) như /intraday AAS trả về.
  const friday = candle(vnMidnight(2026, 6, 10), 8.5, {
    open: 8.9,
    high: 8.9,
    low: 8.4,
    volume: 2166900,
  });

  it("quote trước giờ mở cửa T2 = giá chốt T6 (price === close nến cuối) → KHÔNG nối nến ma", () => {
    // Snapshot sáng T2 2026-07-13 08:00 VN, chưa có khớp mới → /quotes vẫn trả
    // nguyên giá chốt T6 (8.5). Nối vào = nến phẳng O=H=L=C sao chép phiên trước
    // → generateSignals lật SELL giả (lệch panel BE vốn giữ BUY). Phải bỏ qua.
    const candles = [friday];
    const quoteTime = Date.UTC(2026, 6, 13, 1, 0) / 1000; // 08:00 VN, trước 09:00
    const out = mergeQuoteIntoCandles(
      candles,
      { price: 8.5, time: quoteTime, volume: 2166900 },
      "1d",
    );
    expect(out).toBe(candles); // reference cũ y nguyên → không nến ma, không re-render
  });

  it("quote cuối tuần (T7/CN) dù giá khác cũng KHÔNG nối nến ma (không thể có phiên mới)", () => {
    const candles = [friday];
    const satTime = Date.UTC(2026, 6, 11, 3, 0) / 1000; // T7 2026-07-11 10:00 VN
    const out = mergeQuoteIntoCandles(candles, { price: 8.7, time: satTime }, "1d");
    expect(out).toBe(candles);
  });

  it("quote TRONG phiên T2 giá đã đổi (price !== close) → NỐI nến hôm nay bình thường", () => {
    const candles = [friday];
    const monTime = Date.UTC(2026, 6, 13, 3, 0) / 1000; // T2 10:00 VN, trong phiên
    const out = mergeQuoteIntoCandles(candles, { price: 8.6, time: monTime }, "1d");
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({
      time: vnMidnight(2026, 6, 13),
      open: 8.6,
      high: 8.6,
      low: 8.6,
      close: 8.6,
    });
  });

  it("khung nội ngày (1m) KHÔNG bị chặn dù giá trùng — nến phút mới vẫn hình thành", () => {
    const prevMinute = candle(Date.UTC(2026, 6, 13, 3, 2) / 1000, 8.5);
    const monTime = Date.UTC(2026, 6, 13, 3, 4) / 1000;
    const out = mergeQuoteIntoCandles([prevMinute], { price: 8.5, time: monTime }, "1m");
    expect(out).toHaveLength(2);
    expect(out[1].time).toBe(Date.UTC(2026, 6, 13, 3, 4) / 1000);
  });
});

describe("mergeQuoteIntoCandles — nến ngày neo nửa đêm giờ VN (regression nến ma lệch múi giờ)", () => {
  it("quote buổi chiều VN cùng ngày giao dịch với nến ngày (neo 17:00 UTC hôm trước) → CẬP NHẬT, không append nến ma", () => {
    // Nến ngày 2026-07-10 như /intraday trả về: đóng dấu nửa đêm giờ VN
    // = 2026-07-09 17:00 UTC. OHLC/volume lấy đúng số thật của VND.
    const today = candle(vnMidnight(2026, 6, 10), 18, {
      open: 18.3,
      high: 18.45,
      low: 17.85,
      volume: 17714300,
    });
    // Quote snapshot 2026-07-10 09:07 UTC = 16:07 giờ VN (sau ATC), KHÔNG có
    // time riêng → dùng chính thời điểm snapshot này (giờ UTC của hôm nay).
    const quoteTime = Date.UTC(2026, 6, 10, 9, 7) / 1000;
    const out = mergeQuoteIntoCandles(
      [today],
      { price: 18, time: quoteTime, volume: 17714300 },
      "1d",
    );
    // Cùng một ngày giao dịch VN → cập nhật nến hôm nay, KHÔNG sinh nến thứ 2.
    expect(out).toHaveLength(1);
    expect(out[0].time).toBe(today.time);
  });
});
