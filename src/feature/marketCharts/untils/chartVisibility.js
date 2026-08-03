// Lưu lựa chọn "biểu đồ nào được hiện" của trang /chart/market vào localStorage.
//
// Lưu DANH SÁCH ID BỊ ẨN chứ không lưu danh sách id được hiện: mặc định của
// tính năng là hiện hết, nên biểu đồ mới thêm vào MARKET_CHARTS sau này (chưa
// từng có trong storage của người dùng cũ) tự động hiện, không phải đi migrate.
import { MARKET_CHARTS } from "./chartList";

export const CHART_VISIBILITY_STORAGE_KEY = "marketCharts.visibility.v1";

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/** Map { id: true } cho mọi biểu đồ — trạng thái mặc định của trang. */
export function buildDefaultVisibility(charts = MARKET_CHARTS) {
  return charts.reduce((visible, chart) => {
    visible[chart.id] = true;
    return visible;
  }, {});
}

/**
 * Đọc trạng thái hiện/ẩn. Mọi lỗi (không có storage, JSON hỏng, schema lạ) đều
 * rơi về "hiện hết" — hỏng dữ liệu không được phép làm trang trắng.
 */
export function loadChartVisibility(storage, charts = MARKET_CHARTS) {
  const visible = buildDefaultVisibility(charts);

  try {
    const stored = resolveStorage(storage)?.getItem(CHART_VISIBILITY_STORAGE_KEY);
    if (!stored) return visible;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed?.hidden)) return visible;

    // Id không còn trong danh sách thì bỏ qua — biểu đồ đã bị xoá khỏi trang.
    parsed.hidden.forEach((id) => {
      if (id in visible) visible[id] = false;
    });
  } catch {
    return buildDefaultVisibility(charts);
  }

  return visible;
}

export function saveChartVisibility(visible, storage, charts = MARKET_CHARTS) {
  const hidden = charts.map((chart) => chart.id).filter((id) => visible[id] === false);

  try {
    resolveStorage(storage)?.setItem(
      CHART_VISIBILITY_STORAGE_KEY,
      JSON.stringify({ hidden }),
    );
  } catch {
    // localStorage có thể bị chặn (chế độ ẩn danh, iframe hạn chế) — bỏ qua,
    // lựa chọn vẫn có tác dụng trong phiên đang xem.
  }
}
