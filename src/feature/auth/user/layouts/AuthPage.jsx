import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
  const [heroImageIndex, setHeroImageIndex] = useState(
    Math.min(3, Math.max(logoImages.length - 1, 0))
  );
  const [previousHeroImageIndex, setPreviousHeroImageIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState("next");
  const navigate = useNavigate();
  const heroImage = logoImages[heroImageIndex];
  const previousHeroImage =
    previousHeroImageIndex === null ? null : logoImages[previousHeroImageIndex];
  const canControlHero = logoImages.length > 1;

  const changeHeroImage = useCallback((direction) => {
    if (logoImages.length <= 1) return;

    setSlideDirection(direction);
    setHeroImageIndex((index) => {
      setPreviousHeroImageIndex(index);
      return direction === "next"
        ? (index + 1) % logoImages.length
        : (index - 1 + logoImages.length) % logoImages.length;
    });
  }, []);

  useEffect(() => {
    if (logoImages.length <= 1) return undefined;

    
    const timer = window.setInterval(() => {
      changeHeroImage("next");
    }, 8000);

    return () => window.clearInterval(timer);
  }, [changeHeroImage]);

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
            className={`auth-hero-slide auth-hero-slide--exit-${slideDirection}`}
            src={previousHeroImage}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        {heroImage ? (
          <img
            key={heroImage}
            className={`auth-hero-slide auth-hero-slide--enter-${slideDirection}`}
            src={heroImage}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        {canControlHero ? (
          <div className="auth-hero-controls" aria-label="Điều khiển ảnh giới thiệu">
            <button
              type="button"
              className="auth-hero-control"
              onClick={() => changeHeroImage("prev")}
              aria-label="Ảnh trước"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-hero-control"
              onClick={() => changeHeroImage("next")}
              aria-label="Ảnh tiếp theo"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        ) : null}
        <div className="auth-brand"></div>
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
