import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IoCloseCircle, IoCheckmarkCircle } from "react-icons/io5";
// Dùng lại SCSS của trang đăng nhập admin để giao diện giống hệt
import "../../admin/styles/login.scss";
import { Link, useNavigate } from "react-router-dom";

import { RegisterUserService } from "../services/registerUserService";

export default function UserRegister() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [showError, setShowError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { register } = RegisterUserService();
  const navigate = useNavigate();

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: false }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Vui lòng nhập trường này";
    if (!phone.trim()) newErrors.phone = "Vui lòng nhập trường này";
    else if (!/^\d+$/.test(phone.trim()))
      newErrors.phone = "Số điện thoại chỉ gồm chữ số";
    if (!email.trim()) newErrors.email = "Vui lòng nhập trường này";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Email không hợp lệ";
    if (!password.trim()) newErrors.password = "Vui lòng nhập trường này";
    else if (password.length < 8)
      newErrors.password = "Mật khẩu tối thiểu 8 ký tự";
    else if (!/[a-z]/.test(password))
      newErrors.password = "Cần ít nhất 1 chữ thường";
    else if (!/[A-Z]/.test(password))
      newErrors.password = "Cần ít nhất 1 chữ hoa";
    else if (!/\d/.test(password))
      newErrors.password = "Cần ít nhất 1 chữ số";
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
        email: email.trim(),
        password: password.trim(),
        phoneNumber: phone.trim(),
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
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Đăng ký</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label>Họ và tên</label>
            <input
              className={errors.fullName ? "error" : ""}
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
            />
            {errors.fullName && (
              <span className="error-msg">{errors.fullName}</span>
            )}
          </div>

          <div className="field-group">
            <label>Số điện thoại</label>
            <input
              className={errors.phone ? "error" : ""}
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
            />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}
          </div>

          <div className="field-group">
            <label>Email</label>
            <input
              className={errors.email ? "error" : ""}
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="field-group">
            <label>Mật khẩu</label>
            <div className={`password-wrap ${errors.password ? "error" : ""}`}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
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
            <label>Xác nhận mật khẩu</label>
            <div
              className={`password-wrap ${errors.confirmPassword ? "error" : ""}`}
            >
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
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>

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
            <p>Tài khoản đã được tạo. Vui lòng đăng nhập để tiếp tục.</p>
            <button onClick={() => navigate("/login")}>Đăng nhập</button>
          </div>
        </div>
      )}
    </div>
  );
}
