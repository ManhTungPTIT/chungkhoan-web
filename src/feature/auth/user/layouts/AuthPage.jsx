import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import "../styles/auth.scss";

const logoImages = Object.values(
  import.meta.glob("../../../../assets/logo_*.{png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  })
);

export default function AuthPage({ initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab);
  const [heroImageIndex, setHeroImageIndex] = useState(3);
  const [previousHeroImageIndex, setPreviousHeroImageIndex] = useState(null);
  const navigate = useNavigate();
  const heroImage = logoImages[heroImageIndex];
  const previousHeroImage =
    previousHeroImageIndex === null ? null : logoImages[previousHeroImageIndex];

  useEffect(() => {
    if (logoImages.length <= 1) return undefined;

    console.log(logoImages)
    const timer = window.setInterval(() => {
      setHeroImageIndex((index) => {
        setPreviousHeroImageIndex(index);
        return (index + 1) % logoImages.length;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (previousHeroImageIndex === null) return undefined;

    const timer = window.setTimeout(() => {
      setPreviousHeroImageIndex(null);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [previousHeroImageIndex]);

  // Đổi tab đồng thời đổi URL để vẫn bookmark được /login hoặc /register
  const switchTab = (next) => {
    setTab(next);
    navigate(next === "register" ? "/register" : "/login", { replace: true });
  };

  return (
    <div className="auth-page">
      <aside className="auth-hero">
        {previousHeroImage ? (
          <img
            key={`previous-${previousHeroImageIndex}`}
            className="auth-hero-slide auth-hero-slide--exit"
            src={previousHeroImage}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        {heroImage ? (
          <img
            key={heroImage}
            className="auth-hero-slide auth-hero-slide--enter"
            src={heroImage}
            alt=""
            aria-hidden="true"
          />
        ) : null}
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
