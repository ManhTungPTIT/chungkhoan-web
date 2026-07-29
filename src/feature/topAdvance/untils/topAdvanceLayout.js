// Chuẩn hoá dữ liệu API /top-advance-board thành vị trí hiển thị cho chart
// combo "TOP TĂNG MẠNH NHẤT" — bản đối xứng của topDeclineLayout:
//   - cột tím  (giá trị khớp lệnh Tỷ): bar width theo max toàn cột
//   - đường vàng (giá hiện tại Nghìn): MIN-MAX scale về [0..100]
//   - cột đỏ   (% tăng giá, đơn hướng): bar width theo pct / axisMax
// Hàm thuần, không phụ thuộc React — dễ test.

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export function buildTopAdvanceView(rows) {
    const safe = Array.isArray(rows) ? rows : [];
    const values = safe.map((r) => num(r.value) / 1_000_000_000); // VND -> Tỷ
    const prices = safe.map((r) => num(r.price) / 1000); // VND -> Nghìn
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
        valueTyDigits: values[i] > 0 && values[i] < 1 ? 2 : 1,
        priceNghin: prices[i],
        pctTang: pcts[i],
        valueBarPct: leftMax > 0 ? Math.sqrt(values[i] / leftMax) * 100 : 0,
        priceLinePct: priceSpan > 0 ? ((prices[i] - priceMin) / priceSpan) * 100 : 50,
        // đơn hướng: luôn dùng |pct| — rổ đã lọc sẵn phía BE nên pct ở đây là số dương
        pctBarPct: pctAxisMax > 0 ? (Math.abs(pcts[i]) / pctAxisMax) * 100 : 0,
    }));

    return { rows: built, leftMax, priceMin, priceMax, pctAxisMax };
}
