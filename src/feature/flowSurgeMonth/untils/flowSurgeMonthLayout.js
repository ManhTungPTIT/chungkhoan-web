// Chuẩn hoá dữ liệu API /top-gain-tplus thành vị trí hiển thị cho chart combo
// "TOP TĂNG CAO NHẤT T+2":
//   - cột tím  (giá trị khớp lệnh Tỷ): bar width theo max toàn cột
//   - đường vàng (giá hiện tại Nghìn): MIN-MAX scale về [0..100] vì biên độ giá
//     giữa các mã chênh rất lớn (có mã ~9, có mã ~400) — số thật gắn nhãn riêng
//   - cột xanh  (% tăng): bar width theo max %
// Hàm thuần, không phụ thuộc React — dễ test.

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Làm tròn LÊN mốc "đẹp" 1/2/5 × 10^k (0 → 0). Dùng cho trục % dòng tiền có
// thang trải rộng.
function niceCeil(v) {
  if (v <= 0) return 0;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * pow;
}

export function buildTopGainView(rows) {
  const safe = Array.isArray(rows) ? rows.filter((row) => { if (!row || typeof row.symbol !== "string" || !row.symbol.trim()) return false; const value = Number(row.gia_tri_khop_lenh); const price = Number(row.gia_hien_tai); const pct = Number(row.pct_tang); return value > 0 && price > 0 && Number.isFinite(pct); }) : [];
  const values = safe.map((r) => num(r.gia_tri_khop_lenh));
  const prices = safe.map((r) => num(r.gia_hien_tai));
  const pcts = safe.map((r) => num(r.pct_tang));

  const leftMax = safe.length ? Math.max(0, ...values) : 0;
  const priceMin = safe.length ? Math.min(...prices) : 0;
  const priceMax = safe.length ? Math.max(...prices) : 0;
  const pctMax = safe.length ? Math.max(0, ...pcts) : 0;
  const priceSpan = priceMax - priceMin;
  // % dòng tiền trải rất rộng (vài % → vài nghìn %) → làm tròn LÊN mốc "đẹp"
  // 1/2/5 × 10^k (vd 9,250 → 10,000; 22 → 50; 10 → 10) để trục dễ đọc mọi thang.
  const pctAxisMax = niceCeil(pctMax);

  const built = safe.map((r, i) => ({
    symbol: r.symbol,
    valueTy: values[i],
    priceNghin: prices[i],
    pctTang: pcts[i],
    // Bề rộng bar tím (0..100). leftMax=0 (mọi mã value 0) → 0.
    valueBarPct: leftMax > 0 ? (values[i] / leftMax) * 100 : 0,
    // Vị trí điểm trên đường giá (0..100) theo min-max; mọi mã cùng giá → 50.
    priceLinePct: priceSpan > 0 ? ((prices[i] - priceMin) / priceSpan) * 100 : 50,
    // Bề rộng bar xanh (0..100) theo trục đã làm tròn. % âm (hiếm) → 0.
    pctBarPct: pctAxisMax > 0 ? Math.max(0, (pcts[i] / pctAxisMax) * 100) : 0,
  }));

  return { rows: built, leftMax, priceMin, priceMax, pctMax, pctAxisMax };
}
