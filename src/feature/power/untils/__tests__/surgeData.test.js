import { describe, it, expect } from "vitest";
import {
  BASELINE_CURVE,
  MIN_BASELINE_VND,
  baselineFactor,
  surgeMetrics,
  vnMinutes,
} from "../surgeData";

// Giờ VN = UTC+7 → dựng mốc bằng UTC để test không phụ thuộc timezone máy chạy.
const vn = (hour, minute = 0) =>
  new Date(Date.UTC(2026, 7, 4, hour - 7, minute));

describe("vnMinutes", () => {
  it("quy về giờ VN bất kể timezone máy chạy", () => {
    expect(vnMinutes(vn(10, 30))).toBe(10 * 60 + 30);
  });

  it("nửa đêm giờ VN → 0 phút (hourCycle h23, không phải 24:00)", () => {
    expect(vnMinutes(vn(0, 0))).toBe(0);
  });
});

describe("baselineFactor", () => {
  it("khớp từng mốc trong bảng", () => {
    for (const [hour, minute, expected] of BASELINE_CURVE) {
      expect(baselineFactor(vn(hour, minute))).toBe(expected);
    }
  });

  it("biên nửa mở: đúng 10:00 đã sang khung 25%", () => {
    expect(baselineFactor(vn(9, 59))).toBe(0.18); // vẫn khung 09:45
    expect(baselineFactor(vn(10, 0))).toBe(0.25);
  });

  it("trước 09:15 (gồm ATO) giữ 6% → mẫu số không bao giờ bằng 0", () => {
    expect(baselineFactor(vn(8, 30))).toBe(0.06);
    expect(baselineFactor(vn(9, 14))).toBe(0.06);
  });

  it("nghỉ trưa 11:30–13:00 đứng yên 72% — không có lệnh khớp thì % không nhảy", () => {
    expect(baselineFactor(vn(11, 30))).toBe(0.72);
    expect(baselineFactor(vn(12, 0))).toBe(0.72);
    expect(baselineFactor(vn(12, 59))).toBe(0.72);
    expect(baselineFactor(vn(13, 0))).toBe(0.72);
  });

  it("từ 14:30 trở đi giữ 100% — phiên coi như đã khớp trọn", () => {
    expect(baselineFactor(vn(14, 30))).toBe(1);
    expect(baselineFactor(vn(15, 0))).toBe(1);
    expect(baselineFactor(vn(23, 59))).toBe(1);
  });
});

describe("surgeMetrics", () => {
  it("% đột biến = value / (TB20 × tỉ lệ kỳ vọng) × 100", () => {
    // TB20 = 300 tỷ, lúc 10:30 tỉ lệ 42% → nền 126 tỷ; hiện tại 150 tỷ.
    const row = { value: 150e9, avg_value_20: 300e9 };
    const { surge } = surgeMetrics(row, baselineFactor(vn(10, 30)));
    expect(surge).toBe(119); // 150 / 126 = 1.190…
  });

  it("đúng nhịp bình thường → 100%", () => {
    const row = { value: 126e9, avg_value_20: 300e9 };
    expect(surgeMetrics(row, 0.42).surge).toBe(100);
  });

  it("score = tỉ số × log10(value tỷ + 1) — cùng đột biến thì tiền lớn xếp trước", () => {
    const nho = surgeMetrics({ value: 2e9, avg_value_20: 4e9 }, 0.5);
    const lon = surgeMetrics({ value: 200e9, avg_value_20: 400e9 }, 0.5);
    expect(nho.surge).toBe(100);
    expect(lon.surge).toBe(100); // cùng mức đột biến
    expect(lon.score).toBeGreaterThan(nho.score); // nhưng thanh khoản cao hơn
  });

  it("thiếu avg_value_20 → null (mã mới niêm yết / cache nến chưa warm)", () => {
    expect(surgeMetrics({ value: 10e9 }, 0.5)).toEqual({
      surge: null,
      score: null,
    });
    expect(surgeMetrics({ value: 10e9, avg_value_20: null }, 0.5).score).toBe(
      null,
    );
  });

  it("nền dưới sàn 1 tỷ → null (chặn tỉ lệ bắn ảo của mã thanh khoản mỏng)", () => {
    const duoiSan = { value: 10e9, avg_value_20: MIN_BASELINE_VND - 1 };
    expect(surgeMetrics(duoiSan, 0.5).surge).toBe(null);
    const dungSan = { value: 10e9, avg_value_20: MIN_BASELINE_VND };
    expect(surgeMetrics(dungSan, 0.5).surge).not.toBe(null);
  });

  it("value thiếu hoặc ≤ 0 → null", () => {
    expect(surgeMetrics({ avg_value_20: 10e9 }, 0.5).score).toBe(null);
    expect(surgeMetrics({ value: 0, avg_value_20: 10e9 }, 0.5).score).toBe(null);
  });

  it("row không hợp lệ → null, không ném lỗi", () => {
    expect(surgeMetrics(null, 0.5)).toEqual({ surge: null, score: null });
    expect(surgeMetrics(undefined, 0.5)).toEqual({ surge: null, score: null });
  });
});
