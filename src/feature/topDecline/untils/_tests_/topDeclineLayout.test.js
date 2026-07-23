import { describe, it, expect } from "vitest";
import { buildTopDeclineView } from "../topDeclineLayout";

describe("buildTopDeclineView", () => {
    it("quy đổi đơn vị và scale bar đúng", () => {
        const view = buildTopDeclineView([
            { symbol: "MTP", value: 26_460_000, price: 12600, change_pct: -14.29 },
            { symbol: "DBM", value: 14_150_000, price: 25000, change_pct: -14.09 },
        ]);
        expect(view.rows).toHaveLength(2);
        expect(view.rows[0].valueBarPct).toBe(100);
        expect(view.rows[0].pctBarPct).toBeGreaterThan(view.rows[1].pctBarPct);
    });

    it("rows rỗng -> mọi max = 0, rows = []", () => {
        const view = buildTopDeclineView([]);
        expect(view.rows).toEqual([]);
        expect(view.leftMax).toBe(0);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildTopDeclineView(null).rows).toEqual([]);
        expect(buildTopDeclineView(undefined).rows).toEqual([]);
    });
});