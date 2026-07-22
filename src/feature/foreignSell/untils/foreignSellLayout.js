// Giống foreignBuyLayout, chỉ khác nhãn/nguồn — sell net_value gốc là ÂM,
// lấy trị tuyệt đối để vẽ bar giống buy.
const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function buildForeignSellView(rows) {
    const safe = Array.isArray(rows) ? rows : [];
    const values = safe.map((r) => Math.abs(num(r.net_value)) / 1_000_000_000);
    const prices = safe.map((r) => num(r.price) / 1000);
    const pcts = safe.map((r) => num(r.change_pct));

    const leftMax = safe.length ? Math.max(0, ...values) : 0;
    const priceMin = safe.length ? Math.min(...prices) : 0;
    const priceMax = safe.length ? Math.max(...prices) : 0;
    const priceSpan = priceMax - priceMin;
    const pctAbsMax = safe.length ? Math.max(0, ...pcts.map((p) => Math.abs(p))) : 0;
    const pctAxisMax = pctAbsMax > 0 ? Math.max(5, Math.ceil(pctAbsMax / 5) * 5) : 5;

    const built = safe.map((r, i) => ({
        symbol: r.symbol,
        valueTy: values[i],
        priceNghin: prices[i],
        pctTang: pcts[i],
        valueBarPct: leftMax > 0 ? (values[i] / leftMax) * 100 : 0,
        priceLinePct: priceSpan > 0 ? ((prices[i] - priceMin) / priceSpan) * 100 : 50,
        pctUpBarPct: pcts[i] > 0 ? (pcts[i] / pctAxisMax) * 100 : 0,
        pctDownBarPct: pcts[i] < 0 ? (Math.abs(pcts[i]) / pctAxisMax) * 100 : 0,
    }));

    return { rows: built, leftMax, priceMin, priceMax, pctAxisMax };
}