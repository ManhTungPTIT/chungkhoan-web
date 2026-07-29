// Bảng màu NGÀNH dùng chung cho mọi biểu đồ có tô theo ngành (treemap dòng tiền
// khớp lệnh, treemap thỏa thuận…). Đặt ở src/untils vì hợp đồng quan trọng nhất
// của nó là XUYÊN BIỂU ĐỒ: cùng một ngành phải ra cùng một màu ở mọi trang.
//
// Màu ở đây CHỈ để tách ô, không mã hóa tăng/giảm — danh tính do nhãn trong ô
// mang. Vì vậy tuyệt đối không dùng đỏ/xanh kiểu bảng giá.
//
// 8 hue gốc (đã validate CVD ở cả light lẫn dark) × 3 bậc sáng = 24 tổ hợp.

// 8 hue gốc — thứ tự này là cơ chế an toàn mù màu, đừng đảo.
const BASE_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#f4cf43", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

const BASE_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];

const SURFACE = { light: "#fcfcfb", dark: "#1a1a19" };
const INK = { light: "#0b0b0b", dark: "#ffffff" };

// Ngành chưa phân loại luôn xám trung tính — không chiếm slot màu nào.
export const UNCLASSIFIED = "Chưa phân loại";
const GRAY = { light: "#8a8a86", dark: "#6f6f6b" };

function toRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]) {
  const p = (v) => Math.round(v).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

// Trộn tuyến tính trong sRGB — đủ cho việc tạo bậc sáng của cùng một hue.
function mix(hex, target, ratio) {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i] - v) * ratio));
}

function relLuminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Màu chữ trên nền ô: chọn bên nào tương phản hơn (nhãn luôn phải đọc được).
export function labelInk(bgHex) {
  const l = relLuminance(bgHex);
  const onWhite = 1.05 / (l + 0.05);
  const onBlack = (l + 0.05) / 0.05;
  return onWhite >= onBlack ? "#ffffff" : "#0b0b0b";
}

// 8 hue × `tiers` bậc sáng. Mặc định 3 bậc = 24 tổ hợp (treemap dùng số này để
// băm — ĐỔI mặc định là đổi màu mọi ngành trên các treemap). Biểu đồ cần nhiều
// màu hơn thì gọi buildPalette(dark, 4) để lấy 32 tổ hợp.
export function buildPalette(dark = false, tiers = 3) {
  const base = dark ? BASE_DARK : BASE_LIGHT;
  const surface = dark ? SURFACE.dark : SURFACE.light;
  const ink = dark ? INK.dark : INK.light;
  const out = [];
  for (let tier = 0; tier < tiers; tier += 1) {
    for (const hex of base) {
      if (tier === 0) out.push(hex);
      else if (tier === 1) out.push(mix(hex, surface, 0.32));
      else if (tier === 2) out.push(mix(hex, ink, dark ? 0.22 : 0.3));
      else out.push(mix(hex, surface, 0.55));
    }
  }
  return out;
}

// FNV-1a 32-bit — băm ổn định theo icb_code để màu bám vào NGÀNH, không bám
// vào thứ hạng: đổi phiên hay lọc bớt mã thì ngành vẫn giữ nguyên màu.
function hash(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Màu của MỘT ngành — hàm thuần theo icb_code, không phụ thuộc danh sách ngành
// đang vẽ hay thứ hạng của nó.
//
// Cố ý KHÔNG dò tránh đụng độ: dò thì hai biểu đồ có tập ngành khác nhau sẽ ra
// hai màu khác nhau cho cùng một ngành, mất hẳn khả năng đọc chéo giữa các
// trang. Đánh đổi: hai ngành có thể trùng màu trong cùng một biểu đồ. Chấp nhận
// được vì ô nào cũng có nhãn, và với >24 ngành thì trùng là không tránh khỏi.
export function colorForSector(icbCode, name, dark = false) {
  if (name === UNCLASSIFIED || !icbCode) return dark ? GRAY.dark : GRAY.light;
  const palette = buildPalette(dark);
  return palette[hash(String(icbCode)) % palette.length];
}

// Dựng Map(icb_code → màu) cho cả một biểu đồ.
//
// items PHẢI đã sort giảm dần theo giá trị, và được phép lặp icb_code (biểu đồ
// theo mã: nhiều mã cùng ngành → cùng màu, lần gặp đầu quyết định).
//
// Mỗi ngành lấy màu chuẩn từ colorForSector; nếu màu đó đã bị ngành khác trong
// CÙNG biểu đồ chiếm thì dò sang tổ hợp trống kế tiếp. Vì duyệt theo giá trị
// giảm dần, ô LỚN luôn giữ được màu chuẩn của ngành mình — tức là những ô đáng
// đối chiếu giữa hai biểu đồ vẫn khớp màu, chỉ ô nhỏ mới bị đẩy đi. Không dò
// thì hai ngành khác nhau đứng cạnh nhau có thể trùng màu y hệt (đã gặp:
// VJC/Du lịch và NVL/Bất động sản cùng ra xanh).
export function assignSectorColors(items, dark = false) {
  const palette = buildPalette(dark);
  const gray = dark ? GRAY.dark : GRAY.light;
  const taken = new Set();
  const map = new Map();

  for (const item of items) {
    const code = item?.icb_code;
    const key = String(code || item?.name || "");
    if (map.has(key)) continue;
    const canonical = colorForSector(code, item?.name, dark);
    if (canonical === gray) {
      map.set(key, gray);
      continue;
    }
    let idx = palette.indexOf(canonical);
    for (let step = 0; step < palette.length && taken.has(idx); step += 1) {
      idx = (idx + 1) % palette.length;
    }
    taken.add(idx);
    map.set(key, palette[idx]);
  }
  return map;
}
