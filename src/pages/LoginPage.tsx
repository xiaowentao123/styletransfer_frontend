import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useApp, useTranslate } from "../context/AppContext";

const RECENT_LOGIN_USERS_KEY = "style-transfer-recent-login-users";
const CURRENT_USER_KEY = "style-transfer-current-user";

function readStoredCurrentUser() {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, login } = useApp();
  const { t } = useTranslate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recentUsers, setRecentUsers] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [loginRedirecting, setLoginRedirecting] = useState(false);

  useEffect(() => {
    if (loginRedirecting) {
      return;
    }

    if (currentUser || readStoredCurrentUser()) {
      navigate("/", { replace: true });
    }
  }, [currentUser, loginRedirecting, navigate]);

  useEffect(() => {
    try {
      const savedUsers = window.localStorage.getItem(RECENT_LOGIN_USERS_KEY);
      if (!savedUsers) {
        return;
      }
      const parsed = JSON.parse(savedUsers) as unknown;
      if (Array.isArray(parsed)) {
        setRecentUsers(parsed.filter((item): item is string => typeof item === "string").slice(0, 5));
      }
    } catch {
      setRecentUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = login(username, password);
    setToastVariant(result.ok ? "success" : "error");
    setToastMessage(result.message);
    if (result.ok) {
      setLoginRedirecting(true);
      const normalizedName = username.trim();
      const nextRecentUsers = [
        normalizedName,
        ...recentUsers.filter((item) => item !== normalizedName),
      ].slice(0, 5);
      setRecentUsers(nextRecentUsers);
      window.localStorage.setItem(RECENT_LOGIN_USERS_KEY, JSON.stringify(nextRecentUsers));
      window.setTimeout(() => navigate("/transfer"), 500);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <SectionTitle
          eyebrow={t("loginEyebrow")}
          title={t("loginTitle")}
          description=""
        />
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("username")}
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          {recentUsers.length ? (
            <div className="recent-users">
              {recentUsers.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={username === item ? "recent-user-chip recent-user-chip-active" : "recent-user-chip"}
                  onClick={() => setUsername(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          <label>
            {t("password")}
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.5 3.5 16.5 16.5M8.5 8.7A2.2 2.2 0 0 0 11.3 11.5M6.2 6.3A10 10 0 0 1 10 5.5c4.2 0 6.8 4.5 6.8 4.5a12.7 12.7 0 0 1-2.7 3.1M4.1 7.9A12.6 12.6 0 0 0 3.2 10S5.8 14.5 10 14.5c.9 0 1.8-.2 2.6-.4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 5.5c4.2 0 6.8 4.5 6.8 4.5S14.2 14.5 10 14.5 3.2 10 3.2 10 5.8 5.5 10 5.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button type="submit" className="primary-btn full-width">
            {t("submitLogin")}
          </button>
        </form>
        <Link to="/register" className="subtle-link auth-link">
          {t("goRegister")}
        </Link>
      </div>
      {toastMessage ? (
        <div
          className={toastVariant === "success" ? "toast toast-success" : "toast toast-error"}
          role="status"
          aria-live="polite"
        >
          <div className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
