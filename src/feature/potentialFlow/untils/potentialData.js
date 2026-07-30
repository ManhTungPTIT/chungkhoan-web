// Map board thị trường thật (/vn100) → dữ liệu chart "Mã cổ phiếu tiềm năng
// lướt sóng" và tính vị trí hiển thị. Hàm thuần, không phụ thuộc React.
//   - gia_tri_khop_lenh (Tỷ)   = value (VND) / 1e9
//   - gia_hien_tai (Nghìn)     = price (VND) / 1000
//   - pct_tang_gia             = ĐIỂM SỨC MẠNH, xem dưới
// Đường giá dùng MIN-MAX scale (biên độ giá giữa các mã chênh rất lớn), bar
// tím/xanh scale theo max của cột.
//
// `pct_tang_gia` KHÔNG còn là phần trăm thuần (giữ tên cũ để không phải sửa
// khắp component/test). Công thức hiện hành:
//
//     điểm = (giá hiện tại − giá tham chiếu) / giá tham chiếu × 100
//            + √(thanh khoản tại thời điểm đó, đơn vị TỶ ĐỒNG)
//
// Số hạng đầu chính là `change_pct` do BE trả (data_source: (match_price −
// ref_price)/ref_price × 100, mã chưa khớp được gán 0 thay vì −100% ảo) — dùng
// lại thay vì tự tính từ `ref` để thừa hưởng luôn guard đó.
//
// Số hạng √thanh khoản tính bằng TỶ, không phải VND: √(10 tỷ VND) ≈ 100.000 sẽ
// nhấn chìm phần % (0–15), chart thành xếp hạng thanh khoản thuần. Tính bằng tỷ
// thì √300 ≈ 17.3, cùng cỡ với phần % → hai thành phần cộng được với nhau. Căn
// bậc 2 làm phẳng chênh lệch thanh khoản (300 tỷ chỉ hơn 30 tỷ 1.8 lần điểm,
// không phải 10 lần) nên mã thanh khoản khủng không một mình chiếm hết top.

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const VND_TO_TY = 1_000_000_000;
const VND_TO_NGHIN = 1000;

export function mapBoardRow(row) {
  const giaTriKhopLenh = num(row?.value) / VND_TO_TY;
  // max(0, …): value âm không hợp lệ nhưng nếu vendor trả rác thì √(số âm) = NaN
  // sẽ làm sort và mọi phép scale phía sau vỡ im lặng.
  const thanhKhoanBonus = Math.sqrt(Math.max(giaTriKhopLenh, 0));
  return {
    ma_ck: row?.symbol,
    gia_tri_khop_lenh: giaTriKhopLenh,
    gia_hien_tai: num(row?.price) / VND_TO_NGHIN,
    pct_tang_gia: num(row?.change_pct) + thanhKhoanBonus,
  };
}

// Mốc trục cột tím (giá trị khớp lệnh, Tỷ): 5 mốc đều từ 0 tới giá trị lớn nhất.
//
// Trước đây trục này là dãy cứng [-15, -10, -5, 0] kèm dấu % chép từ mockup — không
// mô tả dữ liệu nào cả, vì cột tím là số tiền chứ không phải phần trăm.
//
// 5 mốc để khớp trục giá và trục % trong cùng biểu đồ.
export function leftTicks(leftMax) {
  const max = leftMax > 0 ? leftMax : 1;
  // Chỉ giữ số lẻ khi thang nhỏ: max = 2 mà làm tròn nguyên thì 5 mốc thành
  // 0, 1, 1, 2, 2 — trục có mốc trùng nhau, đọc ra vô nghĩa.
  const digits = max >= 20 ? 0 : max >= 4 ? 1 : 2;
  const factor = 10 ** digits;
  return [0, 1, 2, 3, 4].map((i) => Math.round((max * i * factor) / 4) / factor);
}

export function buildPotentialView(boardRows, topN = 20) {
  const mapped = (Array.isArray(boardRows) ? boardRows : [])
    .map(mapBoardRow)
    .filter((r) => r.ma_ck)
    .sort((a, b) => b.pct_tang_gia - a.pct_tang_gia)
    .slice(0, topN);

  const values = mapped.map((r) => r.gia_tri_khop_lenh);
  const prices = mapped.map((r) => r.gia_hien_tai);
  const pcts = mapped.map((r) => r.pct_tang_gia);

  const leftMax = mapped.length ? Math.max(0, ...values) : 0;
  const priceMin = mapped.length ? Math.min(...prices) : 0;
  const priceMax = mapped.length ? Math.max(...prices) : 0;
  const pctMax = mapped.length ? Math.max(0, ...pcts) : 0;
  const priceSpan = priceMax - priceMin;
  // Trục % làm tròn lên bội số 5 để nhãn đẹp và bar khớp trục (tối thiểu 5).
  const pctAxisMax = pctMax > 0 ? Math.max(5, Math.ceil(pctMax / 5) * 5) : 0;

  const rows = mapped.map((r) => ({
    ...r,
    valueBarPct: leftMax > 0 ? (r.gia_tri_khop_lenh / leftMax) * 100 : 0,
    priceLinePct: priceSpan > 0 ? ((r.gia_hien_tai - priceMin) / priceSpan) * 100 : 50,
    pctBarPct: pctAxisMax > 0 ? Math.max(0, (r.pct_tang_gia / pctAxisMax) * 100) : 0,
  }));

  return { rows, leftMax, priceMin, priceMax, pctMax, pctAxisMax };
}
