import { useState } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

import { useDeleteAccount } from "../hooks/useDeleteAccount";
import { clearTokens } from "../../admin/untils/tokenStorage";
import { goToLogin } from "../../untils/loginRedirect";

/**
 * Nút xóa tài khoản (đứng cạnh nút Cập nhật trong ProfileForm) + modal xác nhận mật khẩu.
 *
 * Dùng chung web (tab "Thông tin Tài khoản") và app (màn /info/profile).
 *
 * Modal đi qua createPortal, KHÔNG phải cho đẹp: nút này nằm trong <form> của ProfileForm,
 * mà bản thân modal cũng là một <form> — render tại chỗ sẽ thành form lồng form, HTML không
 * hợp lệ và trình duyệt tự gỡ thẻ trong.
 *
 * Đích portal là phần tử `.info-user` chứ KHÔNG phải body: mọi rule trong infoUser.scss đều
 * lồng trong `.info-user`, ra tới body là modal mất sạch style (kể cả .iu-field, .iu-msg mà
 * nó dùng lại). Portal vào một tổ tiên vẫn hợp lệ — React vẫn đi theo cây component.
 *
 * Xóa là XÓA MỀM ở BE (status = "deleted"): tài khoản không đăng nhập lại được, và định
 * danh cũ (email/SĐT/số TK) vẫn bị giữ chỗ nên cũng không đăng ký lại bằng nó được.
 */
export default function DeleteAccountButton() {
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const close = () => {
    if (deleteAccount.isPending) return; // đang gọi API thì đừng cho đóng nửa chừng
    setOpen(false);
    setPassword("");
    setError("");
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!password) {
      setError("Vui lòng nhập mật khẩu để xác nhận");
      return;
    }

    setError("");
    deleteAccount.mutate(
      { password },
      {
        // Điều hướng NGAY, không chờ gì thêm: phiên vừa bị BE thu hồi, để chậm thì nhịp
        // heartbeat 12s của useSessionGuard nhận 401 trước và đá về /login trơn — người
        // dùng mất luôn thông báo "đã xóa". Cũng vì phiên đã thu hồi nên không gọi
        // /auth/logout: chắc chắn lỗi, chỉ tốn một vòng mạng.
        onSuccess: () => {
          clearTokens();
          goToLogin("deleted");
        },
        onError: (err) => {
          setError(
            err?.response?.data?.message ||
              "Xóa tài khoản thất bại. Vui lòng kiểm tra lại mật khẩu.",
          );
        },
      },
    );
  };

  return (
    <>
      <button
        type="button"
        className="iu-btn iu-btn--danger"
        onClick={() => setOpen(true)}
      >
        Xóa tài khoản
      </button>

      {open &&
        createPortal(
          <div className="iu-modal-overlay" onClick={close}>
            <form
              className="iu-modal"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleConfirm}
            >
              <button
                type="button"
                className="iu-modal__close"
                onClick={close}
                aria-label="Đóng"
              >
                <IoClose />
              </button>

              <h3 className="iu-modal__title">Xác nhận xóa tài khoản</h3>
              <p className="iu-modal__desc">
                Sau khi xóa, bạn sẽ bị đăng xuất khỏi mọi thiết bị và không thể đăng nhập
                lại. Thao tác này không thể hoàn tác.
              </p>

              <div className="iu-field">
                <label htmlFor="delete-account-password">
                  Mật khẩu <span className="req">*</span>
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu để xác nhận"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
              </div>

              {error && <div className="iu-msg iu-msg--error">{error}</div>}

              <div className="iu-modal__foot">
                <button type="button" className="iu-btn" onClick={close}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="iu-btn iu-btn--danger"
                  disabled={deleteAccount.isPending}
                >
                  {deleteAccount.isPending ? "Đang xóa…" : "Xác nhận xóa"}
                </button>
              </div>
            </form>
          </div>,
          document.querySelector(".info-user") ?? document.body,
        )}
    </>
  );
}
