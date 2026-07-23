import { describe, it, expect } from "vitest";
import { buildTopVolumeView } from "../topVolumeLayout";

describe("buildTopVolumeView", () => {
    it("quy đổi đơn vị và scale bar đúng", () => {
        const view = buildTopVolumeView([
            { symbol: "SHB", volume: 58_000_000, price: 11550, change_pct: -1.28 },
            { symbol: "VIX", volume: 80_689_700, price: 12250, change_pct: 1.24 },
        ]);
        expect(view.rows).toHaveLength(2);
        expect(view.rows[1].volumeTrieu).toBeCloseTo(80.7, 1);
        expect(view.rows[1].valueBarPct).toBe(100);
        expect(view.rows[0].pctDownBarPct).toBeGreaterThan(0);
        expect(view.rows[1].pctUpBarPct).toBeGreaterThan(0);
    });

    it("rows rỗng -> mọi max = 0, rows = []", () => {
        const view = buildTopVolumeView([]);
        expect(view.rows).toEqual([]);
        expect(view.leftMax).toBe(0);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildTopVolumeView(null).rows).toEqual([]);
        expect(buildTopVolumeView(undefined).rows).toEqual([]);
    });
});