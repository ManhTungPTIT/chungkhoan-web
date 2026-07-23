import { describe, it, expect } from "vitest";
import {
  buildMoneyFlow,
  toEchartsData,
  fmtTyDong,
  LABEL_MIN_PCT,
} from "../moneyFlowData";

const sample = [
  { group: "Ngân hàng", icb_code: "8355", total_value: 3_000e9, symbol_count: 18 },
  { group: "Bất động sản", icb_code: "8633", total_value: 1_000e9, symbol_count: 12 },
  { group: "Thép", icb_code: "1757", total_value: 1_000e9, symbol_count: 4 },
];

describe("buildMoneyFlow", () => {
  it("tính tỷ trọng trên tổng giá trị khớp lệnh", () => {
    const { items, total } = buildMoneyFlow(sample);
    expect(total).toBe(5_000e9);
    expect(items.map((s) => s.pct)).toEqual([60, 20, 20]);
  });

  it("tổng tỷ trọng xấp xỉ 100", () => {
    const { items } = buildMoneyFlow(sample);
    const sum = items.reduce((s, i) => s + i.pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.5);
  });

  it("sort giảm dần theo giá trị", () => {
    const { items } = buildMoneyFlow([
      { group: "Nhỏ", icb_code: "1", total_value: 10 },
      { group: "To", icb_code: "2", total_value: 100 },
    ]);
    expect(items.map((s) => s.name)).toEqual(["To", "Nhỏ"]);
  });

  it("diện tích ô dùng giá trị thô, không dùng pct đã làm tròn", () => {
    const { items } = buildMoneyFlow([
      { group: "A", icb_code: "1", total_value: 1_000_000_003 },
      { group: "B", icb_code: "2", total_value: 1 },
    ]);
    expect(items[0].value).toBe(1_000_000_003);
    expect(items[1].pct).toBe(0); // hiển thị 0% nhưng ô vẫn tồn tại
  });

  it("loại ngành có total_value <= 0 hoặc không phải số", () => {
    const { items } = buildMoneyFlow([
      { group: "A", icb_code: "1", total_value: 100 },
      { group: "B", icb_code: "2", total_value: 0 },
      { group: "C", icb_code: "3", total_value: -5 },
      { group: "D", icb_code: "4", total_value: "x" },
      { group: "E", icb_code: "5" },
    ]);
    expect(items.map((s) => s.name)).toEqual(["A"]);
  });

  it("tổng bằng 0 → rỗng", () => {
    expect(buildMoneyFlow([{ group: "A", icb_code: "1", total_value: 0 }])).toEqual({
      items: [],
      total: 0,
    });
  });

  it("input rác không làm crash", () => {
    expect(buildMoneyFlow(null).items).toEqual([]);
    expect(buildMoneyFlow(undefined).items).toEqual([]);
    expect(buildMoneyFlow([null, undefined, 5]).items).toEqual([]);
  });

  it("thiếu group → Chưa phân loại, tô xám", () => {
    const { items } = buildMoneyFlow([{ icb_code: "", total_value: 10 }]);
    expect(items[0].name).toBe("Chưa phân loại");
    expect(items[0].color).toBe("#8a8a86");
  });

  it("mỗi ngành có màu và màu chữ tương phản", () => {
    const { items } = buildMoneyFlow(sample);
    for (const s of items) {
      expect(s.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(["#ffffff", "#0b0b0b"]).toContain(s.ink);
    }
  });
});

describe("toEchartsData", () => {
  it("map sang node treemap 1 cấp", () => {
    const { items } = buildMoneyFlow(sample);
    const data = toEchartsData(items);
    expect(data[0]).toMatchObject({
      name: "Ngân hàng",
      value: 3_000e9,
      _pct: 60,
      _count: 18,
    });
    expect(data[0].children).toBeUndefined();
    expect(data[0].itemStyle.color).toBe(items[0].color);
  });
});

describe("fmtTyDong", () => {
  it("quy VND về tỷ đồng", () => {
    expect(fmtTyDong(1_234e9)).toContain("1.234");
    expect(fmtTyDong(1_234e9)).toContain("tỷ");
  });
});

describe("LABEL_MIN_PCT", () => {
  it("ngưỡng ẩn nhãn là 1.5%", () => {
    expect(LABEL_MIN_PCT).toBe(1.5);
  });
});
