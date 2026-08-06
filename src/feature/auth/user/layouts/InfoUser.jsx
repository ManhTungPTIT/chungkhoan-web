import { useState } from "react";
import { FiUser, FiKey, FiPackage } from "react-icons/fi";

import ProfileForm from "../components/ProfileForm";
import PasswordForm from "../components/PasswordForm";
import PackageForm from "../components/PackageForm";
import { useAccountUser } from "../hooks/useAccountUser";
import "../styles/infoUser.scss";

/**
 * Trang tài khoản của bản WEB: ba tab ngang.
 *
 * Bản app không dùng file này — nó đi qua hub danh sách `AccountMenu` + ba route con
 * (xem routes/AppRoute.jsx). Hai khung khác nhau nhưng THÂN của ba tab là chung: mọi logic
 * form nằm trong `../components/`, ở đây chỉ còn việc chọn tab.
 *
 * Cũng vì thế trang này không còn nút Đăng xuất: nút đó trước kia bọc trong cờ IS_APP để
 * bù cho việc bản app không có sidebar, nay đã chuyển hẳn sang AccountMenu.
 */
export default function InfoUser() {
  const [tab, setTab] = useState("info");
  const { user, isLoading, isError } = useAccountUser();

  // Chưa có dữ liệu nào (cả cache lẫn API) mà API đang tải → hiện trạng thái tải.
  if (!user && isLoading) {
    return (
      <div className="info-user">
        <div className="iu-state">Đang tải thông tin tài khoản…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="info-user">
        <div className="iu-state iu-state--error">
          Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }

  return (
    <div className="info-user">
      {isError && (
        <div className="iu-msg iu-msg--error">
          Không tải được dữ liệu mới nhất — đang hiển thị thông tin đã lưu.
        </div>
      )}

      <div className="iu-tabs">
        <button
          className={tab === "info" ? "is-active" : ""}
          onClick={() => setTab("info")}
        >
          <FiUser /> Thông tin Tài khoản
        </button>
        <button
          className={tab === "password" ? "is-active" : ""}
          onClick={() => setTab("password")}
        >
          <FiKey /> Đổi mật khẩu
        </button>
        {user.role !== "admin" && (
          <button
            className={tab === "package" ? "is-active" : ""}
            onClick={() => setTab("package")}
          >
            <FiPackage /> Gói đăng ký
          </button>
        )}
      </div>

      {tab === "info" && <ProfileForm />}
      {tab === "package" && user.role !== "admin" && <PackageForm />}
      {tab === "password" && <PasswordForm />}
    </div>
  );
}
