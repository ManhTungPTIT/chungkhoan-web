import { describe, it, expect } from "vitest";
import {
  colorForChange,
  colorForRow,
  bandForChange,
  bandForRow,
  BANDS,
  CEILING,
  FLOOR,
} from "../colorBands";

describe("colorForChange", () => {
  it("trần: pct >= 6.5 → tím", () => {
    expect(colorForChange(6.5)).toBe("#C026D3");
    expect(colorForChange(7)).toBe("#C026D3");
  });

  it("sàn: pct <= -6.5 → xanh dương", () => {
    expect(colorForChange(-6.5)).toBe("#22A7F0");
    expect(colorForChange(-7)).toBe("#22A7F0");
  });

  it("tham chiếu: |pct| < 0.05 → vàng", () => {
    expect(colorForChange(0)).toBe("#f6bd51");
    expect(colorForChange(0.04)).toBe("#f6bd51");
    expect(colorForChange(-0.04)).toBe("#f6bd51");
  });

  it("tăng: một màu xanh lá cho mọi biên độ dưới trần", () => {
    expect(colorForChange(0.1)).toBe("#00d31f");
    expect(colorForChange(1)).toBe("#00d31f");
    expect(colorForChange(6)).toBe("#00d31f");
  });

  it("giảm: một màu đỏ cho mọi biên độ trên sàn", () => {
    expect(colorForChange(-0.1)).toBe("#ef2f2e");
    expect(colorForChange(-1)).toBe("#ef2f2e");
    expect(colorForChange(-6)).toBe("#ef2f2e");
  });

  it("hằng số ngưỡng đúng", () => {
    expect(CEILING).toBe(6.5);
    expect(FLOOR).toBe(-6.5);
  });
});

describe("bandForChange", () => {
  it("phân đúng 5 mức", () => {
    expect(bandForChange(7)).toBe("ceiling");
    expect(bandForChange(2)).toBe("up");
    expect(bandForChange(0)).toBe("ref");
    expect(bandForChange(-2)).toBe("down");
    expect(bandForChange(-7)).toBe("floor");
  });
});

// Phân loại theo giá thật — phải khớp từng nhánh với market_status_service.
// classify_row (BE), nếu không bản đồ nhiệt và "Bức tranh thị trường" lại đếm lệch.
describe("bandForRow", () => {
  const row = (price, extra = {}) => ({
    price,
    ref: 10000,
    ceiling: 10700,
    floor: 9300,
    ...extra,
  });

  it("giá = trần → kịch trần (kiểm tra trần TRƯỚC khi so tăng/giảm)", () => {
    expect(bandForRow(row(10700))).toBe("ceiling");
    expect(colorForRow(row(10700))).toBe("#C026D3");
  });

  it("giá = sàn → kịch sàn", () => {
    expect(bandForRow(row(9300))).toBe("floor");
    expect(colorForRow(row(9300))).toBe("#22A7F0");
  });

  it("giá = tham chiếu → đứng giá", () => {
    expect(bandForRow(row(10000))).toBe("ref");
  });

  it("mã chưa khớp lệnh (giá 0) → đứng giá, không phải -100%", () => {
    expect(bandForRow(row(0))).toBe("ref");
  });

  it("tăng/giảm trong biên độ", () => {
    expect(bandForRow(row(10500))).toBe("up");
    expect(bandForRow(row(9500))).toBe("down");
  });

  it("HNX biên ±10%: tăng 8.16% CHƯA trần → tăng giá, không phải kịch trần", () => {
    // TJC 05/08/2026 — ngưỡng cứng ±6.5% tô nhầm mã này thành tím.
    const tjc = { price: 10600, ref: 9800, ceiling: 10700, floor: 8900, change_pct: 8.16 };
    expect(bandForRow(tjc)).toBe("up");
  });

  it("UPCOM biên ±15%: tăng 13.45% CHƯA trần → tăng giá", () => {
    // LLM 05/08/2026 — ô tím to giữa bản đồ nhiệt dù chưa chạm trần.
    const llm = { price: 32900, ref: 29000, ceiling: 33300, floor: 24700, change_pct: 13.45 };
    expect(bandForRow(llm)).toBe("up");
  });

  it("HOSE giảm 6.86% CHƯA sàn → giảm giá", () => {
    const mhc = { price: 8010, ref: 8600, ceiling: 9200, floor: 8000, change_pct: -6.86 };
    expect(bandForRow(mhc)).toBe("down");
  });

  it("ceiling/floor = 0 (dữ liệu thiếu) không được coi là chạm trần/sàn ảo", () => {
    expect(bandForRow({ price: 0, ref: 10000, ceiling: 0, floor: 0 })).toBe("ref");
    expect(bandForRow({ price: 10500, ref: 10000, ceiling: 0, floor: 0 })).toBe("up");
  });

  it("thiếu ref (payload cũ chỉ có change_pct) → rơi về ngưỡng ±6.5%", () => {
    expect(bandForRow({ symbol: "A", change_pct: 7 })).toBe("ceiling");
    expect(bandForRow({ symbol: "A", change_pct: 2 })).toBe("up");
    expect(bandForRow({ symbol: "A", change_pct: -7 })).toBe("floor");
    expect(bandForRow({ symbol: "A" })).toBe("ref");
  });

  it("đầu vào rác → đứng giá, không NaN", () => {
    expect(bandForRow(null)).toBe("ref");
    expect(bandForRow({ price: "x", ref: "y" })).toBe("ref");
  });
});

describe("BANDS", () => {
  it("đúng thứ tự hiện trên chú giải và khớp màu với colorForChange", () => {
    expect(BANDS.map((b) => b.id)).toEqual(["ceiling", "up", "ref", "down", "floor"]);
    expect(BANDS.map((b) => b.label)).toEqual([
      "Tăng trần",
      "Tăng giá",
      "Đứng giá",
      "Giảm giá",
      "Giảm sàn",
    ]);
    // chú giải và ô treemap không được lệch màu
    for (const [pct, id] of [[7, "ceiling"], [2, "up"], [0, "ref"], [-2, "down"], [-7, "floor"]]) {
      expect(BANDS.find((b) => b.id === id).color).toBe(colorForChange(pct));
    }
  });
});
