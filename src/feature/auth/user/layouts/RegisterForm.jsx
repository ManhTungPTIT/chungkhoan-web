import { useState } from "react";
import { FiUser, FiAtSign, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { IoCloseCircle, IoCheckmarkCircle } from "react-icons/io5";
import { RegisterUserService } from "../services/registerUserService";
import { buildAccountPayload } from "../untils/accountType";

export default function RegisterForm({ onSwitchTab }) {
  const [fullName, setFullName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [showError, setShowError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { register } = RegisterUserService();

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: false }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Vui lòng nhập trường này";
    if (!account.trim()) newErrors.account = "Vui lòng nhập trường này";
    else if (!buildAccountPayload(account))
      newErrors.account = "Vui lòng nhập email hoặc số điện thoại hợp lệ";
    if (!password.trim()) newErrors.password = "Vui lòng nhập trường này";
    else if (password.length < 8)
      newErrors.password = "Mật khẩu tối thiểu 8 ký tự";
    else if (!/[a-z]/.test(password))
      newErrors.password = "Cần ít nhất 1 chữ thường";
    else if (!/[A-Z]/.test(password))
      newErrors.password = "Cần ít nhất 1 chữ hoa";
    else if (!/\d/.test(password)) newErrors.password = "Cần ít nhất 1 chữ số";
    else if (!/[^A-Za-z0-9]/.test(password))
      newErrors.password = "Cần ít nhất 1 ký tự đặc biệt";
    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Vui lòng nhập trường này";
    else if (confirmPassword !== password)
      newErrors.confirmPassword = "Mật khẩu nhập lại không khớp";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await register({
        fullName: fullName.trim(),
        password: password.trim(),
        ...buildAccountPayload(account),
      });
      setShowSuccess(true);
    } catch (err) {
      // Lộ lỗi thật để biết hỏng ở đâu (sai endpoint, backend từ chối, mạng...)
      console.error("Đăng ký thất bại:", err.response?.status, err.response?.data, err);
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Không thể tạo tài khoản. Vui lòng thử lại.",
      );
      setShowError(true);
    }
  };

  return (
    <>
    <div className="auth-logo"></div>
      <h3 className="auth-welcome">Tạo tài khoản</h3>
      <p className="auth-welcome-sub">Đăng ký để bắt đầu cùng LEOSTOCK</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <div className={`input-wrap ${errors.fullName ? "error" : ""}`}>
            <FiUser className="input-icon" />
            <input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
            />
          </div>
          {errors.fullName && (
            <span className="error-msg">{errors.fullName}</span>
          )}
        </div>

        <div className="field-group">
          <div className={`input-wrap ${errors.account ? "error" : ""}`}>
            <FiAtSign className="input-icon" />
            <input
              type="text"
              placeholder="Email hoặc số điện thoại"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                clearError("account");
              }}
            />
          </div>
          {errors.account && <span className="error-msg">{errors.account}</span>}
        </div>

        <div className="field-group">
          <div className={`input-wrap ${errors.password ? "error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && (
            <span className="error-msg">{errors.password}</span>
          )}
        </div>

        <div className="field-group">
          <div className={`input-wrap ${errors.confirmPassword ? "error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="error-msg">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="submit-btn">
          Đăng ký
        </button>
      </form>

      <p className="auth-switch">
        Đã có tài khoản?{" "}
        <button type="button" onClick={() => onSwitchTab("login")}>
          Đăng nhập
        </button>
      </p>

      {showError && (
        <div className="popup-overlay" onClick={() => setShowError(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <IoCloseCircle className="popup-icon" />
            <h3>Đăng ký thất bại</h3>
            <p>{serverError || "Không thể tạo tài khoản. Vui lòng thử lại."}</p>
            <button onClick={() => setShowError(false)}>Đóng</button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="popup-overlay">
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <IoCheckmarkCircle className="popup-icon success" />
            <h3>Đăng ký thành công</h3>
            <p>
              Tài khoản đã được tạo và đang chờ admin duyệt. Bạn sẽ đăng nhập
              được sau khi được duyệt.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                onSwitchTab("login");
              }}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      )}
    </>
  );
}
