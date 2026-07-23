import { labelInk } from "../../../untils/sectorColors";

// Các nhóm giá là thang CÓ THỨ TỰ (≤10K → >100K), không phải hạng mục rời rạc,
// nên tô bằng MỘT hue đậm dần chứ không phải mỗi cột một màu. Bảy bậc dưới đây
// lấy từ ramp xanh dương chuẩn, bậc nhạt nhất vẫn đủ tương phản với nền trắng.
export const BAND_RAMP = [
  "#86b6ef", // ≤10K
  "#6da7ec", // ≤20K
  "#5598e7", // ≤40K
  "#3987e5", // ≤60K
  "#2a78d6", // ≤80K
  "#1c5cab", // ≤100K
  "#104281", // >100K
];

// Cột "Tổng" là số TỔNG HỢP, không phải một bậc giá — dùng xám đá để nó không
// nằm trong thang màu (giống chart phe bò/phe gấu).
export const TOTAL_COLOR = "#4a5568";

/**
 * Dựng dữ liệu cột từ payload /price-bands.
 *
 * Cột đầu là "Tổng", sau đó là các nhóm theo ĐÚNG thứ tự BE trả về — thứ tự là
 * khoảng giá tăng dần, tuyệt đối không sort lại theo giá trị. Nhóm rỗng vẫn giữ
 * cột.
 */
export function buildPriceBands(payload) {
  const total = Number(payload?.total_value) || 0;
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];

  const bars = groups
    .filter((g) => g && g.key)
    .map((g, i) => {
      const value = Number(g.value) || 0;
      const color = BAND_RAMP[Math.min(i, BAND_RAMP.length - 1)];
      return {
        key: g.key,
        label: g.label || g.key,
        value,
        ty: Math.round(value / 1e9),
        pct: Number(g.pct) || 0,
        color,
        // Bậc nhạt cần chữ đen, bậc đậm cần chữ trắng.
        ink: labelInk(color),
      };
    });

  if (bars.length === 0) return [];

  return [
    {
      key: "total",
      label: "Tổng",
      value: total,
      ty: Math.round(total / 1e9),
      pct: total > 0 ? 100 : 0,
      color: TOTAL_COLOR,
      ink: labelInk(TOTAL_COLOR),
    },
    ...bars,
  ];
}
