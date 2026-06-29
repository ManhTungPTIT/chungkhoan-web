import { describe, it, expect } from "vitest";
import { calcADXValues } from "../adxIndicator";

// Chuỗi tăng tuyến tính 1 đơn vị/nến (high=low=close=i):
//   +DM=1, -DM=0, TR=1 mỗi nến → +DI=100, -DI=0, DX=100 → ADX=100.
const upTrend = (n) =>
  Array.from({ length: n }, (_, i) => ({ high: i, low: i, close: i }));

// Chuỗi giảm tuyến tính → đối xứng: -DI=100, +DI=0, ADX=100.
const downTrend = (n) =>
  Array.from({ length: n }, (_, i) => ({ high: -i, low: -i, close: -i }));

describe("calcADXValues", () => {
  it("xu hướng tăng thuần: +DI=100, -DI=0, ADX=100", () => {
    const res = calcADXValues(upTrend(60), 14);
    // +DI/-DI có từ i=period
    expect(res[14].pdi).toBeCloseTo(100, 6);
    expect(res[14].mdi).toBeCloseTo(0, 6);
    // ADX đầu tiên ở i=2*period-1=27, ổn định ở 100
    expect(res[27].adx).toBeCloseTo(100, 6);
    expect(res[50].adx).toBeCloseTo(100, 6);
  });

  it("xu hướng giảm thuần: -DI=100, +DI=0, ADX=100", () => {
    const res = calcADXValues(downTrend(60), 14);
    expect(res[14].mdi).toBeCloseTo(100, 6);
    expect(res[14].pdi).toBeCloseTo(0, 6);
    expect(res[27].adx).toBeCloseTo(100, 6);
  });

  it("vắng key khi chưa đủ nến (không crash), giữ độ dài mảng", () => {
    const res = calcADXValues(upTrend(60), 14);
    expect(res[13].pdi).toBeUndefined(); // i<period
    expect(res[26].adx).toBeUndefined(); // ADX chưa đủ period DX
    expect(res).toHaveLength(60);
  });

  it("dữ liệu rỗng/quá ngắn trả mảng rỗng tương ứng, không lỗi", () => {
    expect(calcADXValues([], 14)).toEqual([]);
    expect(calcADXValues(upTrend(1), 14)).toEqual([{}]);
  });
});
