// Map board thị trường thật (/vn100) → dữ liệu chart "Mã cổ phiếu tiềm năng
// lướt sóng" và tính vị trí hiển thị. Hàm thuần, không phụ thuộc React.
//   - gia_tri_khop_lenh (Tỷ)   = value (VND) / 1e9
//   - gia_hien_tai (Nghìn)     = price (VND) / 1000
//   - pct_tang_gia             = % tăng giá thật (hiển thị ở cột xanh)
//   - diem                     = ĐIỂM SỨC MẠNH, chỉ dùng để xếp hạng, xem dưới
// Đường giá dùng MIN-MAX scale (biên độ giá giữa các mã chênh rất lớn), bar
// tím/xanh scale theo max của cột.
//
// Điều kiện lọc (mã không thoả bị loại khỏi bảng, không phải bị đẩy xuống cuối):
//   - thanh khoản > 1 tỷ đồng
//   - giá tăng (pct_tang_gia > 0)
//
// Công thức xếp hạng:
//
//     điểm = (giá hiện tại − giá tham chiếu) / giá tham chiếu × 100
//            × log10(thanh khoản tại thời điểm đó + 1)
//
// Thừa số đầu chính là `change_pct` do BE trả (data_source: (match_price −
// ref_price)/ref_price × 100, mã chưa khớp được gán 0 thay vì −100% ảo) — dùng
// lại thay vì tự tính từ `ref` để thừa hưởng luôn guard đó.
//
// log10 tính theo TỶ, không phải VND. Theo VND mọi mã đều rơi vào khoảng
// log10(1e9…1e12) = 9…12, hệ số gần như bằng nhau → xếp hạng thoái hoá về
// đúng thứ tự % tăng giá, thanh khoản coi như không tính. Theo tỷ thì hệ số
// trải 0.3 (1 tỷ) → 3 (1000 tỷ), tức chênh 10 lần, đủ để mã tăng ít nhưng dòng
// tiền lớn vượt mã tăng nhiều mà thanh khoản mỏng. Bộ lọc >1 tỷ cũng đảm bảo
// hệ số luôn > 0 nên điểm không bao giờ đổi dấu so với % tăng giá.
//
// `+1` giữ nguyên theo công thức gốc: chống log10(0) = −∞ ở các mã sát ngưỡng
// (và ở mapBoardRow, vốn map được cả mã sẽ bị lọc bỏ sau đó).

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const VND_TO_TY = 1_000_000_000;
const VND_TO_NGHIN = 1000;

// Ngưỡng thanh khoản tối thiểu để vào bảng (Tỷ đồng).
export const MIN_THANH_KHOAN_TY = 1;

export function mapBoardRow(row) {
  const giaTriKhopLenh = num(row?.value) / VND_TO_TY;
  const pctTangGia = num(row?.change_pct);
  // max(0, …): value âm không hợp lệ nhưng nếu vendor trả rác thì log10(số âm)
  // = NaN sẽ làm sort và mọi phép scale phía sau vỡ im lặng.
  const heSoThanhKhoan = Math.log10(Math.max(giaTriKhopLenh, 0) + 1);
  return {
    ma_ck: row?.symbol,
    gia_tri_khop_lenh: giaTriKhopLenh,
    gia_hien_tai: num(row?.price) / VND_TO_NGHIN,
    pct_tang_gia: pctTangGia,
    diem: pctTangGia * heSoThanhKhoan,
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
    .filter(
      (r) =>
        r.ma_ck &&
        r.gia_tri_khop_lenh > MIN_THANH_KHOAN_TY &&
        r.pct_tang_gia > 0,
    )
    .sort((a, b) => b.diem - a.diem)
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
