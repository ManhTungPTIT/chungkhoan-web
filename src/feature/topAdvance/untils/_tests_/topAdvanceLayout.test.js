import { describe, it, expect } from "vitest";
import { buildTopAdvanceView } from "../topAdvanceLayout";

describe("buildTopAdvanceView", () => {
    it("quy đổi đơn vị và scale bar đúng", () => {
        const view = buildTopAdvanceView([
            { symbol: "MTP", value: 26_460_000, price: 12600, change_pct: 14.29 },
            { symbol: "DBM", value: 14_150_000, price: 25000, change_pct: 9.09 },
        ]);
        expect(view.rows).toHaveLength(2);
        expect(view.rows[0].valueBarPct).toBe(100);
        expect(view.rows[0].pctBarPct).toBeGreaterThan(view.rows[1].pctBarPct);
    });

    it("trục % làm tròn lên bội số 5, tối thiểu 5", () => {
        expect(buildTopAdvanceView([{ symbol: "A", change_pct: 6.8 }]).pctAxisMax).toBe(10);
        expect(buildTopAdvanceView([{ symbol: "A", change_pct: 1.2 }]).pctAxisMax).toBe(5);
    });

    it("giá bằng nhau -> đường giá về giữa, không chia cho 0", () => {
        const view = buildTopAdvanceView([
            { symbol: "A", price: 20000, change_pct: 3 },
            { symbol: "B", price: 20000, change_pct: 2 },
        ]);
        expect(view.rows.map((r) => r.priceLinePct)).toEqual([50, 50]);
    });

    it("rows rỗng -> mọi max = 0, rows = []", () => {
        const view = buildTopAdvanceView([]);
        expect(view.rows).toEqual([]);
        expect(view.leftMax).toBe(0);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildTopAdvanceView(null).rows).toEqual([]);
        expect(buildTopAdvanceView(undefined).rows).toEqual([]);
    });
});
