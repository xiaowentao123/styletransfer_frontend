import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useApp, useTranslate } from "../context/AppContext";

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentProfile, currentUser, updateProfile, changePassword, logout } = useApp();
  const { t } = useTranslate();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bio, setBio] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    setAvatar(currentProfile?.avatar ?? "");
    setDisplayName(currentProfile?.displayName ?? "");
    setEmail(currentProfile?.email ?? "");
    setBio(currentProfile?.bio ?? "");
  }, [currentProfile]);

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

    const nextEmail = email.trim();
    if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailError(t("profileInvalidEmail"));
      return;
    }

    const result = updateProfile({ displayName, email, bio, avatar });
    setEmailError(result.ok || result.message !== t("profileInvalidEmail") ? "" : result.message);
    setToastVariant(result.ok ? "success" : "error");
    setToastMessage(result.message);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setToastVariant("error");
      setToastMessage(t("authEmpty"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToastVariant("error");
      setToastMessage(t("authPasswordMismatch"));
      return;
    }

    const result = changePassword(currentPassword, newPassword);
    setToastVariant(result.ok ? "success" : "error");
    setToastMessage(result.message);

    if (result.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordForm(false);
      window.setTimeout(() => {
        logout();
        navigate("/login");
      }, 500);
    }
  };

  if (!currentUser) {
    return (
      <div className="page-stack">
        <SectionTitle
          eyebrow={t("profileEyebrow")}
          title={t("profileTitle")}
          description=""
        />
        <div className="panel empty-card">
          <p>{t("profileNeedLogin")}</p>
          <Link to="/login" className="primary-btn">
            {t("goLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <SectionTitle
          eyebrow={t("profileEyebrow")}
          title={t("profileTitle")}
          description=""
        />
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="profile-avatar-block">
            <button
              type="button"
              className="profile-avatar-button"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img className="profile-avatar-image" src={avatar} alt={currentUser} />
              <span className="profile-avatar-camera" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6.4 6.5 7.4 5h5.2l1 1.5H15A1.5 1.5 0 0 1 16.5 8v6A1.5 1.5 0 0 1 15 15.5H5A1.5 1.5 0 0 1 3.5 14V8A1.5 1.5 0 0 1 5 6.5h1.4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10.5" r="2.7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </button>
            <input
              ref={avatarInputRef}
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
            />
          </div>
          <label>
            {t("username")}
            <input value={currentUser} disabled />
          </label>
          <label>
            {t("displayName")}
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label>
            {t("email")}
            <input
              className={emailError ? "field-input field-input-error" : "field-input"}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) {
                  setEmailError("");
                }
              }}
            />
            {emailError ? <span className="field-error">{emailError}</span> : null}
          </label>
          <label>
            {t("bio")}
            <textarea
              className="profile-textarea"
              maxLength={500}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-btn full-width">
            {t("saveProfile")}
          </button>
        </form>
        {!showPasswordForm ? (
          <button
            type="button"
            className="ghost-btn full-width profile-password-trigger"
            onClick={() => setShowPasswordForm(true)}
          >
            {t("changePassword")}
          </button>
        ) : null}
        {showPasswordForm ? (
          <form className="auth-form profile-password-form" onSubmit={handlePasswordSubmit}>
            <label>
              {t("currentPassword")}
              <div className="password-input-wrap">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  aria-label={showCurrentPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showCurrentPassword ? (
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
              {t("newPassword")}
              <div className="password-input-wrap">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword((value) => !value)}
                  aria-label={showNewPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showNewPassword ? (
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
              {t("confirmNewPassword")}
              <div className="password-input-wrap">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmNewPassword((value) => !value)}
                  aria-label={showConfirmNewPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showConfirmNewPassword ? (
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
              {t("confirmChangePassword")}
            </button>
          </form>
        ) : null}
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
