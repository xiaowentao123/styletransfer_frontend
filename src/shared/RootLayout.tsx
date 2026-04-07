import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp, useTranslate } from "../context/AppContext";

export function RootLayout() {
  const { currentUser, currentProfile, logout, language, setLanguage, theme, toggleTheme } =
    useApp();
  const { t } = useTranslate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { to: "/", label: t("navHome"), end: true },
    { to: "/transfer", label: t("navTransfer") },
  ];

  const userLabel = currentProfile?.displayName || currentUser || t("guestName");
  const userAvatar = currentProfile?.avatar ?? "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-kicker">{t("appKicker")}</span>
          <NavLink to="/" className="brand-name">
            {t("appTitle")}
          </NavLink>
        </div>

        <div className="topbar-actions">
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="toolbar">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              <span className="theme-toggle-icon" aria-hidden="true">
                {theme === "light" ? (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 3.5v2.1M10 14.4v2.1M15.3 10h2.2M2.5 10h2.2M14.7 5.3l1.5-1.5M3.8 16.2l1.5-1.5M14.7 14.7l1.5 1.5M3.8 3.8l1.5 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M14.8 12.7A6.5 6.5 0 0 1 7.3 5.2a6.7 6.7 0 1 0 7.5 7.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>

            <div className="language-switch" aria-label={t("langLabel")}>
              <button
                type="button"
                className={language === "zh" ? "chip chip-active" : "chip"}
                onClick={() => setLanguage("zh")}
              >
                {t("langZh")}
              </button>
              <button
                type="button"
                className={language === "en" ? "chip chip-active" : "chip"}
                onClick={() => setLanguage("en")}
              >
                {t("langEn")}
              </button>
            </div>

            {currentUser ? (
              <div className="user-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="user-pill user-menu-trigger"
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <span>{userLabel}</span>
                  <img className="user-pill-avatar" src={userAvatar} alt={userLabel} />
                </button>
                {menuOpen ? (
                  <div className="user-menu" aria-label={t("menuTitle")}>
                    <NavLink
                      to="/profile"
                      className="user-menu-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="menu-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <path
                            d="M4 16.5c1.2-2.4 3.2-3.5 6-3.5s4.8 1.1 6 3.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      {t("navProfile")}
                    </NavLink>
                    <NavLink
                      to="/history"
                      className="user-menu-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="menu-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d="M5 4.5h10M5 10h10M5 15.5h7"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      {t("navHistory")}
                    </NavLink>
                    <NavLink
                      to="/switch-user"
                      state={{ from: `${location.pathname}${location.search}` }}
                      className="user-menu-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="menu-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d="M7 6.5h7M11.5 3 15 6.5 11.5 10M13 13.5H6M8.5 10 5 13.5 8.5 17"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {t("navSwitchUser")}
                    </NavLink>
                    <button
                      type="button"
                      className="user-menu-link user-menu-button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                    >
                      <span className="menu-item-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d="M8 5.5H5.5A1.5 1.5 0 0 0 4 7v6a1.5 1.5 0 0 0 1.5 1.5H8"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M11 13.5 15 10l-4-3.5M15 10H8"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {t("navLogout")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <NavLink to="/login" className="nav-link nav-link-solid">
                  {t("navLogin")}
                </NavLink>
                <NavLink to="/register" className="ghost-btn">
                  {t("navRegister")}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
