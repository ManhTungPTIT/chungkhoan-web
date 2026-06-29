import { describe, it, expect } from "vitest";
import { calcIchimoku } from "../ichimokuIndicator";

// Dữ liệu tuyến tính high=low=close=i → HH/LL trên cửa sổ là biên cửa sổ,
// cho công thức (HH+LL)/2 ra giá trị tính tay được.
const linear = (n) =>
  Array.from({ length: n }, (_, i) => ({ high: i, low: i, close: i }));

describe("calcIchimoku", () => {
  const res = calcIchimoku(linear(80)); // [9,26,52,26]

  it("Tenkan = (HH9+LL9)/2 = i-4; Kijun = (HH26+LL26)/2 = i-12.5", () => {
    expect(res[60].tenkan).toBe(56); // (60 + 52)/2
    expect(res[60].kijun).toBe(47.5); // (60 + 35)/2
  });

  it("Senkou A/B dịch tiến 26 phiên (lấy giá trị raw tại i-26)", () => {
    // spanARaw[52] = ((52-4)+(52-12.5))/2 = 43.75 ; spanBRaw[52] = (52+1)/2 = 26.5
    expect(res[78].spanA).toBeCloseTo(43.75, 6);
    expect(res[78].spanB).toBeCloseTo(26.5, 6);
  });

  it("Chikou dịch lùi 26 phiên = close[i+26]", () => {
    expect(res[50].chikou).toBe(76);
  });

  it("tách riêng độ lùi Chikou (lag) và độ dịch mây (lead)", () => {
    // params: [Tenkan, Kijun, SpanB, lag=10, lead=5] → Chikou và mây dịch khác nhau.
    const r = calcIchimoku(linear(80), [9, 26, 52, 10, 5]);
    expect(r[50].chikou).toBe(60); // close[50 + lag] = close[60]
    expect(r[60].spanA).toBeCloseTo(46.75, 6); // spanARaw[60 - lead] = spanARaw[55]
    expect(r[60].spanB).toBeCloseTo(29.5, 6); // spanBRaw[55] = 55 - 25.5
  });

  it("thiếu tham số lead (cấu hình cũ 4 ô) thì dùng chung lag để dịch mây", () => {
    const four = calcIchimoku(linear(80), [9, 26, 52, 26]);
    const five = calcIchimoku(linear(80), [9, 26, 52, 26, 26]);
    expect(four[78].spanA).toBeCloseTo(five[78].spanA, 6);
    expect(four[50].chikou).toBe(five[50].chikou);
  });

  it("vắng key khi chưa đủ period / ngoài biên (không crash)", () => {
    expect(res[5].tenkan).toBeUndefined(); // i<8
    expect(res[5].kijun).toBeUndefined(); // i<25
    expect(res[60].spanB).toBeUndefined(); // spanBRaw[34] chưa đủ 52
    expect(res[60].chikou).toBeUndefined(); // close[86] vượt mảng
    expect(res).toHaveLength(80);
  });
});
