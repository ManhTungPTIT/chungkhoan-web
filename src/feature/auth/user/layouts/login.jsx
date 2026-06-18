import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";
// Dùng lại SCSS của trang đăng nhập admin để giao diện giống hệt
import "../../admin/styles/login.scss";
import { Link, useNavigate } from "react-router-dom";

import { LoginUserService } from "../services/loginUserService";

export default function UserLogin() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const { login } = LoginUserService();

  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!account.trim()) newErrors.account = "Error";
    if (!password.trim()) newErrors.password = "Error";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await login({ email: account.trim(), password: password.trim() });
      navigate("/");
    } catch {
      setShowPopup(true);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Đăng nhập</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label>Email</label>
            <input
              className={errors.account ? "error" : ""}
              type="text"
              placeholder="Nhập số điện thoại hoặc email"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                if (errors.account)
                  setErrors((p) => ({ ...p, account: false }));
              }}
            />
            {errors.account && (
              <span className="error-msg">Vui lòng nhập trường này</span>
            )}
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
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: false }));
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
              <span className="error-msg">Vui lòng nhập trường này</span>
            )}
          </div>

          <button type="submit" className="submit-btn">
            Đăng nhập
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <IoCloseCircle className="popup-icon" />
            <h3>Đăng nhập thất bại</h3>
            <p>Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.</p>
            <button onClick={() => setShowPopup(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
