import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiActivity,
  FiBell,
  FiShield,
  FiTarget,
} from "react-icons/fi";
import { GiLion } from "react-icons/gi";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import "../styles/auth.scss";

export default function AuthPage({ initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab);
  const navigate = useNavigate();

  // Đổi tab đồng thời đổi URL để vẫn bookmark được /login hoặc /register
  const switchTab = (next) => {
    setTab(next);
    navigate(next === "register" ? "/register" : "/login", { replace: true });
  };

  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <div className="auth-brand">
        </div>

       
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={tab === "login" ? "is-active" : ""}
              onClick={() => switchTab("login")}
            >
              Đăng nhập
            </button>
            <button
              className={tab === "register" ? "is-active" : ""}
              onClick={() => switchTab("register")}
            >
              Đăng ký
            </button>
          </div>

          {tab === "login" ? (
            <LoginForm onSwitchTab={switchTab} />
          ) : (
            <RegisterForm onSwitchTab={switchTab} />
          )}
        </div>
      </main>
    </div>
  );
}
