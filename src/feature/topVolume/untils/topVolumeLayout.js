// Chuẩn hoá dữ liệu API /top-volume-board thành vị trí hiển thị cho chart combo
// "KHỐI LƯỢNG KHỚP LỆNH CAO NHẤT (TRIỆU CỔ)":
//   - cột tím  (khối lượng khớp lệnh Triệu cổ): bar width theo max toàn cột
//   - đường vàng (giá hiện tại Nghìn): MIN-MAX scale về [0..100]
//   - cột xanh (mã tăng giá %) / cột đỏ (mã giảm giá %): 2 bar riêng.
// Hàm thuần, không phụ thuộc React — dễ test.

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function buildTopVolumeView(rows) {
    const safe = Array.isArray(rows) ? rows : [];
    const volumes = safe.map((r) => num(r.volume) / 1_000_000); // cổ phiếu -> Triệu cổ
    const prices = safe.map((r) => num(r.price) / 1000); // VND -> Nghìn
    const pcts = safe.map((r) => num(r.change_pct));

    const leftMax = safe.length ? Math.max(0, ...volumes) : 0;
    const priceMin = safe.length ? Math.min(...prices) : 0;
    const priceMax = safe.length ? Math.max(...prices) : 0;
    const priceSpan = priceMax - priceMin;
    const pctAbsMax = safe.length ? Math.max(0, ...pcts.map((p) => Math.abs(p))) : 0;
    const pctAxisMax = pctAbsMax > 0 ? Math.max(5, Math.ceil(pctAbsMax / 5) * 5) : 5;

    const built = safe.map((r, i) => ({
        symbol: r.symbol,
        volumeTrieu: volumes[i],
        priceNghin: prices[i],
        pctTang: pcts[i],
        valueBarPct: leftMax > 0 ? (volumes[i] / leftMax) * 100 : 0,
        priceLinePct: priceSpan > 0 ? ((prices[i] - priceMin) / priceSpan) * 100 : 50,
        pctUpBarPct: pcts[i] > 0 ? (pcts[i] / pctAxisMax) * 100 : 0,
        pctDownBarPct: pcts[i] < 0 ? (Math.abs(pcts[i]) / pctAxisMax) * 100 : 0,
    }));

    return { rows: built, leftMax, priceMin, priceMax, pctAxisMax };
}