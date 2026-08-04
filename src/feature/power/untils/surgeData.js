// Tiêu chí "ĐỘT BIẾN DÒNG TIỀN so với TB20" cho Bản đồ sức mạnh dòng tiền.
//
// Tách hẳn khỏi powerData.js để tắt được bằng một cờ (USE_SURGE) mà không đụng
// vào công thức gốc: powerData chỉ gọi surgeMetrics(), tắt cờ là không gọi nữa.

// Nền so sánh theo KHUNG GIỜ. TB20 là dòng tiền TRỌN phiên, còn `value` hôm nay
// mới tích luỹ được một phần — so thẳng thì sáng sớm mã nào cũng "hụt tiền" và
// cuối phiên mã nào cũng "đột biến". Mỗi khung giờ chỉ so với phần TB20 mà một
// phiên bình thường đã khớp được tới thời điểm đó.
//
// Mốc là ĐẦU khung, giữ nguyên tỉ lệ tới mốc kế tiếp (bậc thang, KHÔNG nội suy)
// — cùng convention với BASELINE_CURVE của flow_surge_service ở backend.
// Hai quãng không có trong bảng gốc được phủ tự nhiên:
//   - trước 09:15 (gồm ATO) giữ 6% → mẫu số không bao giờ bằng 0;
//   - nghỉ trưa 11:30–13:00: hai mốc cùng 72% nên mẫu số đứng yên đúng lúc
//     không có lệnh nào khớp, % đột biến không tự nhảy.
export const BASELINE_CURVE = [
  [0, 0, 0.06], // trước 09:15
  [9, 15, 0.06],
  [9, 30, 0.12],
  [9, 45, 0.18],
  [10, 0, 0.25],
  [10, 15, 0.33],
  [10, 30, 0.42],
  [10, 45, 0.5],
  [11, 0, 0.58],
  [11, 15, 0.66],
  [11, 30, 0.72],
  [13, 0, 0.72],
  [13, 15, 0.77],
  [13, 30, 0.83],
  [13, 45, 0.89],
  [14, 0, 0.94],
  [14, 15, 0.98],
  [14, 30, 1.0], // từ 14:30 trở đi: phiên coi như đã khớp trọn
];

// Sàn nền: mã có TB20 dưới mức này thì tỉ lệ đột biến bắn ảo (tiền tuyệt đối
// không đáng kể mà % rất cao) → bỏ qua tiêu chí đột biến cho mã đó. Chấm trên
// TB20 CHƯA scale: đây là bộ lọc thanh khoản vốn có của mã, không được nới lỏng
// dần theo giờ. Cùng ngưỡng MIN_BASELINE_VND của flow_surge_service.
export const MIN_BASELINE_VND = 1_000_000_000;

const VND_TO_TY = 1_000_000_000;

// FE chạy trên máy người dùng nên KHÔNG tin được giờ máy — quy về giờ VN.
// hourCycle h23 để nửa đêm ra "00", không phải "24".
const VN_HHMM = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function vnMinutes(now = new Date()) {
  const [hour, minute] = VN_HHMM.format(now).split(":").map(Number);
  return hour * 60 + minute;
}

// Tỉ lệ TB20 mà một phiên bình thường đã khớp được tới `now`.
// Lấy khung CUỐI CÙNG có mốc bắt đầu ≤ now — biên nửa mở, đúng 10:00 đã thuộc
// khung 10:00.
export function baselineFactor(now = new Date()) {
  const mins = vnMinutes(now);
  let factor = BASELINE_CURVE[0][2];
  for (const [hour, minute, value] of BASELINE_CURVE) {
    if (mins < hour * 60 + minute) break;
    factor = value;
  }
  return factor;
}

const NO_SURGE = { surge: null, score: null };

// { surge, score } cho một dòng board, hoặc { surge: null, score: null } khi
// không đủ dữ liệu để chấm.
//
//   surge = value / (TB20 × tỉ lệ kỳ vọng) × 100   → % đột biến, 100% = đúng nhịp
//   score = (surge/100) × log10(value tỷ + 1)      → đột biến CÓ trọng số thanh khoản
//
// Thừa số log10 là "thanh khoản cao ưu tiên": hai mã cùng mức đột biến thì mã
// tiền lớn xếp trước. Tính theo TỶ đồng chứ không phải VND — theo VND mọi mã rơi
// vào khoảng 9…12 nên trọng số gần như triệt tiêu. Cùng khuôn với `diem` của
// flow_surge_service để hai chart nói cùng một thang.
export function surgeMetrics(row, factor) {
  const avg = Number(row?.avg_value_20);
  const value = Number(row?.value);
  if (!Number.isFinite(avg) || avg < MIN_BASELINE_VND) return NO_SURGE;
  if (!Number.isFinite(value) || value <= 0) return NO_SURGE;

  const base = avg * factor;
  if (!(base > 0)) return NO_SURGE;

  const ratio = value / base;
  return {
    surge: Math.round(ratio * 100),
    score: ratio * Math.log10(value / VND_TO_TY + 1),
  };
}
