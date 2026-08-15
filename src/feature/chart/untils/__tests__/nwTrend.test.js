import { describe, it, expect } from "vitest";
import { wmaOf } from "../indicators";

describe("wmaOf — trung bình động trọng số tuyến tính", () => {
  it("trọng số tăng dần, phiên gần nhất nặng nhất", () => {
    // [1,2,3] chu kỳ 3 → (1×1 + 2×2 + 3×3) / (1+2+3) = 14/6
    expect(wmaOf([1, 2, 3], 3)).toEqual([14 / 6]);
  });

  it("chuỗi 1..10 chu kỳ 10 → 7 (tổng bình phương 385 chia 55)", () => {
    const values = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(wmaOf(values, 10)).toEqual([7]);
  });

  it("out[j] ánh xạ tới values[period-1+j] — cùng quy ước emaOf/smaOf", () => {
    // 4 phần tử, chu kỳ 3 → 2 kết quả, ứng với values[2] và values[3]
    const out = wmaOf([1, 2, 3, 4], 3);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(14 / 6, 10); // cửa sổ [1,2,3]
    expect(out[1]).toBeCloseTo(20 / 6, 10); // cửa sổ [2,3,4] = (2+6+12)/6
  });

  it("thiếu dữ liệu trả mảng rỗng", () => {
    expect(wmaOf([1, 2], 3)).toEqual([]);
    expect(wmaOf([], 10)).toEqual([]);
  });
});
