import { describe, it, expect } from "vitest";
import {
  assignBubbles,
  fmtBreakout,
  fmtRatio,
  fmtValueTy,
  formatBadge,
  tileValues,
} from "../baseBreakoutData";
import { DESKTOP_LAYOUT, MOBILE_LAYOUT } from "../baseBreakoutSlots";

const row = (symbol, vuot_nen, diem) => ({
  symbol,
  vuot_nen,
  diem,
  tl_thanh_khoan: 2,
  gia_hien_tai: 20,
  bien_do_nen: 5,
  tang_tu_day: 7,
  gia_tri_khop_lenh: 4,
});

/** Mã theo thứ tự bong bóng CAO → THẤP. */
const byHeight = (bubbles) =>
  [...bubbles].sort((a, b) => a.rank - b.rank).map((b) => b.symbol);

const LAYOUTS = [
  ["desktop", DESKTOP_LAYOUT, 15],
  ["mobile", MOBILE_LAYOUT, 9],
];

describe.each(LAYOUTS)("layout %s", (name, layout, count) => {
  it(`có đúng ${count} bong bóng và rank là một hoán vị 0..${count - 1}`, () => {
    expect(layout.bubbles).toHaveLength(count);
    expect(layout.bubbles.map((s) => s.rank).sort((a, b) => a - b)).toEqual(
      Array.from({ length: count }, (_, i) => i),
    );
  });

  it("rank 0 là bong bóng cao nhất trên ảnh (y nhỏ nhất)", () => {
    const top = layout.bubbles.find((s) => s.rank === 0);
    expect(Math.min(...layout.bubbles.map((s) => s.y))).toBe(top.y);
  });

  it("mọi toạ độ bong bóng và thẻ nằm trong khung ảnh", () => {
    for (const s of [...layout.bubbles, ...layout.tiles]) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(100);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(100);
    }
  });

  it("có đủ 5 thẻ thống kê", () => {
    expect(layout.tiles.map((t) => t.key)).toEqual([
      "count",
      "totalValue",
      "avgBreakout",
      "avgLiquidity",
      "strongFlow",
    ]);
  });

  it("khai đủ cỡ chữ cho mọi phần chữ phủ lên", () => {
    expect(layout.fonts.minBubble).toBeTruthy();
    expect(layout.fonts.tileValue).toBeTruthy();
    expect(layout.fonts.tileUnit).toBeTruthy();
  });
});

describe("khác biệt giữa hai layout", () => {
  it("bản dọc hiện ÍT mã hơn bản ngang — số chỗ do ảnh nền quyết", () => {
    expect(MOBILE_LAYOUT.bubbles.length).toBeLessThan(DESKTOP_LAYOUT.bubbles.length);
  });

  it("bản ngang có ô badge, bản dọc thì không (ảnh nền dọc không vẽ ô đó)", () => {
    expect(DESKTOP_LAYOUT.badge).not.toBeNull();
    expect(MOBILE_LAYOUT.badge).toBeNull();
  });

  it("hai ảnh nền khác tỉ lệ: ngang nằm, dọc đứng", () => {
    expect(DESKTOP_LAYOUT.width / DESKTOP_LAYOUT.height).toBeGreaterThan(1);
    expect(MOBILE_LAYOUT.width / MOBILE_LAYOUT.height).toBeLessThan(1);
  });
});

describe("assignBubbles", () => {
  it("thả mã vượt nền cao nhất vào bong bóng cao nhất", () => {
    // Cố ý cho thứ tự `diem` NGƯỢC với `vuot_nen`: chỗ ngồi phải theo vuot_nen.
    const rows = [row("A", 1.0, 90), row("B", 4.5, 80), row("C", 2.5, 70)];

    const bubbles = assignBubbles(rows, DESKTOP_LAYOUT.bubbles);

    expect(byHeight(bubbles).slice(0, 3)).toEqual(["B", "C", "A"]);
  });

  it("cắt theo SỐ CHỖ của layout — bản dọc bỏ bớt mã", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      row(`S${i}`, 5 - i * 0.1, 100 - i),
    );

    const desktop = assignBubbles(rows, DESKTOP_LAYOUT.bubbles).filter((b) => b.row);
    const mobile = assignBubbles(rows, MOBILE_LAYOUT.bubbles).filter((b) => b.row);

    expect(desktop).toHaveLength(15);
    expect(mobile).toHaveLength(9);
    // Mã được CHỌN theo diem (rows đã sắp sẵn) → đúng S0..S8 trên bản dọc.
    expect(new Set(mobile.map((b) => b.symbol))).toEqual(
      new Set(Array.from({ length: 9 }, (_, i) => `S${i}`)),
    );
  });

  it("thiếu mã thì bong bóng thừa để trống, không bịa dữ liệu", () => {
    const bubbles = assignBubbles([row("A", 2, 50), row("B", 3, 40)], MOBILE_LAYOUT.bubbles);

    expect(bubbles).toHaveLength(9);
    expect(bubbles.filter((b) => b.row)).toHaveLength(2);
    expect(bubbles.filter((b) => b.row === null)).toHaveLength(7);
  });

  it("không có mã nào qua lọc → mọi chỗ trống, không ném lỗi", () => {
    for (const empty of [[], null, undefined]) {
      const bubbles = assignBubbles(empty, DESKTOP_LAYOUT.bubbles);
      expect(bubbles).toHaveLength(15);
      expect(bubbles.every((b) => b.row === null)).toBe(true);
    }
  });

  it("thiếu luôn layout → mảng rỗng thay vì nổ", () => {
    expect(assignBubbles([row("A", 2, 50)], undefined)).toEqual([]);
  });

  it("giữ nguyên toạ độ của chỗ ngồi", () => {
    const bubbles = assignBubbles([row("A", 2, 50)], DESKTOP_LAYOUT.bubbles);

    for (const b of bubbles) {
      const slot = DESKTOP_LAYOUT.bubbles[b.index];
      expect([b.x, b.y, b.w]).toEqual([slot.x, slot.y, slot.w]);
    }
  });
});

describe("định dạng số", () => {
  it("fmtBreakout luôn có dấu và 2 chữ số thập phân", () => {
    expect(fmtBreakout(2)).toBe("+2.00%");
    expect(fmtBreakout(0.5)).toBe("+0.50%");
    expect(fmtBreakout(-1.234)).toBe("-1.23%");
  });

  it("fmtRatio in dạng (n.nnx)", () => {
    expect(fmtRatio(2.653)).toBe("(2.65x)");
  });

  it("fmtValueTy dùng dấu phẩy nghìn như ảnh mẫu", () => {
    expect(fmtValueTy(6245.4)).toBe("6,245");
  });

  it("thiếu dữ liệu KHÔNG được in ra số 0 giả", () => {
    // Number(null) và Number("") đều ra 0 — chốt lại để không tái diễn.
    for (const missing of [null, undefined, "", "abc", NaN]) {
      expect(fmtBreakout(missing)).toBe("—");
      expect(fmtRatio(missing)).toBe("");
      expect(fmtValueTy(missing)).toBe("—");
    }
  });
});

describe("tileValues", () => {
  it("đổ đúng 5 ô từ summary", () => {
    expect(
      tileValues({
        count: 48,
        total_gtgd_ty: 6245.2,
        avg_vuot_nen: 6.35,
        avg_tl_thanh_khoan: 2.08,
        strong_flow_count: 12,
      }),
    ).toEqual({
      count: "48",
      totalValue: "6,245",
      avgBreakout: "6.35%",
      avgLiquidity: "2.08",
      strongFlow: "12",
    });
  });

  it("summary thiếu/null → về 0 chứ không NaN", () => {
    expect(tileValues(null)).toEqual({
      count: "0",
      totalValue: "0",
      avgBreakout: "0.00%",
      avgLiquidity: "0.00",
      strongFlow: "0",
    });
  });
});

describe("formatBadge", () => {
  it("ngày lấy từ backend, giờ lấy từ đồng hồ lúc render", () => {
    const now = new Date(2026, 6, 31, 17, 31, 45);

    expect(formatBadge("2026-07-30", now)).toEqual({
      day: "30/07/2026",
      time: "17:31:45",
    });
  });

  it("ngày/tháng luôn 2 chữ số để hai dòng badge đều bề rộng", () => {
    const now = new Date(2026, 7, 4, 9, 5, 3);

    expect(formatBadge("2026-08-04", now)).toEqual({
      day: "04/08/2026",
      time: "09:05:03",
    });
  });

  it("generated_at thiếu/hỏng → rơi về ngày của máy", () => {
    const now = new Date(2026, 6, 31, 9, 0, 0);

    expect(formatBadge(null, now).day).toBe("31/07/2026");
    expect(formatBadge("khong-phai-ngay", now).day).toBe("31/07/2026");
  });
});
