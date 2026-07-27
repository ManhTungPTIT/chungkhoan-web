import { describe, it, expect } from "vitest";
import { buildForeignTradingView, axisTicks } from "../foreignTradingLayout";

describe("buildForeignTradingView", () => {
    it("quy đổi VND -> Tỷ và scale bar đúng", () => {
        const view = buildForeignTradingView([
            { date: "2026-06-15", buy_value: 26617980000, sell_value: 23592170000, net_value: 3025810000, total_value: 50210150000 },
            { date: "2026-06-16", buy_value: 29507395000, sell_value: 26692173450, net_value: 2815221550, total_value: 56199568450 },
        ]);
        // reverse: ngày mới nhất lên trước
        expect(view.rows[0].date).toBe("2026-06-16");
        expect(view.rows).toHaveLength(2);
        expect(view.rows[0].sellTy).toBeCloseTo(26.69, 1);
        expect(view.rows[0].netTy).toBeCloseTo(2.82, 1);
        expect(view.rows[0].isBuy).toBe(true);
        expect(view.rows[0].sellBarPct).toBeGreaterThan(0);
    });

    it("net_value âm -> isBuy = false, hiển thị bán ròng", () => {
        const view = buildForeignTradingView([
            { date: "2026-06-17", buy_value: 484324100, sell_value: 5545923000, net_value: -5061598900, total_value: 6030247100 },
        ]);
        expect(view.rows[0].isBuy).toBe(false);
        expect(view.rows[0].netBarPct).toBeGreaterThan(0);
    });

    it("rows rỗng -> mọi max mặc định, rows = []", () => {
        const view = buildForeignTradingView([]);
        expect(view.rows).toEqual([]);
        expect(view.axisMax).toBe(1);
    });

    it("input không phải mảng -> rows = []", () => {
        expect(buildForeignTradingView(null).rows).toEqual([]);
        expect(buildForeignTradingView(undefined).rows).toEqual([]);
    });

    it("axisTicks trả về mảng tick tăng dần từ 0", () => {
        expect(axisTicks(30, 3)).toEqual([0, 10, 20, 30]);
        expect(axisTicks(0)).toEqual([0, 1 / 3, 2 / 3, 1]);
    });
});