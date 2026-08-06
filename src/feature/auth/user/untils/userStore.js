// Đọc/ghi hồ sơ người dùng trong localStorage (store `auth-storage` của zustand persist).
//
// Tách khỏi InfoUser.jsx vì từ 06/08/2026 có ba màn cùng cần tới nó: form thông tin, form
// gói đăng ký và hub tài khoản của bản app. Để nguyên trong một layout thì hai chỗ kia
// phải import chéo vào layout — vòng phụ thuộc ngược chiều.

const STORAGE_KEY = "auth-storage";

/** Hồ sơ đã lưu, hoặc null nếu chưa có / store hỏng. */
export function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw)?.state?.user ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Ghi đè một phần hồ sơ, giữ nguyên phần còn lại của store.
 *
 * Nuốt lỗi có chủ đích: localStorage đầy hoặc bị chặn (chế độ riêng tư) không phải lý do
 * để chặn thao tác của người dùng — dữ liệu thật vẫn nằm ở server.
 */
export function persistStoredUser(patch) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = {
      ...parsed.state,
      user: { ...parsed.state?.user, ...patch },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // bỏ qua: không chặn UX nếu localStorage lỗi
  }
}

/** Ngày theo định dạng vi-VN; giá trị rỗng/không parse được đều ra "Chưa có". */
export function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
}
