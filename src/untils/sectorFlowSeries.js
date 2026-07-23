import { buildPalette, labelInk } from "./sectorColors";

// Dựng series cột chồng cho hai chart "5 phiên gần nhất". Dùng chung để hai chart
// có ĐÚNG một thứ tự ngành và ĐÚNG một bảng màu — nếu tách ra mỗi chart tự tính
// thì màu/thứ tự lệch nhau và không đối chiếu được trái ↔ phải.

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Nhãn phiên "T4 22/07". Đọc theo giờ UTC chứ không theo giờ máy: mốc nến là
// 00:00 của chính ngày giao dịch, máy ở múi giờ âm sẽ lùi mất một ngày.
export function sessionLabel(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]} ${day}/${month}`;
}

// Ngưỡng hiện nhãn. Bản mẫu ghi 300 tỷ / 1,9% nhưng đó là cho biểu đồ khổ rộng;
// trong panel cao ~420px thì nhãn 10px cần khúc chiếm ít nhất ~3,5% chiều cao
// trục, dưới mức đó chữ chồng nhau. Nên ngưỡng tính theo TỶ LỆ chiều cao, kèm
// sàn tuyệt đối của bản mẫu.
export const MIN_LABEL_TY = 300;
export const MIN_LABEL_PCT = 1.9;
export const MIN_LABEL_HEIGHT_RATIO = 0.035;

// axisTop = giá trị ứng với đỉnh trục (cột cao nhất, hoặc 100 với chart tỷ trọng).
export function labelThreshold(axisTop, floor) {
  return Math.max(floor, axisTop * MIN_LABEL_HEIGHT_RATIO);
}

/**
 * payload: kết quả /sector-flow.
 *
 * Trả { labels, industries } với industries ĐÃ theo thứ tự BE trả về (tổng 5
 * phiên giảm dần) — thứ tự này phải giữ nguyên cho cả 5 cột lẫn cả 2 chart, nếu
 * mỗi cột một thứ tự thì không đọc được xu hướng.
 *
 * Màu gán theo THỨ HẠNG chứ không băm theo mã ngành: bảng màu 32 bậc xếp hue
 * chạy nhanh nhất nên hai ngành liền kề trong stack luôn khác hue.
 */
export function buildSectorFlowSeries(payload, dark = false) {
  const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
  const industries = Array.isArray(payload?.industries) ? payload.industries : [];
  if (sessions.length === 0 || industries.length === 0) {
    return { labels: [], industries: [] };
  }

  const palette = buildPalette(dark, 4);

  return {
    labels: sessions.map(sessionLabel),
    industries: industries.map((g, i) => {
      const color = palette[i % palette.length];
      const values = Array.isArray(g.values) ? g.values : [];
      const pcts = Array.isArray(g.pcts) ? g.pcts : [];
      return {
        name: g.name || "",
        icb_code: String(g.icb_code ?? ""),
        // Quy tỷ đồng ở đây để component chỉ việc vẽ.
        tys: sessions.map((_, s) => Math.round((Number(values[s]) || 0) / 1e9)),
        pcts: sessions.map((s2, s) => Number(pcts[s]) || 0),
        color,
        ink: labelInk(color),
      };
    }),
  };
}

// Thứ tự vẽ stack. ECharts xếp series ĐẦU TIÊN xuống đáy, nên muốn ngành lớn nằm
// trên đỉnh (như bản mẫu) thì phải đảo danh sách trước khi đưa vào series.
// Chú giải vẫn dùng thứ tự gốc (lớn trước) để đọc từ trên xuống.
export function stackOrder(industries) {
  return [...industries].reverse();
}
