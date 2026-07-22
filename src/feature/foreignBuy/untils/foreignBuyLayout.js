// Chuẩn hoá dữ liệu API /foreign-trading (phần buy) thành vị trí hiển thị cho
// chart combo "GIÁ TRỊ NƯỚC NGOÀI MUA RÒNG CAO NHẤT":
//   - cột tím  (giá trị dư mua Tỷ): bar width theo max toàn cột
//   - đường vàng (giá hiện tại Nghìn): MIN-MAX scale về [0..100]
//   - cột xanh (mã tăng giá %) / cột đỏ (mã giảm giá %): 2 bar riêng, chỉ 1
//     trong 2 có giá trị tuỳ dấu change_pct — cùng dùng chung 1 trục đối xứng
//     (pctAxisMax) để độ dài bar 2 bên nhất quán.
// Hàm thuần, không phụ thuộc React — dễ test.

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function buildForeignBuyView(rows) {
    const safe = Array.isArray(rows) ? rows : [];
    const values = safe.map((r) => Math.abs(num(r.net_value)) / 1_000_000_000); // VND -> Tỷ
    const prices = safe.map((r) => num(r.price) / 1000); // VND -> Nghìn
    const pcts = safe.map((r) => num(r.change_pct));

    const leftMax = safe.length ? Math.max(0, ...values) : 0;
    const priceMin = safe.length ? Math.min(...prices) : 0;
    const priceMax = safe.length ? Math.max(...prices) : 0;
    const priceSpan = priceMax - priceMin;
    const pctAbsMax = safe.length ? Math.max(0, ...pcts.map((p) => Math.abs(p))) : 0;
    // Trục % làm tròn lên bội số 5, tối thiểu 5 — tránh chia 0 / trục quá dày.
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