// Chuẩn hoá payload /sector-flow-consistency thành dữ liệu vẽ lưới nhiệt
// "ngành × phiên". Hàm thuần, không phụ thuộc React.
//
// BE đã sort sẵn theo `ratio` (TB ÷ ĐLC) nên FE KHÔNG sort lại — đổi thứ tự ở
// đây là hai đầu định nghĩa "đều đặn" khác nhau, rất khó phát hiện khi lệch.

// 5 mức màu của ô, khớp thang điểm ±100/±50/0 của BE. Điểm ngành là trung bình
// CÓ TRỌNG SỐ nên là số thực, không rơi đúng vào 5 mốc rời rạc — hai ngưỡng dưới
// đây chia lại phổ liên tục đó.
export const STRONG_AT = 50; // |điểm| từ đây trở lên là "mạnh"
export const NEUTRAL_EPS = 5; // |điểm| trong khoảng này coi như trung tính

export const CELL_BANDS = [
  { id: "in-strong", label: "Tiền vào mạnh" },
  { id: "in", label: "Tiền vào" },
  { id: "neutral", label: "Trung tính" },
  { id: "out", label: "Tiền ra" },
  { id: "out-strong", label: "Tiền ra mạnh" },
];

// Viết bằng so sánh tường minh thay vì dò mảng ngưỡng: bản dò mảng đầu tiên cho
// +50 vào "mạnh" nhưng −50 chỉ vào "tiền ra" — lệch đối xứng, và kiểu lỗi đó
// gần như vô hình trên lưới màu.
export function bandForScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return "empty";
  if (score >= STRONG_AT) return "in-strong";
  if (score > NEUTRAL_EPS) return "in";
  if (score >= -NEUTRAL_EPS) return "neutral";
  if (score > -STRONG_AT) return "out";
  return "out-strong";
}

// "2026-07-30" → "30/07". Ngày hỏng → trả nguyên chuỗi để còn debug được.
export function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  return m ? `${m[3]}/${m[2]}` : String(iso ?? "");
}

export function buildConsistencyView(data, topN = 0) {
  const dates = Array.isArray(data?.dates) ? data.dates : [];
  const allRows = Array.isArray(data?.rows) ? data.rows : [];
  const visible = topN > 0 ? allRows.slice(0, topN) : allRows;

  // Thang của thanh bar lấy theo |điểm| LỚN NHẤT trong đúng các dòng đang hiện.
  // Lấy theo cả rổ thì đổi "Top 15 ↔ Tất cả" là mọi thanh co lại một cách khó
  // hiểu; lấy theo dòng đang hiện thì thanh dài nhất luôn chạm mép.
  const maxAbsMa = visible.reduce(
    (max, row) => Math.max(max, Math.abs(Number(row.mean) || 0)),
    0,
  );

  const rows = visible.map((row, index) => ({
    rank: index + 1,
    group: row.group || "—",
    icbCode: row.icb_code || "",
    ratio: Number(row.ratio) || 0,
    mean: Number(row.mean) || 0,
    std: Number(row.std) || 0,
    // Thiếu lịch sử để dựng cửa sổ lùi → null, hiện "—". KHÔNG quy về 0: "không
    // biết" và "không thay đổi" là hai chuyện khác nhau.
    delta: typeof row.delta === "number" ? row.delta : null,
    maBarPct: maxAbsMa > 0 ? (Math.abs(Number(row.mean) || 0) / maxAbsMa) * 100 : 0,
    symbolCount: Number(row.symbol_count) || 0,
    positiveSessions: Number(row.positive_sessions) || 0,
    // Cắt/đệm về đúng độ dài trục ngày: BE luôn trả đủ, nhưng lưới CSS lệch một
    // ô là cả bảng trượt cột, sai lệch âm thầm và rất khó nhìn ra.
    cells: dates.map((date, i) => {
      const score = Array.isArray(row.scores) ? row.scores[i] : null;
      const value = typeof score === "number" ? score : null;
      return { date, score: value, band: bandForScore(value) };
    }),
  }));

  // Vạch phân cách giữa nhóm điểm dương và nhóm điểm âm. Xếp hạng theo `ratio`
  // = mean/ĐLC với ĐLC > 0 nên dấu của ratio luôn trùng dấu mean → danh sách
  // chắc chắn dương trước âm, vạch cắt là duy nhất. Không có dòng âm (hoặc
  // không có dòng dương) → -1, component bỏ vạch.
  const lastPositiveIndex = rows.reduce(
    (last, row, index) => (row.mean > 0 ? index : last),
    -1,
  );

  return {
    dates,
    dateLabels: dates.map(shortDate),
    rows,
    total: allRows.length,
    sessions: Number(data?.sessions) || dates.length,
    maLookback: Number(data?.ma_lookback) || 0,
    dividerAfter: lastPositiveIndex < rows.length - 1 ? lastPositiveIndex : -1,
    generatedAt: data?.generated_at ?? null,
  };
}
