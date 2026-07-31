// Giống foreignSellLayout, nhưng nguồn là /sector-flow-surge:
// - gia_tri_khop_lenh (Tỷ) luôn DƯƠNG -> thanh trái (tím)
// - duong_trung_binh (Nghìn) -> đường nối các chấm (vàng), scale theo min/max trong tập hiện có
// - pct_tang -> tách 2 nửa: âm (đỏ, bên trái tâm) / dương (xanh, bên phải tâm)
//
// Thứ tự dòng theo `diem` của BE (= % đột biến × log10(thanh khoản Tỷ + 1) ×
// tỷ lệ mã tăng), KHÔNG phải theo % đột biến: ngành bé xíu spike vài lần sẽ
// chiếm hết đầu bảng nếu xếp theo %.
const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function buildSectorFlowSurgeView(rows) {
    const safe = Array.isArray(rows)
        ? [...rows].sort((a, b) => num(b.diem) - num(a.diem))
        : [];

    const values = safe.map((r) => num(r.gia_tri_khop_lenh));
    const avgs = safe.map((r) => num(r.duong_trung_binh));
    const pcts = safe.map((r) => num(r.pct_tang));

    const leftMax = safe.length ? Math.max(0, ...values) : 0;
    const avgMin = safe.length ? Math.min(...avgs) : 0;
    const avgMax = safe.length ? Math.max(...avgs) : 0;
    const avgSpan = avgMax - avgMin;
    const pctAbsMax = safe.length ? Math.max(0, ...pcts.map((p) => Math.abs(p))) : 0;
    const pctAxisMax = pctAbsMax > 0 ? Math.max(5, Math.ceil(pctAbsMax / 5) * 5) : 5;

    const built = safe.map((r, i) => ({
        group: r.group,
        icbCode: r.icb_code,
        valueTy: values[i],
        avgNghin: avgs[i],
        pctTang: pcts[i],
        diem: num(r.diem),
        soMaTang: num(r.so_ma_tang),
        soMaGiam: num(r.so_ma_giam),
        valueBarPct: leftMax > 0 ? (values[i] / leftMax) * 100 : 0,
        avgLinePct: avgSpan > 0 ? ((avgs[i] - avgMin) / avgSpan) * 100 : 50,
        pctUpBarPct: pcts[i] > 0 ? (pcts[i] / pctAxisMax) * 100 : 0,
        pctDownBarPct: pcts[i] < 0 ? (Math.abs(pcts[i]) / pctAxisMax) * 100 : 0,
    }));

    return { rows: built, leftMax, avgMin, avgMax, pctAxisMax };
}