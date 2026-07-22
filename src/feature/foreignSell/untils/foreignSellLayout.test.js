import { describe, expect, it } from "vitest";
import { buildForeignSellView } from "./foreignSellLayout";

describe("buildForeignSellView", () => {
    it("uses absolute net value and preserves negative % values", () => {
        const view = buildForeignSellView([
            { symbol: "AAA", price: 20000, change_pct: -1.5, net_value: -5000000000 },
            { symbol: "BBB", price: 25000, change_pct: 2.2, net_value: -10000000000 },
        ]);

        expect(view.rows[0].valueTy).toBeCloseTo(5);
        expect(view.rows[0].priceNghin).toBe(20);
        expect(view.rows[0].pctTang).toBe(-1.5);
        expect(view.rows[0].pctDownBarPct).toBeGreaterThan(0);
        expect(view.rows[1].pctUpBarPct).toBeGreaterThan(0);
    });
});
