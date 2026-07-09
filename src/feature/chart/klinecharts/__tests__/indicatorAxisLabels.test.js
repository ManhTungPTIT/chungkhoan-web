import { describe, expect, it } from "vitest";
import {
  formatAxisPrice,
  getAxisLabelWidth,
  getRequiredAxisLabelWidth,
  layoutAroundAnchor,
  resolveLabelPositions,
} from "../indicatorAxisLabels";

const STEP = 20; // LABEL_HEIGHT 18 + LABEL_GAP 2
const CLEARANCE = 22; // ANCHOR_CLEARANCE/2 + GAP + LABEL_HEIGHT/2

describe("layoutAroundAnchor", () => {
  it("giữ nguyên nhãn đã cách xa mốc", () => {
    const items = [
      { y: 100, color: "blue" },
      { y: 320, color: "purple" },
    ];
    layoutAroundAnchor(items, 200, 400);
    expect(items[0].y).toBe(100);
    expect(items[1].y).toBe(320);
  });

  it("đẩy nhãn sát mốc ra hai phía, chừa khoảng trống quanh mốc", () => {
    const items = [
      { y: 198, color: "blue" }, // trên mốc
      { y: 203, color: "purple" }, // dưới mốc
    ];
    layoutAroundAnchor(items, 200, 400);
    expect(items[0].y).toBe(200 - CLEARANCE);
    expect(items[1].y).toBe(200 + CLEARANCE);
  });

  it("nhiều nhãn cùng phía xếp chồng dần ra xa mốc theo thứ tự giá", () => {
    const items = [
      { y: 190, color: "blue" },
      { y: 195, color: "purple" },
      { y: 199, color: "orange" },
    ];
    layoutAroundAnchor(items, 200, 400);
    const sorted = [...items].sort((a, b) => b.y - a.y);
    expect(sorted[0].y).toBe(200 - CLEARANCE); // gần mốc nhất: y gốc 199
    expect(sorted[1].y).toBe(200 - CLEARANCE - STEP);
    expect(sorted[2].y).toBe(200 - CLEARANCE - STEP * 2);
    // đúng thứ tự: nhãn có y gốc lớn hơn (giá thấp hơn) nằm gần mốc hơn
    expect(sorted[0].color).toBe("orange");
    expect(sorted[1].color).toBe("purple");
    expect(sorted[2].color).toBe("blue");
  });

  it("kẹp nhãn dưới trong phạm vi pane", () => {
    const items = [{ y: 500, color: "blue" }];
    layoutAroundAnchor(items, 200, 400);
    expect(items[0].y).toBe(391); // 400 - nửa chiều cao nhãn
  });
});

describe("resolveLabelPositions", () => {
  it("giữ nguyên nhãn đã cách nhau đủ xa", () => {
    const items = [
      { y: 40, fixed: false },
      { y: 100, fixed: false },
    ];
    resolveLabelPositions(items, 400);
    expect(items[0].y).toBe(40);
    expect(items[1].y).toBe(100);
  });

  it("đẩy các nhãn trùng vị trí tách nhau tối thiểu 1 bậc", () => {
    const items = [
      { y: 200, fixed: false },
      { y: 201, fixed: false },
      { y: 202, fixed: false },
    ];
    resolveLabelPositions(items, 400);
    expect(items[1].y - items[0].y).toBeGreaterThanOrEqual(STEP);
    expect(items[2].y - items[1].y).toBeGreaterThanOrEqual(STEP);
  });

  it("không di chuyển nhãn fixed, các nhãn khác né quanh nó", () => {
    const items = [
      { y: 199, fixed: false },
      { y: 200, fixed: true },
      { y: 201, fixed: false },
    ];
    resolveLabelPositions(items, 400);
    expect(items[1].y).toBe(200);
    expect(items[1].y - items[0].y).toBeGreaterThanOrEqual(STEP);
    expect(items[2].y - items[1].y).toBeGreaterThanOrEqual(STEP);
  });

  it("kẹp nhãn trong phạm vi pane", () => {
    const items = [
      { y: -30, fixed: false },
      { y: 500, fixed: false },
    ];
    resolveLabelPositions(items, 400);
    expect(items[0].y).toBeGreaterThanOrEqual(9); // nửa chiều cao nhãn
    expect(items[1].y).toBeLessThanOrEqual(391);
  });
});

describe("formatAxisPrice", () => {
  it("thêm dấu phân tách hàng nghìn và giữ số lẻ theo precision", () => {
    expect(formatAxisPrice(1857.9412, 2)).toBe("1,857.94");
    expect(formatAxisPrice(982.5, 2)).toBe("982.50");
    expect(formatAxisPrice(1234567, 0)).toBe("1,234,567");
  });
});

describe("getAxisLabelWidth", () => {
  it("expands beyond the minimum width for long price labels", () => {
    expect(getAxisLabelWidth(48)).toBe(60);
    expect(getAxisLabelWidth(10)).toBe(40);
  });
});

describe("getRequiredAxisLabelWidth", () => {
  it("uses the widest visible label across the pane", () => {
    const items = [
      { value: 1849.83, precision: 2 },
      { value: 16.3, precision: 2 },
      { value: 9999.99, precision: 2, fixed: true },
    ];

    expect(getRequiredAxisLabelWidth(items, (text) => text.length * 6)).toBe(60);
  });
});

