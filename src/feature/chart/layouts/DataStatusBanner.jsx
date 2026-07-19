// Cảnh báo khi mất nguồn dữ liệu: /intraday lỗi (backend :8000 chết, mất
// mạng...) hoặc WS /ws/quotes mất kết nối liên tục ≥5s. Không có banner này
// lỗi hoàn toàn im lặng: react-query giữ nến cũ (keepPreviousData/gcTime)
// nên chart trông như "đứng hình" không rõ lý do.
export default function DataStatusBanner({ isError, hasData }) {
  if (!isError) return null;
  return (
    <div className="chart-data-error" role="alert">
      {hasData
        ? "Mất kết nối máy chủ dữ liệu — chart đang hiển thị dữ liệu cũ"
        : "Không kết nối được máy chủ dữ liệu"}
    </div>
  );
}
