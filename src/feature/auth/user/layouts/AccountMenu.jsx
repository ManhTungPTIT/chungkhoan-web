import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiChevronRight,
  FiKey,
  FiPackage,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { IoLogOutOutline } from "react-icons/io5";

import { LoginUserService } from "../services/loginUserService";
import { useAccountUser } from "../hooks/useAccountUser";
import "../styles/accountMenu.scss";

/**
 * Hub tài khoản của bản APP: một danh sách, mỗi dòng mở một màn con thật (/info/*).
 *
 * Vì sao là route con chứ không phải đổi view tại chỗ: Capacitor để nút Back cứng của
 * Android lùi lịch sử WebView. Có route con thì Back tự quay về hub, không phải viết gì;
 * đổi view bằng state thì Back sẽ THOÁT APP ngay từ màn con.
 *
 * Bản web không dùng file này — nó vẫn là ba tab ngang trong InfoUser.
 */
const ITEMS = [
  { key: "profile", label: "Thông tin cá nhân", Icon: FiUser, path: "/info/profile" },
  { key: "password", label: "Đổi mật khẩu", Icon: FiKey, path: "/info/password" },
  {
    key: "package",
    label: "Gói đăng ký",
    Icon: FiPackage,
    path: "/info/package",
    // Admin không mua gói — giống hệt cách bản web ẩn tab này.
    hideForAdmin: true,
  },
  // Hai văn bản pháp lý. Route của chúng công khai (không guard) nên cùng đường dẫn này
  // mở được từ trình duyệt ngoài — chính là URL nộp cho Google Play.
  {
    key: "privacy",
    label: "Chính sách quyền riêng tư",
    Icon: FiShield,
    path: "/legal/privacy",
  },
  {
    key: "disclaimer",
    label: "Miễn trừ đầu tư",
    Icon: FiAlertCircle,
    path: "/legal/disclaimer",
  },
];

export default function AccountMenu() {
  const navigate = useNavigate();
  const { user, isLoading } = useAccountUser();
  const { logout } = LoginUserService();

  const avatarChar = useMemo(
    () => (user?.fullName || "U").trim().charAt(0).toUpperCase(),
    [user],
  );

  // Chuyển trang TRƯỚC rồi mới thu hồi token: service tự xoá token và điều hướng kể cả khi
  // API lỗi, nên gọi ngược lại sẽ có một nhịp màn hình trống.
  const handleLogout = () => {
    navigate("/login");
    logout();
  };

  if (!user && isLoading) {
    return (
      <div className="acc">
        <div className="acc-state">Đang tải thông tin tài khoản…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="acc">
        <div className="acc-state acc-state--error">
          Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }

  const items = ITEMS.filter((item) => !(item.hideForAdmin && user.role === "admin"));

  return (
    <div className="acc">
      <header className="acc-head">
        {user.avatarUrl ? (
          <img className="acc-avatar acc-avatar--img" src={user.avatarUrl} alt="" />
        ) : (
          <div className="acc-avatar" aria-hidden="true">
            {avatarChar}
          </div>
        )}
        <div className="acc-head__text">
          <div className="acc-head__name">{user.fullName || "Người dùng"}</div>
          <div className="acc-head__sub">
            {user.email || user.phoneNumber || "Chưa cập nhật liên hệ"}
          </div>
        </div>
      </header>

      <nav className="acc-list" aria-label="Mục tài khoản">
        {items.map(({ key, label, Icon, path }) => (
          <button
            key={key}
            type="button"
            className="acc-row"
            onClick={() => navigate(path)}
          >
            <Icon className="acc-row__icon" aria-hidden="true" />
            <span className="acc-row__label">{label}</span>
            <FiChevronRight className="acc-row__chevron" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <button type="button" className="acc-logout" onClick={handleLogout}>
        <IoLogOutOutline aria-hidden="true" /> Đăng xuất
      </button>
    </div>
  );
}
