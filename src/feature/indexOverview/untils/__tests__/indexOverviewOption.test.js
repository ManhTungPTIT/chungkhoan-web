import { describe, it, expect } from "vitest";
import {
  buildBarSeries,
  liquidityLabel,
  signColor,
  DIEM_POS_COLOR,
  PCT_POS_COLOR,
  NEG_COLOR,
  LIQUIDITY_COLOR,
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
  it("map thanh khoản (tím), điểm/% màu theo dấu, giữ thứ tự nhóm", () => {
    const indices = [
      { ten_san: "VN INDEX", thanh_khoan_pct: 122, diem_tang_giam: 5.04, pct: 0.3 },
      { ten_san: "HN INDEX", thanh_khoan_pct: 88, diem_tang_giam: -4.83, pct: -1.5 },
    ];
    const s = buildBarSeries(indices);

    expect(s.categories).toEqual(["VN INDEX", "HN INDEX"]);
    expect(s.thanhKhoanData[0]).toEqual({ value: 122, itemStyle: { color: LIQUIDITY_COLOR } });
    // Thanh khoản dưới nền vẫn tím — không tô đỏ, tránh lẫn với cột giảm giá.
    expect(s.thanhKhoanData[1].itemStyle.color).toBe(LIQUIDITY_COLOR);
    expect(s.diemData[0].itemStyle.color).toBe(DIEM_POS_COLOR);
    expect(s.diemData[1].itemStyle.color).toBe(NEG_COLOR); // -4.83 → đỏ
    expect(s.pctData[1].itemStyle.color).toBe(NEG_COLOR);  // -1.5 → đỏ
  });

  it("thanh khoản null (chưa có nền lịch sử) → bar rỗng, hai cột kia vẫn vẽ", () => {
    const s = buildBarSeries([
      { ten_san: "VN30", thanh_khoan_pct: null, diem_tang_giam: 5.04, pct: 0.3 },
    ]);
    expect(s.thanhKhoanData[0]).toEqual({ value: null });
    expect(s.diemData[0].value).toBe(5.04);
  });

  it("giá trị null → bar rỗng (không màu)", () => {
    const s = buildBarSeries([
      { ten_san: "VN30", thanh_khoan_pct: 95, diem_tang_giam: null, pct: null },
    ]);
    expect(s.diemData[0]).toEqual({ value: null });
    expect(s.pctData[0]).toEqual({ value: null });
    expect(s.thanhKhoanData[0].value).toBe(95);
  });

  it("mảng rỗng → series rỗng", () => {
    expect(buildBarSeries([])).toEqual({
      categories: [],
      thanhKhoanData: [],
      diemData: [],
      pctData: [],
    });
  });
});

describe("liquidityLabel", () => {
  it("có số phiên → ghi rõ cửa sổ; chưa có nền → nhãn chung", () => {
    expect(liquidityLabel(13)).toBe("Thanh khoản (% TB 13 phiên)");
    expect(liquidityLabel(0)).toBe("Thanh khoản (% TB)");
  });
});
