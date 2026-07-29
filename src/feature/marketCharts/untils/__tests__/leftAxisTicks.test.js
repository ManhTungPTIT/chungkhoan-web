// Trục cột tím (giá trị khớp lệnh, Tỷ) của 6 biểu đồ trong /chart/market.
//
// Sáu feature này cố ý tách rời — mỗi cái có hàm dựng view riêng đã phân hoá — nên
// `leftTicks` bị lặp ở cả 6. Test này import cả 6 và kiểm cùng một hợp đồng, vì rủi
// ro thật của việc lặp là sáu bản lệch nhau về sau chứ không phải sai ngay hôm nay.

import { describe, expect, it } from "vitest";

import { leftTicks as flowSurge } from "../../../flowSurge/untils/topGainLayout";
import { leftTicks as flowSurgeMonth } from "../../../flowSurgeMonth/untils/flowSurgeMonthLayout";
import { leftTicks as potentialFlow } from "../../../potentialFlow/untils/potentialData";
import { leftTicks as topGainT2 } from "../../../topGainT2/untils/topGainLayout";
import { leftTicks as topGainT3 } from "../../../topGainT3/untils/topGainLayout";
import { leftTicks as topGainWeek } from "../../../topGainWeek/untils/topGainLayout";

const IMPLEMENTATIONS = [
  ["flowSurge", flowSurge],
  ["flowSurgeMonth", flowSurgeMonth],
  ["potentialFlow", potentialFlow],
  ["topGainT2", topGainT2],
  ["topGainT3", topGainT3],
  ["topGainWeek", topGainWeek],
];

describe.each(IMPLEMENTATIONS)("leftTicks — %s", (_name, leftTicks) => {
  it("luôn trả 5 mốc, mốc đầu là 0", () => {
    for (const max of [0, 1, 7, 69.5, 506.23, 12345]) {
      const ticks = leftTicks(max);
      expect(ticks).toHaveLength(5);
      expect(ticks[0]).toBe(0);
    }
  });

  it("mốc tăng dần, mốc cuối bằng giá trị lớn nhất", () => {
    const ticks = leftTicks(506.23);
    expect(ticks).toEqual([0, 127, 253, 380, 506]);
  });

  it("khớp thang trong thiết kế (max 69,5)", () => {
    expect(leftTicks(69.5)).toEqual([0, 17, 35, 52, 70]);
  });

  it("thang nhỏ thì giữ số lẻ để mốc không trùng nhau", () => {
    // Làm tròn nguyên ở đây sẽ ra 0, 1, 1, 2, 2 — trục có mốc lặp, đọc vô nghĩa.
    expect(leftTicks(2)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(leftTicks(8)).toEqual([0, 2, 4, 6, 8]);
  });

  it("không có dữ liệu (max 0 hoặc âm) vẫn trả dãy tăng dần, không sập về toàn 0", () => {
    for (const max of [0, -5]) {
      const ticks = leftTicks(max);
      expect(ticks[0]).toBe(0);
      expect(ticks[4]).toBeGreaterThan(0);
      for (let i = 1; i < ticks.length; i += 1) {
        expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
      }
    }
  });

  it("không sinh mốc âm — cột tím là số tiền, không phải phần trăm", () => {
    for (const max of [0, 3, 250]) {
      expect(leftTicks(max).every((tick) => tick >= 0)).toBe(true);
    }
  });
});

it("sáu bản cho kết quả giống hệt nhau", () => {
  for (const max of [0, 2, 8, 69.5, 506.23, 9876.5]) {
    const results = IMPLEMENTATIONS.map(([, fn]) => fn(max));
    for (const result of results) {
      expect(result).toEqual(results[0]);
    }
  }
});
