import { describe, it, expect } from "vitest";
import { buildPriceBands, BAND_RAMP, TOTAL_COLOR } from "../priceBandData";

const payload = {
  total_value: 13_678e9,
  groups: [
    { key: "le_10k", label: "Giá<=10K", value: 102e9, pct: 0.75 },
    { key: "le_20k", label: "Giá<=20K", value: 3_444e9, pct: 25.18 },
    { key: "le_40k", label: "Giá<=40K", value: 5_484e9, pct: 40.1 },
    { key: "le_60k", label: "Giá<=60K", value: 1_165e9, pct: 8.52 },
    { key: "le_80k", label: "Giá<=80K", value: 1_714e9, pct: 12.53 },
    { key: "le_100k", label: "Giá<=100K", value: 275e9, pct: 2.01 },
    { key: "gt_100k", label: "Giá>100K", value: 1_494e9, pct: 10.92 },
  ],
};

describe("buildPriceBands", () => {
  it("cột đầu là Tổng với 100%", () => {
    const bars = buildPriceBands(payload);
    expect(bars[0]).toMatchObject({ key: "total", label: "Tổng", ty: 13678, pct: 100 });
  });

  it("giữ nguyên thứ tự khoảng giá, không sort theo giá trị", () => {
    const bars = buildPriceBands(payload);
    expect(bars.map((b) => b.key)).toEqual([
      "total",
      "le_10k",
      "le_20k",
      "le_40k",
      "le_60k",
      "le_80k",
      "le_100k",
      "gt_100k",
    ]);
  });

  it("quy VND về tỷ, làm tròn nguyên", () => {
    expect(buildPriceBands(payload).map((b) => b.ty)).toEqual([
      13678, 102, 3444, 5484, 1165, 1714, 275, 1494,
    ]);
  });

  it("màu là thang một hue đậm dần theo khoảng giá", () => {
    const bars = buildPriceBands(payload);
    expect(bars.slice(1).map((b) => b.color)).toEqual(BAND_RAMP);
    expect(bars[0].color).toBe(TOTAL_COLOR);
  });

  it("bậc nhạt dùng chữ đen, bậc đậm dùng chữ trắng", () => {
    const bars = buildPriceBands(payload);
    expect(bars[1].ink).toBe("#0b0b0b");
    expect(bars[7].ink).toBe("#ffffff");
  });

  it("nhóm rỗng vẫn giữ cột", () => {
    const bars = buildPriceBands({
      total_value: 100e9,
      groups: [
        { key: "le_10k", label: "Giá<=10K", value: 100e9, pct: 100 },
        { key: "gt_100k", label: "Giá>100K", value: 0, pct: 0 },
      ],
    });
    expect(bars).toHaveLength(3);
    expect(bars[2].ty).toBe(0);
  });

  it("payload rỗng/rác → không có cột nào", () => {
    expect(buildPriceBands(null)).toEqual([]);
    expect(buildPriceBands({})).toEqual([]);
    expect(buildPriceBands({ total_value: 1, groups: [] })).toEqual([]);
  });

  it("tổng = 0 (ngoài phiên) → Tổng hiện 0% thay vì 100%", () => {
    const bars = buildPriceBands({
      total_value: 0,
      groups: [{ key: "le_10k", label: "Giá<=10K", value: 0, pct: 0 }],
    });
    expect(bars[0].pct).toBe(0);
  });

  it("BE trả nhiều nhóm hơn số bậc màu → không rơi ra undefined", () => {
    const groups = Array.from({ length: 9 }, (_, i) => ({
      key: `k${i}`,
      label: `L${i}`,
      value: 1e9,
      pct: 11.1,
    }));
    const bars = buildPriceBands({ total_value: 9e9, groups });
    expect(bars.every((b) => typeof b.color === "string")).toBe(true);
  });
});
