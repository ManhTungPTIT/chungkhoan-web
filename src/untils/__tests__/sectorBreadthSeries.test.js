import { describe, it, expect } from "vitest";
import {
  buildSectorBreadth,
  fmtTy,
  fmtPct,
  STATE_META,
  MIN_LABEL_PCT,
  valueLabelDistances,
  LABEL_GAP_PX,
} from "../sectorBreadthSeries";

const payload = {
  industries: [
    {
      name: "Ngân hàng",
      icb_code: "8355",
      count: 25,
      counts: { limit_up: 0, up: 20, flat: 0, down: 5, limit_down: 0 },
      pcts: { limit_up: 0, up: 80, flat: 0, down: 20, limit_down: 0 },
      value: 5_532e9,
      volume: 200_000_000,
      avg_price: 27_660,
      change_pct: 1.1,
    },
    {
      name: "Bất động sản",
      icb_code: "8630",
      count: 5,
      counts: { limit_up: 0, up: 1, flat: 0, down: 4, limit_down: 0 },
      pcts: { limit_up: 0, up: 20, flat: 0, down: 80, limit_down: 0 },
      value: 3_294e9,
      volume: 300_000_000,
      avg_price: 10_980,
      change_pct: -3.04,
    },
  ],
};

describe("buildSectorBreadth", () => {
  it("nhãn ngành kèm SỐ MÃ để thấy mẫu số", () => {
    const rows = buildSectorBreadth(payload);
    expect(rows[0].label).toBe("Ngân hàng (25)");
    expect(rows[1].label).toBe("Bất động sản (5)");
  });

  it("tên dài được cắt kèm dấu … để không đè lên cột số bên cạnh", () => {
    const rows = buildSectorBreadth({
      industries: [
        {
          name: "Thiết bị, Dịch vụ và Phân phối Dầu khí",
          icb_code: "0570",
          count: 9,
          pcts: {},
        },
      ],
    });
    expect(rows[0].shortLabel.length).toBeLessThan(rows[0].label.length);
    expect(rows[0].shortLabel).toContain("…");
    expect(rows[0].shortLabel).toContain("(9)");
  });

  it("tên ngắn giữ nguyên, không thêm dấu …", () => {
    const rows = buildSectorBreadth(payload);
    expect(rows[0].shortLabel).toBe("Ngân hàng (25)");
  });

  it("giữ nguyên thứ tự BE trả về", () => {
    expect(buildSectorBreadth(payload).map((r) => r.icb_code)).toEqual(["8355", "8630"]);
  });

  it("đủ 5 khoá trạng thái kể cả khi BE thiếu", () => {
    const rows = buildSectorBreadth({
      industries: [{ name: "X", icb_code: "1", count: 2, pcts: { up: 100 } }],
    });
    expect(Object.keys(rows[0].pcts).sort()).toEqual(
      STATE_META.map((s) => s.key).sort(),
    );
    expect(rows[0].pcts.limit_down).toBe(0);
  });

  it("quy giá trị về tỷ và giá bình quân về nghìn", () => {
    const rows = buildSectorBreadth(payload);
    expect(rows[0].valueTy).toBe(5532);
    expect(rows[0].avgPriceNghin).toBe(27.7);
  });

  it("bỏ ngành không có mã nào", () => {
    const rows = buildSectorBreadth({
      industries: [{ name: "Rỗng", icb_code: "9", count: 0 }, ...payload.industries],
    });
    expect(rows).toHaveLength(2);
  });

  it("payload rỗng/rác → mảng rỗng", () => {
    expect(buildSectorBreadth(null)).toEqual([]);
    expect(buildSectorBreadth({})).toEqual([]);
    expect(buildSectorBreadth({ industries: [null, 3] })).toEqual([]);
  });
});

describe("thứ tự ngành", () => {
  it("giữ NGUYÊN thứ tự BE trả, không sắp lại theo % thay đổi", () => {
    // Payload đã ở thứ tự tiền giảm dần (5.532 tỷ → 3.294 tỷ) dù % thay đổi thì
    // ngược lại — hai chart phải xếp hàng y hệt nhau nên FE không được đụng vào.
    const rows = buildSectorBreadth(payload);
    expect(rows.map((r) => r.icb_code)).toEqual(["8355", "8630"]);
    expect(rows.map((r) => r.valueTy)).toEqual([5532, 3294]);
  });
});

describe("màu trạng thái", () => {
  it("đúng thứ tự stack tích cực → tiêu cực", () => {
    expect(STATE_META.map((s) => s.key)).toEqual([
      "limit_up",
      "up",
      "flat",
      "down",
      "limit_down",
    ]);
  });

  it("khớp bảng màu của marketStatus", () => {
    const byKey = Object.fromEntries(STATE_META.map((s) => [s.key, s.color]));
    expect(byKey.limit_up).toBe("#8e24aa");
    expect(byKey.up).toBe("#1d9a45");
    expect(byKey.flat).toBe("#F6BD51");
    expect(byKey.down).toBe("#e53935");
    expect(byKey.limit_down).toBe("#1565c0");
  });
});

describe("định dạng", () => {
  it("fmtPct có dấu cộng cho số dương", () => {
    expect(fmtPct(1.1)).toBe("+1.1%");
    expect(fmtPct(-3.04)).toBe("-3.04%");
    expect(fmtPct(0)).toBe("0%");
  });

  it("fmtTy phân cách nghìn", () => {
    expect(fmtTy(5532)).toBe((5532).toLocaleString("vi-VN"));
  });

  it("ngưỡng ẩn nhãn là 6%", () => {
    expect(MIN_LABEL_PCT).toBe(6);
  });
});

describe("valueLabelDistances", () => {
  const row = (valueTy, avgPriceNghin) => ({ valueTy, avgPriceNghin });

  it("cột tím dài → nhãn tím giữ khoảng cách mặc định", () => {
    // 3.000 tỷ trên thang 6.000 = giữa khung, cách xa nhãn vàng ở sát mép trái.
    const d = valueLabelDistances([row(3000, 24.3)], 300, 6000);
    expect(d[0]).toBe(5);
  });

  it("cột tím ngắn → nhãn tím bị đẩy sang phải", () => {
    const d = valueLabelDistances([row(9, 24.3)], 300, 6000);
    expect(d[0]).toBeGreaterThan(5);
  });

  it("đẩy vừa đủ để hết chồng, không đẩy thừa", () => {
    const [distance] = valueLabelDistances([row(9, 24.3)], 300, 6000);
    const pxPerUnit = 300 / 6000;
    const avgEnd = 24.3 * pxPerUnit + 4 + String(24.3).length * 5.2;
    const valueStart = 9 * pxPerUnit + distance;
    expect(valueStart).toBeCloseTo(avgEnd + LABEL_GAP_PX, 5);
  });

  it("giá trung bình càng dài chữ thì đẩy càng xa", () => {
    const short = valueLabelDistances([row(9, 11.7)], 300, 6000)[0];
    const long = valueLabelDistances([row(9, 152.4)], 300, 6000)[0];
    expect(long).toBeGreaterThan(short);
  });

  it("chưa đo được khung vẽ → khoảng cách mặc định, không NaN", () => {
    expect(valueLabelDistances([row(9, 24.3)], 0, 6000)).toEqual([5]);
    expect(valueLabelDistances([row(9, 24.3)], 300, 0)).toEqual([5]);
  });

  it("không có hàng nào → mảng rỗng", () => {
    expect(valueLabelDistances([], 300, 6000)).toEqual([]);
  });
});
