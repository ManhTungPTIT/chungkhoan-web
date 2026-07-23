import { assignSectorColors, labelInk } from "../../../untils/sectorColors";

/**
 * Dựng dữ liệu treemap "dòng tiền giao dịch thỏa thuận" theo MÃ.
 *
 * Input là payload của GET /api/python/put-through (BE đã gom theo mã, lọc mã
 * cổ phiếu + ngưỡng giá trị, sort giảm dần):
 *   [{ symbol, exchange, value, volume, deal_count, group, icb_code }]
 *
 * Nhãn ô = "MÃ <giá trị tỷ>" (VJC 861) như bản mẫu, nên value quy về tỷ đồng
 * làm tròn số nguyên. Diện tích ô vẫn dùng value THÔ để ô không lệch vì làm tròn.
 */
export function buildPutThrough(rows, dark = false) {
  if (!Array.isArray(rows)) return { items: [], total: 0 };

  const valid = rows
    .filter((r) => r && r.symbol && Number(r.value) > 0)
    // BE đã sort nhưng treemap squarified phụ thuộc thứ tự input, và bảng màu
    // cũng cần thứ tự giảm dần để mã lớn giữ màu chuẩn của ngành.
    .sort((a, b) => Number(b.value) - Number(a.value));

  // Nhiều mã cùng ngành → cùng một màu.
  const colors = assignSectorColors(
    valid.map((r) => ({ icb_code: r.icb_code, name: r.group })),
    dark,
  );

  const items = valid
    .map((r) => {
      const value = Number(r.value);
      const color = colors.get(String(r.icb_code || r.group || ""));
      return {
        symbol: r.symbol,
        group: r.group || "",
        icb_code: String(r.icb_code ?? ""),
        exchange: r.exchange || "",
        value,
        ty: Math.round(value / 1e9),
        volume: Number(r.volume) || 0,
        dealCount: Number(r.deal_count) || 0,
        color,
        ink: labelInk(color),
      };
    });

  const total = items.reduce((sum, s) => sum + s.value, 0);
  return { items, total };
}

// Node treemap 1 cấp. Nhãn ghép sẵn ở đây để formatter của ECharts chỉ việc đọc.
export function toEchartsData(items) {
  return items.map((s) => ({
    name: s.symbol,
    value: s.value,
    _label: `${s.symbol} ${s.ty}`,
    _ty: s.ty,
    _group: s.group,
    _volume: s.volume,
    _deals: s.dealCount,
    itemStyle: { color: s.color },
    label: { color: s.ink },
  }));
}

// Khối lượng cổ phiếu → chuỗi gọn cho tooltip/bảng.
export function fmtVolume(volume) {
  return volume.toLocaleString("vi-VN");
}
