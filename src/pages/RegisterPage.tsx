import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useApp, useTranslate } from "../context/AppContext";

const CURRENT_USER_KEY = "style-transfer-current-user";

function readStoredCurrentUser() {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, register } = useApp();
  const { t } = useTranslate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  useEffect(() => {
    if (currentUser || readStoredCurrentUser()) {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate]);

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

    if (!username.trim() || !password || !confirmPassword) {
      setUsernameError("");
      setToastVariant("error");
      setToastMessage(t("authEmpty"));
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 7) {
      setUsernameError(t("authUsernameLength"));
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(username.trim())) {
      setUsernameError(t("authUsernameInvalid"));
      return;
    }

    if (password !== confirmPassword) {
      setUsernameError("");
      setToastVariant("error");
      setToastMessage(t("authPasswordMismatch"));
      return;
    }

    const result = register(username, password);
    setUsernameError(
      result.ok ||
        (result.message !== t("authUsernameLength") &&
          result.message !== t("authUsernameInvalid"))
        ? ""
        : result.message,
    );
    setToastVariant(result.ok ? "success" : "error");
    setToastMessage(result.message);
    if (result.ok) {
      window.setTimeout(() => navigate("/login"), 500);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <SectionTitle
          eyebrow={t("registerEyebrow")}
          title={t("registerTitle")}
          description=""
        />
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <label>
            {t("username")}
            <input
              className={usernameError ? "field-input field-input-error" : "field-input"}
              minLength={3}
              maxLength={7}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (usernameError) {
                  setUsernameError("");
                }
              }}
            />
            {usernameError ? <span className="field-error">{usernameError}</span> : null}
          </label>
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
          <label>
            {t("confirmPassword")}
            <div className="password-input-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
              >
                {showConfirmPassword ? (
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
            {t("submitRegister")}
          </button>
        </form>
        <Link to="/login" className="subtle-link auth-link">
          {t("goLogin")}
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
