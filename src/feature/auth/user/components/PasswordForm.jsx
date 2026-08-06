import { useState } from "react";

import { useChangePassword } from "../hooks/useChangePassword";

/**
 * Form đổi mật khẩu. Dùng chung web (tab) và app (màn /info/password).
 *
 * Kiểm tra phía FE chỉ để bắt lỗi rẻ tiền trước khi tốn một vòng mạng; mật khẩu hiện tại
 * đúng hay sai thì chỉ server biết, lỗi đó về qua `onError`.
 */
export default function PasswordForm() {
  const changePassword = useChangePassword();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const setPwField = (key) => (e) => {
    setPwForm((p) => ({ ...p, [key]: e.target.value }));
    setPwError("");
    setPwSaved(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const { current, next, confirm } = pwForm;

    if (!current || !next || !confirm) {
      setPwError("Vui lòng nhập đầy đủ các trường");
      return;
    }
    if (next.length < 6) {
      setPwError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (next !== confirm) {
      setPwError("Xác nhận mật khẩu không khớp");
      return;
    }
    if (next === current) {
      setPwError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setPwError("");
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setPwSaved(true);
          setPwForm({ current: "", next: "", confirm: "" });
        },
        onError: (err) => {
          setPwError(
            err?.response?.data?.message ||
              "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.",
          );
        },
      },
    );
  };

  return (
    <form className="iu-card iu-form" onSubmit={handleChangePassword}>
      <h3 className="iu-form__title">Đổi mật khẩu</h3>

      <div className="iu-field">
        <label>
          Mật khẩu hiện tại <span className="req">*</span>
        </label>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu hiện tại của bạn"
          value={pwForm.current}
          onChange={setPwField("current")}
        />
      </div>

      <div className="iu-grid">
        <div className="iu-field">
          <label>
            Mật khẩu mới <span className="req">*</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nhập mật khẩu mới"
            value={pwForm.next}
            onChange={setPwField("next")}
          />
        </div>
        <div className="iu-field">
          <label>
            Xác nhận mật khẩu <span className="req">*</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            value={pwForm.confirm}
            onChange={setPwField("confirm")}
          />
        </div>
      </div>

      {pwError && <div className="iu-msg iu-msg--error">{pwError}</div>}
      {pwSaved && <div className="iu-msg iu-msg--ok">Đổi mật khẩu thành công.</div>}

      <div className="iu-form__foot">
        <button
          type="submit"
          className="iu-btn iu-btn--primary"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
