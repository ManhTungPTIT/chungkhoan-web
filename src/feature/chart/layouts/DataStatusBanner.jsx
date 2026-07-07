// Cảnh báo khi poll dữ liệu 5s thất bại (backend :8000 chết, mất mạng...).
// Không có banner này lỗi hoàn toàn im lặng: react-query giữ nến cũ
// (keepPreviousData/gcTime) nên chart trông như "đứng hình" không rõ lý do.
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
