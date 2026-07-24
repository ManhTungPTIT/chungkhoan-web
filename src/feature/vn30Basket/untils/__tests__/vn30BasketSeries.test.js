import { describe, it, expect } from "vitest";
import {
  buildVn30Basket,
  statusColor,
  valueAxisMax,
  priceAxisMax,
  pctAxisMax,
  fmtTy,
  fmtPrice,
  fmtPct,
  UP_COLOR,
  DOWN_COLOR,
  FLAT_COLOR,
} from "../vn30BasketSeries";

const PAYLOAD = {
  rows: [
    { symbol: "AAA", change_pct: 1.5, value_ty: 538, price_nghin: 24.5, status: "up" },
    { symbol: "BBB", change_pct: -2.32, value_ty: 515, price_nghin: 55, status: "down" },
  ],
};

describe("buildVn30Basket", () => {
  it("ánh xạ snake_case sang camelCase và ép kiểu số", () => {
    const rows = buildVn30Basket(PAYLOAD);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      symbol: "AAA",
      changePct: 1.5,
      valueTy: 538,
      priceNghin: 24.5,
      status: "up",
    });
  });

  it("payload rỗng / không phải mảng -> []", () => {
    expect(buildVn30Basket(null)).toEqual([]);
    expect(buildVn30Basket({})).toEqual([]);
    expect(buildVn30Basket({ rows: "x" })).toEqual([]);
  });
});

describe("statusColor", () => {
  it("up xanh, down đỏ, còn lại vàng", () => {
    expect(statusColor("up")).toBe(UP_COLOR);
    expect(statusColor("down")).toBe(DOWN_COLOR);
    expect(statusColor("flat")).toBe(FLAT_COLOR);
    expect(statusColor(undefined)).toBe(FLAT_COLOR);
  });
});

describe("trục X từng panel", () => {
  it("trục tiền làm tròn lên bội 100", () => {
    expect(valueAxisMax([{ valueTy: 538 }, { valueTy: 853 }])).toBe(900);
  });

  it("trục giá làm tròn lên bội 50", () => {
    expect(priceAxisMax([{ priceNghin: 24.5 }, { priceNghin: 220 }])).toBe(250);
  });

  it("trục % đối xứng quanh 0, làm tròn lên bội 5, lấy từ trị tuyệt đối lớn nhất", () => {
    expect(pctAxisMax([{ changePct: 1.53 }, { changePct: -2.32 }])).toBe(5);
    expect(pctAxisMax([{ changePct: 12 }, { changePct: -1 }])).toBe(15);
  });

  it("rows rỗng -> mức tối thiểu, không phải 0", () => {
    expect(valueAxisMax([])).toBe(100);
    expect(priceAxisMax([])).toBe(50);
    expect(pctAxisMax([])).toBe(5);
  });
});

describe("định dạng nhãn", () => {
  it("fmtPct có dấu + cho số dương", () => {
    expect(fmtPct(1.53)).toBe("+1.53%");
    expect(fmtPct(-2.32)).toBe("-2.32%");
    expect(fmtPct(0)).toBe("0%");
  });

  it("fmtTy và fmtPrice bỏ số 0 thừa", () => {
    expect(fmtTy(538)).toBe("538");
    expect(fmtPrice(24.5)).toBe("24.5");
    expect(fmtPrice(55)).toBe("55");
  });
});
