import { describe, it, expect } from "vitest";
import { buildForeignBuyView } from "../foreignBuyLayout";

describe("buildForeignBuyView", () => {
    it("quy đổi đơn vị và scale bar đúng", () => {
        const view = buildForeignBuyView([
            { symbol: "VNM", net_value: 146_203_219_000, price: 59200, change_pct: 1.2 },
            { symbol: "HPG", net_value: 47_133_039_250, price: 20700, change_pct: -0.48 },
        ]);
        expect(view.rows).toHaveLength(2);
        expect(view.rows[0].valueTy).toBeCloseTo(146.2, 1);
        expect(view.rows[0].priceNghin).toBeCloseTo(59.2, 1);
        expect(view.rows[0].valueBarPct).toBe(100); // mã lớn nhất -> 100%
        expect(view.rows[0].pctUpBarPct).toBeGreaterThan(0);
        expect(view.rows[0].pctDownBarPct).toBe(0);
        expect(view.rows[1].pctDownBarPct).toBeGreaterThan(0);
        expect(view.rows[1].pctUpBarPct).toBe(0);
    });

    it("rows rỗng -> mọi max = 0, rows = []", () => {
        const view = buildForeignBuyView([]);
        expect(view.rows).toEqual([]);
        expect(view.leftMax).toBe(0);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildForeignBuyView(null).rows).toEqual([]);
        expect(buildForeignBuyView(undefined).rows).toEqual([]);
    });
});