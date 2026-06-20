import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginUserService } from "../services/loginUserService";
import { buildAccountPayload } from "../untils/accountType";
import { mapLoginError } from "../untils/loginError";
import "../styles/authImage.scss";

// Bật true để thấy viền các ô khi căn vị trí theo ảnh, căn xong đổi lại false.
const DEBUG = true;

export default function AuthImage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const { login } = LoginUserService();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account.trim() || !password.trim()) return;
    try {
      await login(
        { ...buildAccountPayload(account), password: password.trim() },
        remember,
      );
      navigate("/");
    } catch (err) {
      alert(mapLoginError(err.response?.data?.message));
    }
  };

  return (
    <div className="auth-image-page">
      <form
        className={`auth-image-frame ${DEBUG ? "debug" : ""}`}
        onSubmit={handleSubmit}
      >
        {/* Ô tài khoản */}
        <input
          className="ov ov-account"
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        {/* Ô mật khẩu */}
        <input
          className="ov ov-password"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {/* Nút con mắt hiện/ẩn mật khẩu */}
        <button
          type="button"
          className="ov ov-eye"
          onClick={() => setShowPw((v) => !v)}
          aria-label="Hiện/ẩn mật khẩu"
        />
        {/* Checkbox ghi nhớ */}
        <button
          type="button"
          className={`ov ov-remember ${remember ? "checked" : ""}`}
          onClick={() => setRemember((v) => !v)}
          aria-label="Ghi nhớ đăng nhập"
        />
        {/* Nút đăng nhập (đè lên nút vàng trong ảnh) */}
        <button type="submit" className="ov ov-submit" aria-label="Đăng nhập" />
        {/* Link đăng ký */}
        <button
          type="button"
          className="ov ov-register"
          onClick={() => navigate("/register")}
          aria-label="Đăng ký"
        />
      </form>
    </div>
  );
}
