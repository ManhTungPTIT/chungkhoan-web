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

  it("vắng key khi chưa đủ period / ngoài biên (không crash)", () => {
    expect(res[5].tenkan).toBeUndefined(); // i<8
    expect(res[5].kijun).toBeUndefined(); // i<25
    expect(res[60].spanB).toBeUndefined(); // spanBRaw[34] chưa đủ 52
    expect(res[60].chikou).toBeUndefined(); // close[86] vượt mảng
    expect(res).toHaveLength(80);
  });
});
