import { describe, it, expect } from "vitest";
import {
  buildBarSeries,
  signColor,
  DIEM_POS_COLOR,
  PCT_POS_COLOR,
  NEG_COLOR,
  VALUE_COLOR,
} from "../indexOverviewOption";

describe("signColor", () => {
  it("≥0 → màu dương, <0 → đỏ, null → trong suốt", () => {
    expect(signColor(5, DIEM_POS_COLOR)).toBe(DIEM_POS_COLOR);
    expect(signColor(0, DIEM_POS_COLOR)).toBe(DIEM_POS_COLOR);
    expect(signColor(-1, DIEM_POS_COLOR)).toBe(NEG_COLOR);
    expect(signColor(null, DIEM_POS_COLOR)).toBe("transparent");
  });
});

describe("buildBarSeries", () => {
  it("map value (tím), điểm/% màu theo dấu, giữ thứ tự nhóm", () => {
    const indices = [
      { ten_san: "VN INDEX", gia_tri_khop_lenh: 19.4, diem_tang_giam: 5.04, pct: 0.3 },
      { ten_san: "HN INDEX", gia_tri_khop_lenh: 0.7, diem_tang_giam: -4.83, pct: -1.5 },
    ];
    const s = buildBarSeries(indices);

    expect(s.categories).toEqual(["VN INDEX", "HN INDEX"]);
    expect(s.valueData[0]).toEqual({ value: 19.4, itemStyle: { color: VALUE_COLOR } });
    expect(s.diemData[0].itemStyle.color).toBe(DIEM_POS_COLOR);
    expect(s.diemData[1].itemStyle.color).toBe(NEG_COLOR); // -4.83 → đỏ
    expect(s.pctData[1].itemStyle.color).toBe(NEG_COLOR);  // -1.5 → đỏ
  });

  it("giá trị null → bar rỗng (không màu)", () => {
    const s = buildBarSeries([{ ten_san: "VN30", gia_tri_khop_lenh: 1.5, diem_tang_giam: null, pct: null }]);
    expect(s.diemData[0]).toEqual({ value: null });
    expect(s.pctData[0]).toEqual({ value: null });
    expect(s.valueData[0].value).toBe(1.5);
  });

  it("mảng rỗng → series rỗng", () => {
    expect(buildBarSeries([])).toEqual({ categories: [], valueData: [], diemData: [], pctData: [] });
  });
});
