// Chuyển mảng top-volume từ API (/homepage/top-volume) thành cấu trúc mà
// <FlowMap> cần. API trả [{ symbol, volume, trend }]; FlowMap cần object
// { title, legends, compass, center, points, influence }.
//
// Quy ước map:
//   trend "buy"  → điểm xanh (positive),  "sell"/null → điểm đỏ (negative)
//   strength theo HẠNG khối lượng: 1/3 đầu = strong, giữa = medium, cuối = weak
//   angle rải đều quanh la bàn; radius theo strength (mạnh nằm gần tâm như mock cũ)

const RADIUS_BY_STRENGTH = { strong: 34, medium: 40, weak: 44 };

// Khối lượng cổ phiếu → chuỗi gọn: 38_900_000 → "38.9M", 12_300 → "12K"
function formatVolume(volume) {
  const v = Number(volume) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

// HẠNG (index đã sort giảm dần) → mức ảnh hưởng. total nhỏ vẫn chia 3 bậc.
function strengthByRank(index, total) {
  const third = total / 3;
  if (index < third) return "strong";
  if (index < third * 2) return "medium";
  return "weak";
}

export function buildFlowMap(rows) {
  const points = rows.map((row, index) => {
    const tone = row.trend === "buy" ? "positive" : "negative";
    const strength = strengthByRank(index, rows.length);
    return {
      symbol: row.symbol,
      value: `${tone === "positive" ? "+" : "-"}${formatVolume(row.volume)}`,
      tone,
      strength,
      angle: Math.round((360 / rows.length) * index),
      radius: RADIUS_BY_STRENGTH[strength],
    };
  });

  const totalVolume = rows.reduce((sum, r) => sum + (Number(r.volume) || 0), 0);

  const countLevel = (tone, strength) =>
    points.filter((p) => p.tone === tone && p.strength === strength).length;
  const influenceGroup = (title, tone) => ({
    title,
    tone,
    levels: [
      { label: "Mạnh", count: countLevel(tone, "strong") },
      { label: "Trung bình", count: countLevel(tone, "medium") },
      { label: "Yếu", count: countLevel(tone, "weak") },
    ],
  });

  return {
    title: "La bàn dòng tiền - top mã theo khối lượng",
    legends: [
      { label: "Mã đang mua (buy)", tone: "positive" },
      { label: "Mã đang bán (sell)", tone: "negative" },
    ],
    compass: ["N", "E", "S", "W"],
    center: {
      eyebrow: "Tổng",
      label: "Tổng khối lượng",
      value: formatVolume(totalVolume),
      unit: "CP",
    },
    points,
    influence: [
      influenceGroup("Ảnh hưởng tích cực", "positive"),
      influenceGroup("Ảnh hưởng tiêu cực", "negative"),
    ],
  };
}
