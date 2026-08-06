import { useEffect } from "react";

import { useMe } from "./useMe";
import { persistStoredUser, readStoredUser } from "../untils/userStore";

/**
 * Hồ sơ người dùng cho các màn tài khoản.
 *
 * Nguồn chuẩn là API `/user/me`; localStorage chỉ để lấp chỗ trống trong lúc request chưa
 * về hoặc khi nó lỗi — nhờ vậy mở trang không nháy khung rỗng, và mất mạng vẫn xem được
 * thông tin cũ.
 *
 * Gọi được ở nhiều component cùng lúc mà chỉ tốn một request: `useMe` dùng queryKey tĩnh
 * `["me"]` nên React Query gộp chung. Đừng đổi nó thành key động.
 */
export function useAccountUser() {
  const { data: apiUser, isLoading, isError } = useMe();
  const user = apiUser ?? readStoredUser();

  // Đồng bộ ngược về localStorage để những nơi đọc thẳng store (MainLayout, guard route)
  // không hiển thị dữ liệu cũ hơn màn này.
  useEffect(() => {
    if (apiUser) persistStoredUser(apiUser);
  }, [apiUser]);

  return { user, isLoading, isError };
}
