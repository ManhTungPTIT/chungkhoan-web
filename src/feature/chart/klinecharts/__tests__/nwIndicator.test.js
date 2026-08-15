import { describe, it, expect } from "vitest";
import { calcNwFigures } from "../nwIndicator";

// dataList của klinecharts dùng `timestamp`, không có `time` — lõi không đọc
// trường đó nên vẫn chạy.
function dataList(closes) {
  return closes.map((close, i) => ({
    timestamp: 1735689600000 + i * 86400000,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
  }));
}

describe("calcNwFigures — phần calc của chỉ báo NW", () => {
  it("trả mảng cùng độ dài dataList", () => {
    const out = calcNwFigures(dataList(Array(12).fill(100)));
    expect(out).toHaveLength(12);
  });

  it("warm-up trả object RỖNG, không phải null — klinecharts đòi vậy", () => {
    const out = calcNwFigures(dataList(Array(12).fill(100)));
    expect(out.slice(0, 9)).toEqual(Array(9).fill({}));
  });

  it("từ nến thứ 10 trả { nw }", () => {
    const out = calcNwFigures(dataList(Array(10).fill(100)));
    expect(out[9].nw).toBeCloseTo(106, 10);
  });

  it("dataList rỗng không ném lỗi", () => {
    expect(calcNwFigures([])).toEqual([]);
  });
});
