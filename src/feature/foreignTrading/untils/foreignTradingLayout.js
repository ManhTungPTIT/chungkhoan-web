// Chuẩn hoá dữ liệu API /foreign-trading-history thành vị trí hiển thị cho
// chart diverging "GIAO DỊCH KHỐI NGOẠI":
//   - cột tím  (giá trị bán, Tỷ): luôn nảy sang trái, độ dài theo axisMax dùng chung
//   - cột xanh/đỏ (giá trị ròng, Tỷ): nảy sang phải, màu theo dấu net_value
//     (net >= 0 -> mua ròng, xanh; net < 0 -> bán ròng, đỏ), cùng chung axisMax
//     với cột tím để 2 bên trục 0 cân đối như trục đối xứng.
// Hàm thuần, không phụ thuộc React — dễ test.

const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const fmtDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    return `Ngày ${d}/${m}/${y}`;
};

export function buildForeignTradingView(rows, limit = 30) {
    const safe = Array.isArray(rows) ? rows.slice(-limit).reverse() : [];

    const sellTy = safe.map((r) => num(r.sell_value) / 1_000_000_000);
    const netTy = safe.map((r) => num(r.net_value) / 1_000_000_000);

    const leftMax = safe.length ? Math.max(0, ...sellTy) : 0;
    const rightMax = safe.length ? Math.max(0, ...netTy.map((v) => Math.abs(v))) : 0;
    const axisMax = Math.max(leftMax, rightMax, 1);

    const built = safe.map((r, i) => {
        const sell = sellTy[i];
        const net = netTy[i];
        const isBuy = net >= 0;
        return {
            date: r.date,
            label: fmtDate(r.date),
            sellTy: sell,
            netTy: net,
            isBuy,
            sellBarPct: axisMax > 0 ? (sell / axisMax) * 100 : 0,
            netBarPct: axisMax > 0 ? (Math.abs(net) / axisMax) * 100 : 0,
        };
    });

    return { rows: built, axisMax };
}

export function axisTicks(max, count = 3) {
    const safeMax = max > 0 ? max : 1;
    return Array.from({ length: count + 1 }, (_, index) => (safeMax / count) * index);
}