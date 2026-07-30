import { describe, it, expect } from "vitest";
import { buildConsistencyView, bandForScore, shortDate } from "../consistencyView";

const payload = {
  generated_at: "2026-07-30 11:05",
  sessions: 3,
  ma_lookback: 5,
  dates: ["2026-07-28", "2026-07-29", "2026-07-30"],
  rows: [
    {
      group: "Ngân hàng",
      icb_code: "8355",
      symbol_count: 12,
      scores: [80, 20, -60],
      mean: 13.33,
      std: 5.2,
      ratio: 2.56,
      positive_sessions: 2,
      ma_prev: 4.33,
      delta: 9,
    },
    {
      group: "Thép",
      icb_code: "1757",
      symbol_count: 6,
      scores: [-70, 0, null],
      mean: -35,
      std: 35,
      ratio: -1,
      positive_sessions: 0,
      ma_prev: null,
      delta: null,
    },
  ],
};

describe("bandForScore", () => {
  it("chia 5 mức theo ngưỡng ±50 và vùng chết ±5", () => {
    expect(bandForScore(100)).toBe("in-strong");
    expect(bandForScore(50)).toBe("in-strong");
    expect(bandForScore(49.9)).toBe("in");
    expect(bandForScore(5.1)).toBe("in");
    expect(bandForScore(5)).toBe("neutral");
    expect(bandForScore(0)).toBe("neutral");
    expect(bandForScore(-5)).toBe("neutral");
    expect(bandForScore(-5.1)).toBe("out");
    expect(bandForScore(-49.9)).toBe("out");
    expect(bandForScore(-50)).toBe("out-strong");
    expect(bandForScore(-100)).toBe("out-strong");
  });

  it("đối xứng: |điểm| bằng nhau thì mức phải là gương của nhau", () => {
    for (const value of [0, 3, 5, 20, 49.9, 50, 100]) {
      const up = bandForScore(value);
      const down = bandForScore(-value);
      expect(down).toBe(up.replace("in", "out"));
    }
  });

  it("thiếu điểm → ô rỗng, KHÔNG phải trung tính", () => {
    expect(bandForScore(null)).toBe("empty");
    expect(bandForScore(undefined)).toBe("empty");
    expect(bandForScore(NaN)).toBe("empty");
  });
});

describe("shortDate", () => {
  it("ISO → dd/MM", () => {
    expect(shortDate("2026-07-30")).toBe("30/07");
  });

  it("chuỗi hỏng → giữ nguyên để còn debug", () => {
    expect(shortDate("rác")).toBe("rác");
    expect(shortDate(null)).toBe("");
  });
});

describe("buildConsistencyView", () => {
  it("giữ nguyên thứ tự BE (đã sort theo ratio), không sort lại", () => {
    const view = buildConsistencyView(payload);
    expect(view.rows.map((r) => r.group)).toEqual(["Ngân hàng", "Thép"]);
  });

  it("mỗi hàng có đúng một ô cho mỗi ngày của trục", () => {
    const view = buildConsistencyView(payload);
    for (const row of view.rows) {
      expect(row.cells.map((c) => c.date)).toEqual(payload.dates);
    }
    expect(view.rows[0].cells.map((c) => c.band)).toEqual(["in-strong", "in", "out-strong"]);
    expect(view.rows[1].cells.map((c) => c.band)).toEqual(["out-strong", "neutral", "empty"]);
  });

  it("scores ngắn hơn trục ngày vẫn ra đủ ô (đệm rỗng, không trượt cột)", () => {
    const view = buildConsistencyView({
      dates: ["d1", "d2", "d3"],
      rows: [{ group: "X", scores: [10] }],
    });
    expect(view.rows[0].cells).toHaveLength(3);
    expect(view.rows[0].cells.map((c) => c.band)).toEqual(["in", "empty", "empty"]);
  });

  it("cắt top N nhưng vẫn báo tổng số ngành", () => {
    const view = buildConsistencyView(payload, 1);
    expect(view.rows).toHaveLength(1);
    expect(view.total).toBe(2);
  });

  it("topN = 0 → lấy hết", () => {
    expect(buildConsistencyView(payload, 0).rows).toHaveLength(2);
  });

  it("mang theo nhãn ngày rút gọn và metadata", () => {
    const view = buildConsistencyView(payload);
    expect(view.dateLabels).toEqual(["28/07", "29/07", "30/07"]);
    expect(view.sessions).toBe(3);
    expect(view.maLookback).toBe(5);
    expect(view.generatedAt).toBe("2026-07-30 11:05");
  });

  it("đánh số hạng theo đúng thứ tự BE trả", () => {
    expect(buildConsistencyView(payload).rows.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("delta thiếu → null (phân biệt với 0 = không đổi)", () => {
    const rows = buildConsistencyView(payload).rows;
    expect(rows[0].delta).toBe(9);
    expect(rows[1].delta).toBeNull();
    expect(buildConsistencyView({
      dates: ["d1"],
      rows: [{ group: "X", mean: 1, scores: [1], delta: 0 }],
    }).rows[0].delta).toBe(0);
  });

  it("thanh bar scale theo |điểm| lớn nhất của CÁC DÒNG ĐANG HIỆN", () => {
    const rows = buildConsistencyView(payload).rows;
    // |−35| là lớn nhất → dòng đó chạm mép, dòng 13.33 dài theo tỷ lệ
    expect(rows[1].maBarPct).toBe(100);
    expect(rows[0].maBarPct).toBeCloseTo((13.33 / 35) * 100, 6);
  });

  it("cắt top N thì thang bar tính lại theo phần đang hiện", () => {
    const rows = buildConsistencyView(payload, 1).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].maBarPct).toBe(100); // chỉ còn 13.33 → chính nó là max
  });

  it("mọi điểm = 0 → bar 0, không chia cho 0 ra NaN", () => {
    const rows = buildConsistencyView({
      dates: ["d1"],
      rows: [{ group: "X", mean: 0, scores: [0] }],
    }).rows;
    expect(rows[0].maBarPct).toBe(0);
  });

  it("vạch phân cách đặt sau dòng dương cuối cùng", () => {
    expect(buildConsistencyView(payload).dividerAfter).toBe(0);
  });

  it("toàn dương hoặc toàn âm → không có vạch", () => {
    const allUp = buildConsistencyView({
      dates: ["d1"],
      rows: [{ group: "A", mean: 5, scores: [5] }, { group: "B", mean: 2, scores: [2] }],
    });
    const allDown = buildConsistencyView({
      dates: ["d1"],
      rows: [{ group: "A", mean: -2, scores: [-2] }, { group: "B", mean: -5, scores: [-5] }],
    });
    expect(allUp.dividerAfter).toBe(-1);
    expect(allDown.dividerAfter).toBe(-1);
  });

  it("payload rỗng/hỏng → view rỗng an toàn", () => {
    for (const bad of [null, undefined, {}, { rows: "x", dates: 3 }]) {
      const view = buildConsistencyView(bad);
      expect(view.rows).toEqual([]);
      expect(view.dates).toEqual([]);
    }
  });
});
