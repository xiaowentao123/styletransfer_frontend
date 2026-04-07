import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useApp, useTranslate } from "../context/AppContext";
import { clearTransferSession } from "../utils/localTransfer";

const RECENT_LOGIN_USERS_KEY = "style-transfer-recent-login-users";
const CURRENT_USER_KEY = "style-transfer-current-user";

function readRecentUsers() {
  try {
    const raw = window.localStorage.getItem(RECENT_LOGIN_USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function writeRecentUsers(users: string[]) {
  window.localStorage.setItem(RECENT_LOGIN_USERS_KEY, JSON.stringify(users.slice(0, 5)));
}

function readStoredCurrentUser() {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

export function SwitchUserPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, currentUser, logout, switchUser } = useApp();
  const { t } = useTranslate();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [recentUsers, setRecentUsers] = useState<string[]>(() => readRecentUsers());
  const [removingUsername, setRemovingUsername] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [switchingUsername, setSwitchingUsername] = useState("");
  const switchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser && !readStoredCurrentUser()) {
      navigate("/login", { replace: true, state: { from } });
    }
  }, [currentUser, from, navigate]);

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  const recentAccounts = useMemo(() => {
    const orderedUsernames = currentUser
      ? [currentUser, ...recentUsers.filter((item) => item !== currentUser)]
      : recentUsers;
    const uniqueUsernames = Array.from(new Set(orderedUsernames)).slice(0, 5);

    return uniqueUsernames
      .map((username) => accounts.find((account) => account.username === username))
      .filter((account): account is NonNullable<typeof account> => Boolean(account));
  }, [accounts, currentUser, recentUsers]);

  const handleSwitch = (username: string) => {
    if (username === currentUser || switchingUsername) {
      return;
    }

    if (!accounts.some((account) => account.username === username)) {
      setToastMessage(t("accountNotFound"));
      return;
    }

    setSwitchingUsername(username);
    setToastMessage(t("accountSwitched"));
    switchTimeoutRef.current = window.setTimeout(() => {
      const result = switchUser(username);
      if (!result.ok) {
        setToastMessage(result.message);
        setSwitchingUsername("");
        return;
      }

      const nextRecentUsers = [
        username,
        ...readRecentUsers().filter((item) => item !== username),
      ].slice(0, 5);
      writeRecentUsers(nextRecentUsers);
      setRecentUsers(nextRecentUsers);
      clearTransferSession();
      navigate("/transfer", { replace: true });
    }, 700);
  };

  const handleDeleteRecentUser = (username: string) => {
    if (username === currentUser || removingUsername) {
      return;
    }

    setRemovingUsername(username);
    window.setTimeout(() => {
      const nextRecentUsers = recentUsers.filter((item) => item !== username);
      setRecentUsers(nextRecentUsers);
      writeRecentUsers(nextRecentUsers);
      setRemovingUsername("");
    }, 260);
  };

  const handleAccountKeyDown = (event: KeyboardEvent<HTMLDivElement>, username: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSwitch(username);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-card switch-user-card">
        <button
          type="button"
          className="switch-user-back"
          disabled={Boolean(switchingUsername)}
          onClick={() => navigate(from)}
        >
          {t("back")}
        </button>
        <SectionTitle
          eyebrow={t("switchUserEyebrow")}
          title={t("switchUserTitle")}
          description={t("switchUserDescription")}
        />

        <div className="switch-account-list">
          <div className="switch-account-scroll">
            {recentAccounts.map((account) => {
              const isCurrent = account.username === currentUser;
              const isPendingSwitch = switchingUsername === account.username;
              const shouldHighlight = switchingUsername ? isPendingSwitch : isCurrent;
              return (
                <div
                  key={account.username}
                  className={
                    [
                      "switch-account",
                      shouldHighlight ? "switch-account-active" : "",
                      isPendingSwitch ? "switch-account-switching" : "",
                      removingUsername === account.username ? "switch-account-removing" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSwitch(account.username)}
                  onKeyDown={(event) => handleAccountKeyDown(event, account.username)}
                >
                  <img
                    className="switch-account-avatar"
                    src={account.profile.avatar}
                    alt={account.profile.displayName || account.username}
                  />
                  <span className="switch-account-main">
                    <strong>{account.profile.displayName || account.username}</strong>
                    <span>{account.username}</span>
                  </span>
                  {shouldHighlight ? <em>{t("currentAccount")}</em> : null}
                  {!isCurrent ? (
                    <button
                      type="button"
                      className="switch-account-delete"
                      disabled={Boolean(switchingUsername)}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteRecentUser(account.username);
                      }}
                      aria-label={t("delete")}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M6 6l8 8M14 6l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="ghost-btn full-width switch-login-other"
          disabled={Boolean(switchingUsername)}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          {t("loginOtherAccount")}
        </button>
      </div>
      {switchingUsername ? <div className="switch-user-lock" aria-hidden="true" /> : null}
      {toastMessage ? (
        <div className="toast toast-success" role="status" aria-live="polite">
          <div className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
