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

const FEATURES = [
  { icon: <FiActivity />, title: "Phân tích thông minh", desc: "Phân tích dòng tiền chính xác" },
  { icon: <FiTrendingUp />, title: "Dòng tiền cá mập", desc: "Cập nhật dòng tiền cá mập" },
  { icon: <FiBell />, title: "Cảnh báo sớm", desc: "Tín hiệu sớm, kịp thời" },
  { icon: <FiShield />, title: "Quản trị rủi ro", desc: "Quản trị rủi ro hiệu quả" },
  { icon: <FiTarget />, title: "Tối ưu lợi nhuận", desc: "Lợi nhuận bền vững" },
];

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
          {/* <GiLion className="auth-brand__mark" />
          <div>
            <div className="auth-brand__name">
              LEO<span>STOCK</span>
            </div>
            <span className="auth-brand__sub">Công cụ hỗ trợ nhà đầu tư</span>
          </div> */}
        </div>

        <div className="auth-tagline">
          <h2>Phân tích dòng tiền</h2>
          <div className="auth-tagline__big">TỐI ƯU LỢI NHUẬN</div>
          <h2>Vững bước đầu tư</h2>
        </div>

        <div className="auth-features">
          {FEATURES.map((f) => (
            <div className="auth-feature" key={f.title}>
              <div className="auth-feature__icon">{f.icon}</div>
              <b>{f.title}</b>
              <span>{f.desc}</span>
            </div>
          ))}
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
