import { describe, it, expect } from "vitest";
import { wmaOf, calcNwTrend } from "../indicators";

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

// Nến biên độ THAY ĐỔI theo từng cây: ranges[i] là high-low riêng của nến i.
// barsFromCloses ở trên luôn cho high-low = 2 → wmaOf(range,10) trả CÙNG một
// giá trị ở MỌI chỉ số, nên nếu calcNwTrend lỡ đọc lệch chỉ số vào wmaOf (vd.
// `wma[i - seed - 1]` thay vì `wma[i - seed]` đúng), rev vẫn ra đúng số một
// cách tình cờ và test không phát hiện được gì. Fixture này cho high-low khác
// nhau ở từng nến để mỗi chỉ số của wmaOf trả một giá trị riêng biệt — đọc
// lệch chỉ số sẽ đổi hẳn con số nw. open=close=100 và high/low đối xứng quanh
// 100 để HAC luôn đúng bằng 100 (khử biến "giá đổi"), nhờ vậy chỉ còn wmaOf
// làm nw thay đổi giữa các nến. ĐỪNG "đơn giản hoá" hàm này về biên độ cố định
// — làm vậy là xoá luôn bẫy bắt lỗi lệch chỉ số wmaOf phát hiện trong review.
function barsFromRanges(ranges) {
  return ranges.map((r) => ({
    open: 100,
    high: 100 + r / 2,
    low: 100 - r / 2,
    close: 100,
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

  it("giữ xu hướng giảm (không lật) — NW phải là MIN, chốt số cụ thể", () => {
    // Nối tiếp nến mồi (down, NW=106, xem test "mồi ở trạng thái giảm" trên)
    // bằng một nến giảm giá thật close=90. HAC[10] = (90+91+89+90)/4 = 90,
    // không vượt NW nên KHÔNG lật trạng thái. Nhánh giữ giảm tính:
    //   NW_mới = min(NW_cũ, HAC + rev) = min(106, 90 + 6) = min(106, 96) = 96
    // Nếu code lỡ đổi Math.min → Math.max ở nhánh này (bug đã tìm thấy khi
    // review — 12 test cũ đều xanh vì chỉ assert `trend`, không assert `nw`),
    // kết quả sẽ là max(106, 96) = 106 — khác 96, test này bắt được ngay.
    const bars = barsFromCloses([...Array(10).fill(100), 90]);
    const out = calcNwTrend(bars);

    expect(out[10].trend).toBe("down");
    expect(out[10].nw).toBeCloseTo(96, 10);
  });

  it("biên độ nến thay đổi theo thời gian — chốt NW bằng số, bắt lỗi lệch chỉ số wmaOf", () => {
    // Xem comment ở barsFromRanges: fixture này CỐ Ý cho high-low khác nhau
    // từng nến để mỗi chỉ số của wmaOf ra một giá trị riêng.
    //
    // 10 nến mồi có range lần lượt 1..10 → wmaOf(range,10)[0]
    //   = (1×1 + 2×2 + ... + 10×10) / 55 = 385/55 = 7
    //   (đúng giá trị đã chốt ở test wmaOf "chuỗi 1..10 chu kỳ 10 → 7").
    // rev[9] = 3×7 = 21 → NW mồi (down) = HAC[9] + 21 = 100 + 21 = 121.
    // (HAC luôn = 100 vì open=close=100 và high/low đối xứng quanh 100.)
    //
    // Nến thứ 11 có range=1 → cửa sổ wmaOf dịch sang [2,3,4,5,6,7,8,9,10,1]
    // (bars[1..10]):
    //   wmaOf[1] = (2×1+3×2+4×3+5×4+6×5+7×6+8×7+9×8+10×9+1×10) / 55
    //            = (2+6+12+20+30+42+56+72+90+10) / 55 = 340/55
    // HAC[10] = 100, không vượt NW cũ 121 nên KHÔNG lật, nhánh giữ giảm:
    //   NW = min(121, 100 + 3×(340/55)) = 100 + 3×(340/55) ≈ 118.545
    //   (vì 100 + 3×340/55 ≈ 118.545 nhỏ hơn 121).
    //
    // Nếu calcNwTrend đọc `wma[i - seed - 1]` thay vì `wma[i - seed]` đúng,
    // nến 11 sẽ lấy nhầm wmaOf[0] = 7 (rev = 21) thay vì wmaOf[1], ra
    // NW = min(121, 100 + 21) = 121 — khác hẳn ~118.545 mà test này chốt.
    const ranges = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const bars = barsFromRanges(ranges);
    const out = calcNwTrend(bars);

    expect(out[9].trend).toBe("down");
    expect(out[9].nw).toBeCloseTo(121, 10);

    expect(out[10].trend).toBe("down");
    expect(out[10].nw).toBeCloseTo(100 + 3 * (340 / 55), 8);
  });
});
