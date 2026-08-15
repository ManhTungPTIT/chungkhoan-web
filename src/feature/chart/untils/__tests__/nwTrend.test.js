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

import { calcNwTrend } from "../indicators";

// Nến biên độ CỐ ĐỊNH 2 (high-low = 2) → WMA(range,10) = 2, rev = 6 ở mọi nến.
// Nhờ vậy ngưỡng đảo chiều là hằng số, kiểm tra được bằng số học tay.
function barsFromCloses(closes) {
  return closes.map((close) => ({
    open: close,
    high: close + 1,
    low: close - 1,
    close,
  }));
}

describe("calcNwTrend — ngưỡng động NW", () => {
  it("warm-up: null tới i=8, có giá trị từ i=9", () => {
    const bars = barsFromCloses(Array(12).fill(100));
    const out = calcNwTrend(bars);

    expect(out).toHaveLength(12);
    expect(out.slice(0, 9).every((x) => x === null)).toBe(true);
    expect(out[9]).not.toBeNull();
  });

  it("mồi ở trạng thái giảm, NW = HAC + 3×WMA", () => {
    const bars = barsFromCloses(Array(10).fill(100));
    const out = calcNwTrend(bars);

    // HAC = (100 + 101 + 99 + 100)/4 = 100; rev = 3×2 = 6
    expect(out[9].trend).toBe("down");
    expect(out[9].nw).toBeCloseTo(106, 10);
  });

  it("giá vượt NW thì lật sang tăng và NW nhảy xuống dưới giá", () => {
    // 10 nến phẳng ở 100 (NW = 106), rồi một nến vọt lên 120 → HAC 120 > 106
    const bars = barsFromCloses([...Array(10).fill(100), 120]);
    const out = calcNwTrend(bars);

    expect(out[10].trend).toBe("up");
    expect(out[10].nw).toBeCloseTo(114, 10); // 120 - 6
  });

  it("trong xu hướng tăng NW không bao giờ lùi", () => {
    // Vọt lên 120 (NW=114), rồi tụt về 118 — vẫn trên NW nên giữ xu hướng tăng.
    // HAC-rev = 112 < 114 → NW phải GIỮ 114, không hạ xuống 112.
    const bars = barsFromCloses([...Array(10).fill(100), 120, 118]);
    const out = calcNwTrend(bars);

    expect(out[11].trend).toBe("up");
    expect(out[11].nw).toBeCloseTo(114, 10);
  });

  it("giá thủng NW thì lật sang giảm và NW nhảy lên trên giá", () => {
    const bars = barsFromCloses([...Array(10).fill(100), 120, 110]);
    const out = calcNwTrend(bars);

    // 110 < NW 114 → lật giảm, NW = 110 + 6 = 116
    expect(out[11].trend).toBe("down");
    expect(out[11].nw).toBeCloseTo(116, 10);
  });

  it("HAC bằng đúng NW thì KHÔNG lật trạng thái", () => {
    // 10 nến phẳng ở 100 → NW = 106. Nến kế có HAC đúng 106.
    const bars = barsFromCloses([...Array(10).fill(100), 106]);
    const out = calcNwTrend(bars);

    expect(out[10].trend).toBe("down");
  });

  it("chưa đủ 10 nến thì toàn null", () => {
    const out = calcNwTrend(barsFromCloses(Array(9).fill(100)));
    expect(out).toHaveLength(9);
    expect(out.every((x) => x === null)).toBe(true);
  });

  it("chỉ đọc OHLC, không đọc time — chạy được trên dataList của klinecharts", () => {
    const bars = barsFromCloses(Array(10).fill(100)).map((b) => ({
      ...b,
      timestamp: 0, // klinecharts dùng `timestamp`, không có `time`
    }));
    expect(() => calcNwTrend(bars)).not.toThrow();
    expect(calcNwTrend(bars)[9].nw).toBeCloseTo(106, 10);
  });
});
