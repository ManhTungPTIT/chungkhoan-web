import { describe, it, expect } from "vitest";
import {
  buildBarSeries,
  buildChartOption,
  alignedAxisRange,
  signColor,
  DIEM_POS_COLOR,
  PCT_POS_COLOR,
  NEG_COLOR,
  LIQUIDITY_COLOR,
  LIQUIDITY_LABEL,
  DIEM_LABEL,
  PCT_LABEL,
} from "../indexOverviewOption";

const fmt = (v) => (v === null || v === undefined ? "—" : String(v));

describe("signColor", () => {
  it("≥0 → màu dương, <0 → đỏ, null → trong suốt", () => {
    expect(signColor(5, DIEM_POS_COLOR)).toBe(DIEM_POS_COLOR);
    expect(signColor(0, DIEM_POS_COLOR)).toBe(DIEM_POS_COLOR);
    expect(signColor(-1, DIEM_POS_COLOR)).toBe(NEG_COLOR);
    expect(signColor(null, DIEM_POS_COLOR)).toBe("transparent");
  });
});

describe("buildBarSeries", () => {
  it("cột thanh khoản là NGHÌN TỶ (gia_tri_khop_lenh), không phải %", () => {
    const s = buildBarSeries([
      { ten_san: "VN INDEX", gia_tri_khop_lenh: 15.18, thanh_khoan_pct: 105, diem_tang_giam: 5.04, pct: 0.3 },
    ]);
    expect(s.thanhKhoanData[0]).toEqual({ value: 15.18, itemStyle: { color: LIQUIDITY_COLOR } });
  });

  // Board vendor chỉ có khớp lệnh nên cột cũ hụt ~10-14% so với tổng giao dịch
  // thật của sàn; BE nay trả thêm `gia_tri_giao_dich` (đã cộng thỏa thuận).
  it("ưu tiên gia_tri_giao_dich (đã gồm thỏa thuận) thay vì chỉ khớp lệnh", () => {
    const s = buildBarSeries([
      {
        ten_san: "VN INDEX",
        gia_tri_khop_lenh: 7.11,
        gia_tri_thoa_thuan: 1.02,
        gia_tri_giao_dich: 8.13,
        thanh_khoan_pct: 48.53,
      },
    ]);

    expect(s.thanhKhoanData[0].value).toBe(8.13);
  });

  it("BE chưa có trường mới thì lùi về khớp lệnh, không mất cột", () => {
    const s = buildBarSeries([{ ten_san: "VN INDEX", gia_tri_khop_lenh: 7.11 }]);

    expect(s.thanhKhoanData[0].value).toBe(7.11);
  });

  it("map màu điểm/% theo dấu, giữ thứ tự nhóm", () => {
    const indices = [
      { ten_san: "VN INDEX", gia_tri_khop_lenh: 15.18, diem_tang_giam: 5.04, pct: 0.3 },
      { ten_san: "HN INDEX", gia_tri_khop_lenh: 0.79, diem_tang_giam: -4.83, pct: -1.5 },
    ];
    const s = buildBarSeries(indices);

    expect(s.categories).toEqual(["VN INDEX", "HN INDEX"]);
    // Thanh khoản luôn tím — không tô đỏ, tránh lẫn với cột giảm giá.
    expect(s.thanhKhoanData[1].itemStyle.color).toBe(LIQUIDITY_COLOR);
    expect(s.diemData[0].itemStyle.color).toBe(DIEM_POS_COLOR);
    expect(s.diemData[1].itemStyle.color).toBe(NEG_COLOR); // -4.83 → đỏ
    expect(s.pctData[1].itemStyle.color).toBe(NEG_COLOR);  // -1.5 → đỏ
  });

  it("cột âm đẩy nhãn xuống dưới để không đè vạch 0", () => {
    const s = buildBarSeries([{ ten_san: "VN INDEX", gia_tri_khop_lenh: 1, diem_tang_giam: -4.83, pct: -1.5 }]);
    expect(s.diemData[0].label).toEqual({ position: "bottom" });
    expect(s.thanhKhoanData[0].label).toBeUndefined();
  });

  it("giá trị null → bar rỗng (không màu)", () => {
    const s = buildBarSeries([
      { ten_san: "VN30", gia_tri_khop_lenh: 8.89, diem_tang_giam: null, pct: null },
    ]);
    expect(s.diemData[0]).toEqual({ value: null });
    expect(s.pctData[0]).toEqual({ value: null });
    expect(s.thanhKhoanData[0].value).toBe(8.89);
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

describe("alignedAxisRange", () => {
  it("toàn số dương → hai trục bắt đầu từ 0, max bo lên mốc tròn", () => {
    const { left, right } = alignedAxisRange([15.18, 24.06], [1.43]);
    expect(left).toEqual({ min: 0, max: 30 }); // 24,06 × 1,2 = 28,9 → 30
    expect(right.min).toBe(0);
    expect(right.max).toBeGreaterThanOrEqual(1.43);
  });

  it("có số âm → vạch 0 của hai trục nằm cùng một đường", () => {
    const { left, right } = alignedAxisRange([15.18, -24.06], [-1.43]);
    const zero = (a) => -a.min / (a.max - a.min);
    expect(zero(left)).toBeCloseTo(zero(right), 6);
    // Vẫn phủ hết dữ liệu của cả hai trục.
    expect(left.max).toBeGreaterThanOrEqual(15.18);
    expect(left.min).toBeLessThanOrEqual(-24.06);
    expect(right.min).toBeLessThanOrEqual(-1.43);
  });

  it("trục không có số liệu → {} để ECharts tự co", () => {
    expect(alignedAxisRange([], []).left).toEqual({});
    expect(alignedAxisRange([null, undefined], [null]).right).toEqual({});
  });
});

describe("buildChartOption", () => {
  const indices = [
    { ten_san: "VN INDEX", gia_tri_khop_lenh: 15.18, thanh_khoan_pct: 105.15, diem_tang_giam: 24.06, pct: 1.43 },
    { ten_san: "VN30", gia_tri_khop_lenh: 8.89, thanh_khoan_pct: 101.92, diem_tang_giam: 24.77, pct: 1.36 },
  ];

  it("MỘT khung vẽ, ba series, % nằm trên trục Y thứ hai", () => {
    const opt = buildChartOption(indices, fmt);
    expect(Array.isArray(opt.grid)).toBe(false);
    expect(Array.isArray(opt.xAxis)).toBe(false);
    expect(opt.yAxis).toHaveLength(2);
    expect(opt.yAxis[1].position).toBe("right");
    expect(opt.series.map((s) => s.name)).toEqual([LIQUIDITY_LABEL, DIEM_LABEL, PCT_LABEL]);
    expect(opt.series.map((s) => s.yAxisIndex)).toEqual([0, 0, 1]);
  });

  it("không còn mốc nền 100% nào trên chart", () => {
    const opt = buildChartOption(indices, fmt);
    expect(opt.series.some((s) => s.markLine)).toBe(false);
    expect(JSON.stringify(opt)).not.toContain("nền");
  });

  it("tooltip gộp cả nhóm và ghi rõ đơn vị từng dòng", () => {
    const opt = buildChartOption(indices, fmt);
    expect(opt.tooltip.trigger).toBe("axis");
    const html = opt.tooltip.formatter([
      { name: "VN INDEX", seriesName: LIQUIDITY_LABEL, value: 15.18, marker: "" },
      { name: "VN INDEX", seriesName: DIEM_LABEL, value: 24.06, marker: "" },
      { name: "VN INDEX", seriesName: PCT_LABEL, value: 1.43, marker: "" },
    ]);
    expect(html).toContain("15.18 nghìn tỷ");
    expect(html).toContain("24.06 điểm");
    expect(html).toContain("1.43%");
  });

  it("không có dữ liệu → vẫn ra option hợp lệ, không nổ", () => {
    const opt = buildChartOption(undefined, fmt);
    expect(opt.xAxis.data).toEqual([]);
    expect(opt.series[0].data).toEqual([]);
  });
});
