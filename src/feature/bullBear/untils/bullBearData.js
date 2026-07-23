// Màu 5 phe LẤY ĐÚNG bộ của marketStatus (chart "Diễn biến thị trường") để hai
// biểu đồ nói cùng một ngôn ngữ màu: kịch trần tím, kịch sàn xanh lam, tăng
// xanh lá, đứng vàng, giảm đỏ. Đổi ở đây thì phải đổi cả bên kia.
//
// Cột "Tổng" cố tình dùng xám đá chứ không phải một hue nữa: nó là số TỔNG HỢP,
// không phải phe thứ sáu, nên không được cạnh tranh màu với các phe.
export const TOTAL_COLOR = "#4a5568";

export const GROUP_COLORS = {
  bull_green: "#1d9a45",
  neutral: "#d3a719",
  bear_red: "#e53935",
  bull_purple: "#8e24aa",
  bear_floor: "#1565c0",
};

/**
 * Dựng dữ liệu cột từ payload /bull-bear.
 *
 * Cột đầu luôn là "Tổng" (100%), sau đó là 5 phe theo ĐÚNG thứ tự BE trả về —
 * thứ tự cột là cố định theo bản mẫu, tuyệt đối không sort lại theo giá trị.
 * Nhóm rỗng vẫn giữ cột (bản mẫu có "Phe Gấu Sàn" = 0).
 */
export function buildBullBear(payload) {
  const total = Number(payload?.total_value) || 0;
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];

  const bars = groups
    .filter((g) => g && g.key)
    .map((g) => {
      const value = Number(g.value) || 0;
      return {
        key: g.key,
        label: g.label || g.key,
        value,
        ty: Math.round(value / 1e9),
        pct: Number(g.pct) || 0,
        color: GROUP_COLORS[g.key] || TOTAL_COLOR,
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
    },
    ...bars,
  ];
}
