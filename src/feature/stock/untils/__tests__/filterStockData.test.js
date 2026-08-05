import { describe, expect, it } from "vitest";
import {
  PHASE,
  PHASE_BADGE,
  convertDay,
  convertTime,
  countPhases,
  getPageNumbers,
  pnlPct,
  sessionPhase,
  todayIso,
} from "../filterStockData";

describe("sessionPhase — bốn pha loại trừ nhau", () => {
  const TODAY = "2026-08-03";

  it("buy chưa qua ngày báo → Tín hiệu BUY", () => {
    expect(sessionPhase({ signal: "buy", signal_date: TODAY }, TODAY)).toBe(PHASE.BUY);
  });

  it("buy đã qua ngày báo (signal_hold) → Đang nắm giữ", () => {
    expect(
      sessionPhase({ signal: "buy", signal_hold: true, signal_date: "2026-08-01" }, TODAY),
    ).toBe(PHASE.HOLD);
  });

  it("sell báo hôm nay → Tín hiệu SELL", () => {
    expect(sessionPhase({ signal: "sell", signal_date: TODAY }, TODAY)).toBe(PHASE.SELL);
  });

  it("sell báo hôm trước → Đứng ngoài", () => {
    expect(sessionPhase({ signal: "sell", signal_date: "2026-07-31" }, TODAY)).toBe(
      PHASE.OUT,
    );
  });

  // Đây là lý do vế SELL so NGÀY chứ không đọc signal_sessions: sáng hôm sau
  // trước giờ mở, sessions vẫn là 0 GIỐNG HỆT ngày báo — suy từ nó là xếp nhầm
  // pha suốt cả buổi sáng.
  it("sell hôm trước mà sessions vẫn 0 (sáng sớm chưa mở phiên) → vẫn Đứng ngoài", () => {
    expect(
      sessionPhase({ signal: "sell", signal_date: "2026-08-02", signal_sessions: 0 }, TODAY),
    ).toBe(PHASE.OUT);
  });

  it("signal_date dạng ISO đầy đủ vẫn so được", () => {
    expect(
      sessionPhase({ signal: "sell", signal_date: "2026-08-03T00:00:00+07:00" }, TODAY),
    ).toBe(PHASE.SELL);
  });

  it("chưa có tín hiệu → không thuộc pha nào", () => {
    expect(sessionPhase({ signal: null }, TODAY)).toBeNull();
  });
});

describe("PHASE_BADGE — badge mang PHA, tiếng Việt", () => {
  it("bốn pha ra bốn nhãn tiếng Việt, không còn BUY/SELL", () => {
    expect(PHASE_BADGE).toEqual({
      [PHASE.BUY]: "MUA",
      [PHASE.HOLD]: "Nắm giữ",
      [PHASE.SELL]: "BÁN",
      [PHASE.OUT]: "Đứng ngoài",
    });
  });

  // Đây là thứ người dùng báo: mã đã qua ngày báo mà badge vẫn ghi BUY thì
  // tưởng đang có tín hiệu mua mới.
  it("mã buy đã qua ngày báo hiện 'Nắm giữ' chứ không phải 'MUA'", () => {
    const phase = sessionPhase(
      { signal: "buy", signal_hold: true, signal_sessions: 17 },
      "2026-08-05",
    );
    expect(PHASE_BADGE[phase]).toBe("Nắm giữ");
  });

  it("mã sell đã qua ngày báo hiện 'Đứng ngoài' chứ không phải 'BÁN'", () => {
    const phase = sessionPhase(
      { signal: "sell", signal_date: "2026-07-17", signal_sessions: 13 },
      "2026-08-05",
    );
    expect(PHASE_BADGE[phase]).toBe("Đứng ngoài");
  });
});

describe("countPhases", () => {
  const TODAY = "2026-08-03";

  it("đếm đủ bốn pha và bỏ qua mã chưa có tín hiệu", () => {
    const rows = [
      { signal: "buy", signal_date: TODAY },
      { signal: "buy", signal_hold: true },
      { signal: "buy", signal_hold: true },
      { signal: "sell", signal_date: TODAY },
      { signal: "sell", signal_date: "2026-07-30" },
      { signal: null },
    ];

    expect(countPhases(rows, TODAY)).toEqual({
      [PHASE.BUY]: 1,
      [PHASE.HOLD]: 2,
      [PHASE.SELL]: 1,
      [PHASE.OUT]: 1,
    });
  });

  it("bốn pha không chồng nhau: tổng = số mã CÓ tín hiệu", () => {
    const rows = [
      { signal: "buy", signal_date: TODAY },
      { signal: "buy", signal_hold: true },
      { signal: "sell", signal_date: "2026-07-30" },
      { signal: null },
    ];
    const counts = countPhases(rows, TODAY);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    expect(total).toBe(3);
  });

  it("danh sách rỗng / undefined không nổ", () => {
    expect(countPhases(undefined, TODAY)).toEqual({
      [PHASE.BUY]: 0,
      [PHASE.HOLD]: 0,
      [PHASE.SELL]: 0,
      [PHASE.OUT]: 0,
    });
  });
});

describe("pnlPct — lãi/lỗ so với giá báo", () => {
  // Số lấy từ chính ảnh mẫu: giá board là VND thô, giá báo là nghìn đồng.
  it.each([
    ["BIG", 4500, 4.3, 4.65],
    ["VEF", 77000, 74.6, 3.21],
    ["PDR", 20300, 20.78, -2.31],
    ["KBC", 29600, 29.89, -0.97],
  ])("%s → %f / %f ≈ %f%%", (_symbol, price, signal_price, expected) => {
    expect(pnlPct({ price, signal_price })).toBeCloseTo(expected, 1);
  });

  it("KHÔNG phải change_pct: mã đứng giá so hôm qua vẫn có lãi so giá báo", () => {
    expect(pnlPct({ price: 4500, signal_price: 4.3, change_pct: 0 })).toBeCloseTo(4.65, 1);
  });

  it("thiếu giá báo → null, không trả 0 giả", () => {
    expect(pnlPct({ price: 4500, signal_price: null })).toBeNull();
    expect(pnlPct({ price: 4500 })).toBeNull();
    expect(pnlPct({ price: 4500, signal_price: 0 })).toBeNull();
  });
});

describe("tiện ích hiển thị", () => {
  it("convertDay đổi sang dd/mm/yyyy", () => {
    expect(convertDay("2026-08-03")).toBe("03/08/2026");
  });

  it("convertDay giữ nguyên giá trị không parse được", () => {
    expect(convertDay("--")).toBe("--");
  });

  it("convertTime cho giờ hai chữ số", () => {
    expect(convertTime(new Date(2026, 7, 3, 9, 5))).toBe("09:05");
  });

  it("todayIso theo múi giờ máy, khớp định dạng signal_date", () => {
    expect(todayIso(new Date(2026, 7, 3, 21, 27))).toBe("2026-08-03");
  });

  it("getPageNumbers xoay quanh trang hiện tại", () => {
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(getPageNumbers(7, 20)).toEqual([5, 6, 7, 8, 9]);
    expect(getPageNumbers(20, 20)).toEqual([16, 17, 18, 19, 20]);
  });
});
