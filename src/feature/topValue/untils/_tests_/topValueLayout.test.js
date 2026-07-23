import { describe, it, expect } from "vitest";
import { buildTopValueView } from "../topValueLayout";

describe("buildTopValueView", () => {
    it("quy đổi đơn vị và scale bar đúng", () => {
        const view = buildTopValueView([
            { symbol: "MWG", value: 149_227_440_000, price: 69000, change_pct: -2.27 },
            { symbol: "VIC", value: 141_620_860_000, price: 207500, change_pct: 2.67 },
        ]);
        expect(view.rows).toHaveLength(2);
        expect(view.rows[0].valueTy).toBeCloseTo(149.2, 1);
        expect(view.rows[0].priceNghin).toBeCloseTo(69, 1);
        expect(view.rows[0].valueBarPct).toBe(100);
        expect(view.rows[0].pctDownBarPct).toBeGreaterThan(0);
        expect(view.rows[1].pctUpBarPct).toBeGreaterThan(0);
    });

    it("rows rỗng -> mọi max = 0, rows = []", () => {
        const view = buildTopValueView([]);
        expect(view.rows).toEqual([]);
        expect(view.leftMax).toBe(0);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildTopValueView(null).rows).toEqual([]);
        expect(buildTopValueView(undefined).rows).toEqual([]);
    });
});
