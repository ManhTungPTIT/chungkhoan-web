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
  // Trục % làm tròn LÊN bội số 5 để nhãn trục đẹp và bar khớp trục (T+2 ~ 15%,
  // T+3 ~ 25%). Tối thiểu 5 để tránh chia 0 / trục quá dày khi % nhỏ.
  const pctAxisMax = pctMax > 0 ? Math.max(5, Math.ceil(pctMax / 5) * 5) : 0;

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
