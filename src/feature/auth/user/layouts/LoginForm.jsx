import { useState } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LoginUserService } from "../services/loginUserService";
import { mapLoginError } from "../untils/loginError";

export default function LoginForm({ onSwitchTab }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  const { login } = LoginUserService();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!account.trim()) newErrors.account = "Vui lòng nhập trường này";
    if (!password.trim()) newErrors.password = "Vui lòng nhập trường này";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await login(
        { account: account.trim(), password: password.trim() },
        remember,
      );
      navigate("/");
    } catch (err) {
      setPopupMsg(mapLoginError(err.response?.data?.message));
      setShowPopup(true);
    }
  };

  const comingSoon = () => alert("Tính năng sắp có");

  return (
    <>
      <div className="auth-logo"></div>
      <h3 className="auth-welcome">Chào mừng trở lại!</h3>
      <p className="auth-welcome-sub">Đăng nhập để tiếp tục sử dụng LEOSTOCK</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <div className={`input-wrap ${errors.account ? "error" : ""}`}>
            <FiUser className="input-icon" />
            <input
              type="text"
              placeholder="Email, số điện thoại hoặc số tài khoản chứng khoán"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                if (errors.account) setErrors((p) => ({ ...p, account: false }));
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
                if (errors.password) setErrors((p) => ({ ...p, password: false }));
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

        <div className="auth-row">
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Ghi nhớ đăng nhập
          </label>
          <button type="button" className="auth-link" onClick={comingSoon}>
            Quên mật khẩu?
          </button>
        </div>

        <button type="submit" className="submit-btn">
          Đăng nhập
        </button>
      </form>

      <p className="auth-switch">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={() => onSwitchTab("register")}>
          Đăng ký ngay
        </button>
      </p>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <IoCloseCircle className="popup-icon" />
            <h3>Đăng nhập thất bại</h3>
            <p>{popupMsg || "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại."}</p>
            <button onClick={() => setShowPopup(false)}>Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
