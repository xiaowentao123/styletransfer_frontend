import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useApp, useTranslate } from "../context/AppContext";
import { presetStyles } from "../data/mock";
import { presetImageMap } from "../assets/presetImages";
import contentImage from "../assets/contentImage.png";
import styleImage from "../assets/styleImage.png";
import stylizedImage from "../assets/stylizedImage.jpg";

export function HomePage() {
  const { currentUser } = useApp();
  const { t, styleDescription, styleName } = useTranslate();
  const presetCardRef = useRef<HTMLElement | null>(null);
  const [introReady, setIntroReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroReady(true);
    }, 40);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      const element = presetCardRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const start = viewportHeight * 0.9;
      const end = viewportHeight * 0.28;
      const rawProgress = (start - rect.top) / (start - end);
      const nextProgress = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(nextProgress);
    };

    const handleScroll = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const easedProgress = 1 - Math.pow(1 - scrollProgress, 2.2);
  const heroProgress = scrollProgress * 0.9;

  const heroStyle = {
    "--roll-offset": `${heroProgress * 24}px`,
    "--roll-scale": `${1 - heroProgress * 0.018}`,
    "--roll-shadow-strength": `${0.08 + heroProgress * 0.04}`,
  } as CSSProperties;

  const presetStyle = {
    "--roll-offset": `${12 + (1 - easedProgress) * 44}px`,
    "--roll-scale": `${0.93 + easedProgress * 0.07}`,
    "--roll-shadow-strength": `${0.08 + easedProgress * 0.1}`,
  } as CSSProperties;

  return (
    <div className="page-stack home-roll-stack">
      <section
        className={
          introReady
            ? "hero-card home-roll-card home-roll-card-top home-roll-card-visible"
            : "hero-card home-roll-card home-roll-card-top"
        }
        style={heroStyle}
      >
        <div className="hero-copy">
          <h1>{t("homeTitle")}</h1>
          <p>{t("homeDescription")}</p>
          <div className="hero-actions">
            <Link to="/transfer" className="primary-btn">
              {t("homeStart")}
              <span className="button-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 14 14 6M8 6h6v6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
            {currentUser ? (
              <Link to="/history" className="ghost-btn">
                {t("homeHistory")}
                <span className="button-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 5.5h10M5 10h10M5 14.5h7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </Link>
            ) : null}
          </div>
        </div>
        <div className="hero-preview">
          <div className="preview-column">
            <span>{t("homeContent")}</span>
            <img className="art-card hero-image-card" src={contentImage} alt={t("homeContent")} />
          </div>
          <div className="preview-column">
            <span>{t("homeStyle")}</span>
            <img className="art-card hero-image-card" src={styleImage} alt={t("homeStyle")} />
          </div>
          <div className="preview-column">
            <span>{t("homeResult")}</span>
            <img className="art-card hero-image-card" src={stylizedImage} alt={t("homeResult")} />
          </div>
        </div>
      </section>

      <section
        ref={presetCardRef}
        className={
          introReady
            ? "panel home-roll-card home-roll-card-bottom home-roll-card-visible home-roll-card-delayed"
            : "panel home-roll-card home-roll-card-bottom"
        }
        style={presetStyle}
      >
        <SectionTitle
          eyebrow={t("presetEyebrow")}
          title={t("presetTitle")}
          description=""
        />
        <div className="preset-grid">
          {presetStyles.map((style) => (
            <div key={style.id} className="preset-card static-card">
              <img
                className="preset-thumb preset-thumb-image"
                src={presetImageMap[style.nameKey]}
                alt={styleName(style.nameKey)}
              />
              <div className="preset-meta">
                <strong>{styleName(style.nameKey)}</strong>
                <p>{styleDescription(style.nameKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
