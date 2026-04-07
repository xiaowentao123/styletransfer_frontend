import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HistoryRecord } from "../data/mock";
import { readHistoryByUser, writeHistoryByUser } from "../utils/historyStorage";
import { clearTransferSession } from "../utils/localTransfer";

type Language = "zh" | "en";
type Theme = "light" | "dark";

type UserProfile = {
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
};

type UserRecord = {
  username: string;
  password: string;
  profile: UserProfile;
};

type AccountSummary = {
  username: string;
  profile: UserProfile;
};

type Dictionary = Record<string, string | Record<string, string>>;

type AppContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
  currentUser: string | null;
  currentProfile: UserProfile | null;
  accounts: AccountSummary[];
  register: (username: string, password: string) => { ok: boolean; message: string };
  login: (username: string, password: string) => { ok: boolean; message: string };
  switchUser: (username: string) => { ok: boolean; message: string };
  logout: () => void;
  historyRecords: HistoryRecord[];
  addHistoryRecord: (record: HistoryRecord) => void;
  deleteHistoryRecord: (recordId: string) => void;
  updateProfile: (profile: UserProfile) => { ok: boolean; message: string };
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => { ok: boolean; message: string };
};

const STORAGE_KEYS = {
  language: "style-transfer-language",
  theme: "style-transfer-theme",
  users: "style-transfer-users",
  currentUser: "style-transfer-current-user",
  historyByUser: "style-transfer-history-by-user",
};

const dictionaries: Record<Language, Dictionary> = {
  zh: {
    appTitle: "在线图像风格迁移系统",
    appKicker: "",
    navHome: "首页",
    navTransfer: "开始创作",
    navLogin: "登录",
    navRegister: "注册",
    navLogout: "退出登录",
    navHello: "当前用户：{name}",
    navProfile: "个人资料",
    navHistory: "历史记录",
    navSwitchUser: "切换用户",
    menuTitle: "账户菜单",
    langLabel: "语言",
    langZh: "中文",
    langEn: "English",
    homeEyebrow: "V1 前端原型",
    homeTitle: "让每一张图片，快速拥有专业级艺术风格表达。",
    homeDescription: "从内容图上传、风格选择到生成与下载，整套流程面向真实创作场景设计，帮助用户高效完成视觉风格化处理。",
    homeStart: "开始创作",
    homeHistory: "查看历史",
    homeContent: "内容图",
    homeStyle: "风格图",
    homeResult: "结果图",
    presetEyebrow: "预设风格",
    presetTitle: "预设风格库",
    presetDescription: "V1 保留单选风格库，并与自定义风格上传互斥。",
    transferEyebrow: "风格迁移",
    transferTitle: "风格迁移工作台",
    transferDescription: "三栏布局覆盖上传、参数、任务状态和结果预览。",
    customLayout: "自定义布局",
    saveLayout: "保存",
    cancelLayout: "取消",
    resetLayout: "重置布局",
    resetLayoutTitle: "确认重置当前布局？",
    resetLayoutDescription: "重置后会恢复为系统默认布局，当前自定义排列会被覆盖。",
    resetLayoutConfirm: "确认重置",
    uploadContentTitle: "内容图上传",
    uploadContentHint: "支持 JPG / JPEG / PNG，建议尺寸不低于 512px。",
    uploadStyleTitle: "自定义风格图",
    uploadStyleHint: "上传自定义风格后，会自动取消预设风格选中状态。",
    chooseImage: "点击选择图片",
    uploadDropHint: "点击或拖拽图片到这里上传",
    uploadInvalidType: "仅支持 JPG、JPEG、PNG 图片文件。",
    contentPreview: "内容图预览",
    stylePreview: "风格图预览",
    presetGallery: "预设风格库",
    parameters: "参数设置",
    styleStrength: "风格强度",
    outputSize: "输出尺寸",
    preserveStructure: "保留更多内容结构",
    taskStatus: "任务状态",
    taskIdle: "未开始",
    taskProcessing: "处理中",
    taskCompleted: "已完成",
    taskFailed: "失败",
    generationFailed: "生成失败",
    contentLabel: "内容图：{value}",
    styleSourceLabel: "风格来源：{value}",
    outputSizeLabel: "输出尺寸：{value}px",
    strengthLabel: "风格强度：{value}%",
    structureLabel: "结构保持：{value}",
    switchOn: "开启",
    switchOff: "关闭",
    notSelected: "未选择",
    notUploaded: "未上传",
    customStyle: "自定义风格图",
    generate: "开始生成",
    generateError: "请先上传内容图，并至少选择一种风格来源。",
    resultPreview: "结果预览",
    downloadResult: "下载结果图",
    historyEyebrow: "历史记录",
    historyTitle: "我的历史任务",
    historyDescription: "这里只展示当前登录用户的本地历史记录，不同用户之间互相隔离。",
    taskId: "任务编号：{value}",
    styleSource: "风格来源：{value}",
    loginEyebrow: "账号访问",
    loginTitle: "登录系统",
    loginDescription: "账号信息全部保存在浏览器本地，仅用于当前演示。",
    registerEyebrow: "本地账户",
    registerTitle: "注册新用户",
    registerDescription: "注册成功后即可用本地账号登录，数据不会提交到服务器。",
    username: "用户名",
    password: "密码",
    confirmPassword: "确认密码",
    submitLogin: "登录",
    submitRegister: "注册",
    switchUserEyebrow: "账号切换",
    switchUserTitle: "切换用户",
    switchUserDescription: "选择一个最近登录过的账号快速切换。",
    currentAccount: "当前账号",
    loginOtherAccount: "登录其他账号",
    back: "返回",
    accountSwitched: "已切换账号。",
    accountNotFound: "该账号不存在，请重新登录。",
    authEmpty: "请输入完整信息。",
    authPasswordMismatch: "两次输入的密码不一致。",
    authUserExists: "该用户名已存在。",
    authUsernameLength: "用户名长度需在 3 到 7 个字符之间。",
    authUsernameInvalid: "用户名只能包含字母、数字或下划线。",
    authRegisterSuccess: "注册成功，请返回登录。",
    authLoginSuccess: "登录成功。",
    authInvalid: "用户名或密码错误。",
    authNeedLogin: "建议先登录后再保存自己的创作记录。",
    goLogin: "去登录",
    goRegister: "去注册",
    noHistory: "当前用户还没有历史任务，先去创建一条记录。",
    noFilteredHistory: "没有符合条件的历史记录。",
    historySortLabel: "时间",
    historyDateFrom: "开始日期",
    historyDateTo: "结束日期",
    historyTaskIdSearch: "输入任务 ID",
    historyStatusFilter: "任务状态",
    historyStatusAll: "全部状态",
    historyPagePrevious: "上一页",
    historyPageNext: "下一页",
    historyPageSize: "每页",
    historyResetFilters: "重置筛选",
    taskIdCopied: "任务 ID 已复制。",
    datePickerClear: "清除",
    datePickerToday: "今天",
    historyDeleteTitle: "确认删除这条历史记录？",
    historyDeleteDescription: "删除后该记录将从当前用户的历史记录中移除。",
    cancel: "取消",
    delete: "删除",
    historyNeedLogin: "请先登录后再查看个人历史记录。",
    localSummary: "本地模拟生成成功，可在当前页面查看并下载。",
    untitledTask: "未命名任务",
    profileEyebrow: "个人资料",
    profileTitle: "个人资料设置",
    profileDescription: "资料信息仅保存在本地浏览器，用于区分不同用户的个人展示。",
    displayName: "显示名称",
    email: "邮箱",
    bio: "个人简介",
    saveProfile: "保存资料",
    changePassword: "修改密码",
    confirmChangePassword: "确认修改",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmNewPassword: "确认新密码",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    profileSaved: "个人资料已保存。",
    passwordChanged: "密码已修改。",
    passwordCurrentInvalid: "当前密码输入错误。",
    profileInvalidEmail: "邮箱格式不正确。",
    profileBioTooLong: "个人简介不能超过 500 字。",
    profileNeedLogin: "请先登录后再查看和编辑个人资料。",
    guestName: "未设置",
    guestPromptTitle: "登录后可保存历史记录",
    guestPromptDescription:
      "登录账号后可以保存你的生成记录、历史结果和个人资料。你也可以先继续体验，但未登录状态下不会保留历史记录。",
    continueAsGuest: "继续使用",
    styleNames: {
      ink: "水墨写意",
      impression: "印象派",
      cyber: "赛博霓虹",
      oil: "油画肌理",
    },
    styleDescriptions: {
      ink: "以留白、墨色层次和东方笔触营造更具意境的画面表达。",
      impression: "强调明亮色块和笔触感。",
      cyber: "高对比霓虹色，适合视觉展示。",
      oil: "突出厚涂感和细节层次。",
    },
  },
  en: {
    appTitle: "Style Transfer Studio",
    appKicker: "",
    navHome: "Home",
    navTransfer: "Create",
    navLogin: "Login",
    navRegister: "Register",
    navLogout: "Logout",
    navHello: "User: {name}",
    navProfile: "Profile",
    navHistory: "History",
    navSwitchUser: "Switch user",
    menuTitle: "Account menu",
    langLabel: "Language",
    langZh: "中文",
    langEn: "English",
    homeEyebrow: "V1 Frontend",
    homeTitle: "Give every image a polished artistic style in just a few clicks.",
    homeDescription: "From upload and style selection to generation and download, the full workflow is designed for real creative use cases.",
    homeStart: "Start transfer",
    homeHistory: "Open history",
    homeContent: "Content",
    homeStyle: "Style",
    homeResult: "Result",
    presetEyebrow: "Preset Styles",
    presetTitle: "Preset gallery",
    presetDescription: "V1 keeps preset selection single-choice and mutually exclusive with custom style upload.",
    transferEyebrow: "Transfer",
    transferTitle: "Transfer workspace",
    transferDescription: "A three-column layout for upload, parameters, task status, and result preview.",
    customLayout: "Custom layout",
    saveLayout: "Save",
    cancelLayout: "Cancel",
    resetLayout: "Reset layout",
    resetLayoutTitle: "Reset the current layout?",
    resetLayoutDescription: "Resetting will restore the system default layout and overwrite the current custom arrangement.",
    resetLayoutConfirm: "Reset",
    uploadContentTitle: "Content upload",
    uploadContentHint: "Supports JPG / JPEG / PNG. Recommended size is at least 512px.",
    uploadStyleTitle: "Custom style",
    uploadStyleHint: "Uploading a custom style will clear the preset selection.",
    chooseImage: "Choose an image",
    uploadDropHint: "Click or drag an image here",
    uploadInvalidType: "Only JPG, JPEG, and PNG image files are supported.",
    contentPreview: "Content preview",
    stylePreview: "Style preview",
    presetGallery: "Preset gallery",
    parameters: "Parameters",
    styleStrength: "Style strength",
    outputSize: "Output size",
    preserveStructure: "Preserve more content structure",
    taskStatus: "Task status",
    taskIdle: "Idle",
    taskProcessing: "Processing",
    taskCompleted: "Completed",
    taskFailed: "Failed",
    generationFailed: "Generation failed",
    contentLabel: "Content: {value}",
    styleSourceLabel: "Style source: {value}",
    outputSizeLabel: "Output size: {value}px",
    strengthLabel: "Strength: {value}%",
    structureLabel: "Structure keep: {value}",
    switchOn: "On",
    switchOff: "Off",
    notSelected: "Not selected",
    notUploaded: "Not uploaded",
    customStyle: "Custom style image",
    generate: "Generate",
    generateError: "Upload content and choose at least one style source first.",
    resultPreview: "Result preview",
    downloadResult: "Download result",
    historyEyebrow: "History",
    historyTitle: "My task history",
    historyDescription: "Only the current user's local history is shown here. Records are isolated per user.",
    taskId: "Task ID: {value}",
    styleSource: "Style source: {value}",
    loginEyebrow: "Access",
    loginTitle: "Login",
    loginDescription: "Account data is stored in local browser storage for this demo only.",
    registerEyebrow: "Local Account",
    registerTitle: "Create account",
    registerDescription: "Registration is stored locally and never sent to a server.",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm password",
    submitLogin: "Login",
    submitRegister: "Register",
    switchUserEyebrow: "Account Switch",
    switchUserTitle: "Switch user",
    switchUserDescription: "Choose a recently logged-in account to switch quickly.",
    currentAccount: "Current account",
    loginOtherAccount: "Log in with another account",
    back: "Back",
    accountSwitched: "Account switched.",
    accountNotFound: "This account does not exist. Please log in again.",
    authEmpty: "Please complete all required fields.",
    authPasswordMismatch: "The two passwords do not match.",
    authUserExists: "This username already exists.",
    authUsernameLength: "Username must be between 3 and 7 characters.",
    authUsernameInvalid: "Username can only contain letters, numbers, or underscores.",
    authRegisterSuccess: "Registration completed. You can log in now.",
    authLoginSuccess: "Login successful.",
    authInvalid: "Invalid username or password.",
    authNeedLogin: "Login is recommended if you want to keep your own records clearly.",
    goLogin: "Go to login",
    goRegister: "Go to register",
    noHistory: "This user has no local tasks yet. Create one first.",
    noFilteredHistory: "No history records match the current filters.",
    historySortLabel: "Time",
    historyDateFrom: "Start date",
    historyDateTo: "End date",
    historyTaskIdSearch: "Enter task ID",
    historyStatusFilter: "Task status",
    historyStatusAll: "All statuses",
    historyPagePrevious: "Previous",
    historyPageNext: "Next",
    historyPageSize: "Per page",
    historyResetFilters: "Reset filters",
    taskIdCopied: "Task ID copied.",
    datePickerClear: "Clear",
    datePickerToday: "Today",
    historyDeleteTitle: "Delete this history record?",
    historyDeleteDescription: "This record will be removed from the current user's history.",
    cancel: "Cancel",
    delete: "Delete",
    historyNeedLogin: "Please log in before viewing personal history.",
    localSummary: "Local mock generation finished. Preview and download are now available.",
    untitledTask: "Untitled task",
    profileEyebrow: "Profile",
    profileTitle: "Profile settings",
    profileDescription: "Profile data is stored only in the browser and used for local user presentation.",
    displayName: "Display name",
    email: "Email",
    bio: "Bio",
    saveProfile: "Save profile",
    changePassword: "Change password",
    confirmChangePassword: "Confirm change",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    profileSaved: "Profile saved.",
    passwordChanged: "Password updated.",
    passwordCurrentInvalid: "Current password is incorrect.",
    profileInvalidEmail: "Please enter a valid email address.",
    profileBioTooLong: "Bio must be 500 characters or fewer.",
    profileNeedLogin: "Please log in before viewing or editing your profile.",
    guestName: "Not set",
    guestPromptTitle: "Log in to save your history",
    guestPromptDescription:
      "After logging in, you can save your generation history, results, and profile. You can also continue as a guest, but guest sessions will not keep history records.",
    continueAsGuest: "Continue as guest",
    styleNames: {
      ink: "Ink Wash",
      impression: "Impression",
      cyber: "Cyber Neon",
      oil: "Oil Texture",
    },
    styleDescriptions: {
      ink: "Uses negative space, layered ink tones, and brushwork for a distinctly Eastern visual mood.",
      impression: "Bright blocks of color with visible brush texture.",
      cyber: "High-contrast neon tones for visual presentation.",
      oil: "Adds heavier paint texture and layered details.",
    },
  },
};

const AppContext = createContext<AppContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getText(language: Language, key: string): string {
  const value = dictionaries[language][key];
  return typeof value === "string" ? value : key;
}

function formatText(template: string, values?: Record<string, string>) {
  if (!values) return template;
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.split(`{${key}}`).join(value);
  }, template);
}

function createDefaultProfile(username: string, avatarSeed = username): UserProfile {
  return {
    displayName: username,
    email: "",
    bio: "",
    avatar: createAvatarUrl(avatarSeed),
  };
}

function createAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
}

function normalizeUsers(rawUsers: Array<{ username: string; password: string; profile?: UserProfile }>) {
  return rawUsers.map((user, index) => ({
    username: user.username,
    password: user.password,
    profile: user.profile
      ? {
          ...user.profile,
          avatar:
            user.profile.avatar || createAvatarUrl(`${user.username}-${index}-${Date.now()}`),
        }
      : createDefaultProfile(user.username, `${user.username}-${index}-${Date.now()}`),
  }));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [historyByUser, setHistoryByUser] = useState<Record<string, HistoryRecord[]>>({});

  useEffect(() => {
    const savedLanguage = readJson<Language>(STORAGE_KEYS.language, "zh");
    const savedTheme = readJson<Theme>(STORAGE_KEYS.theme, "light");
    const savedUsers = normalizeUsers(
      readJson<Array<{ username: string; password: string; profile?: UserProfile }>>(
        STORAGE_KEYS.users,
        [],
      ),
    );
    setLanguageState(savedLanguage);
    setTheme(savedTheme);
    document.documentElement.lang = savedLanguage === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.theme = savedTheme;
    setUsers(savedUsers);
    setCurrentUser(readJson<string | null>(STORAGE_KEYS.currentUser, null));
    readHistoryByUser()
      .then(setHistoryByUser)
      .catch(() =>
        setHistoryByUser(readJson<Record<string, HistoryRecord[]>>(STORAGE_KEYS.historyByUser, {})),
      );
    writeJson(STORAGE_KEYS.users, savedUsers);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearTransferSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    writeJson(STORAGE_KEYS.language, nextLanguage);
    document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en";
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    writeJson(STORAGE_KEYS.theme, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const register = (username: string, password: string) => {
    const normalizedName = username.trim();
    if (!normalizedName || !password) {
      return { ok: false, message: getText(language, "authEmpty") };
    }

    if (normalizedName.length < 3 || normalizedName.length > 7) {
      return { ok: false, message: getText(language, "authUsernameLength") };
    }

    if (!/^[A-Za-z0-9_]+$/.test(normalizedName)) {
      return { ok: false, message: getText(language, "authUsernameInvalid") };
    }

    if (users.some((user) => user.username === normalizedName)) {
      return { ok: false, message: getText(language, "authUserExists") };
    }

    const nextUsers = [
      ...users,
      {
        username: normalizedName,
        password,
        profile: createDefaultProfile(normalizedName, `${normalizedName}-${Date.now()}`),
      },
    ];
    setUsers(nextUsers);
    writeJson(STORAGE_KEYS.users, nextUsers);
    return { ok: true, message: getText(language, "authRegisterSuccess") };
  };

  const login = (username: string, password: string) => {
    const normalizedName = username.trim();
    const matched = users.find(
      (user) => user.username === normalizedName && user.password === password,
    );

    if (!matched) {
      return { ok: false, message: getText(language, "authInvalid") };
    }

    setCurrentUser(matched.username);
    writeJson(STORAGE_KEYS.currentUser, matched.username);
    return { ok: true, message: getText(language, "authLoginSuccess") };
  };

  const switchUser = (username: string) => {
    const normalizedName = username.trim();
    const matched = users.find((user) => user.username === normalizedName);

    if (!matched) {
      return { ok: false, message: getText(language, "accountNotFound") };
    }

    setCurrentUser(matched.username);
    writeJson(STORAGE_KEYS.currentUser, matched.username);
    return { ok: true, message: getText(language, "accountSwitched") };
  };

  const logout = () => {
    setCurrentUser(null);
    writeJson<string | null>(STORAGE_KEYS.currentUser, null);
  };

  const addHistoryRecord = (record: HistoryRecord) => {
    if (!currentUser) {
      return;
    }
    const nextHistoryByUser = {
      ...historyByUser,
      [currentUser]: [record, ...(historyByUser[currentUser] ?? [])],
    };
    setHistoryByUser(nextHistoryByUser);
    void writeHistoryByUser(nextHistoryByUser);
  };

  const deleteHistoryRecord = (recordId: string) => {
    if (!currentUser) {
      return;
    }

    const nextHistoryByUser = {
      ...historyByUser,
      [currentUser]: (historyByUser[currentUser] ?? []).filter((record) => record.id !== recordId),
    };
    setHistoryByUser(nextHistoryByUser);
    void writeHistoryByUser(nextHistoryByUser);
  };

  const updateProfile = (profile: UserProfile) => {
    if (!currentUser) {
      return { ok: false, message: getText(language, "profileNeedLogin") };
    }

    const nextEmail = profile.email.trim();
    const nextBio = profile.bio.trim();

    if (nextEmail && !isValidEmail(nextEmail)) {
      return { ok: false, message: getText(language, "profileInvalidEmail") };
    }

    if (nextBio.length > 500) {
      return { ok: false, message: getText(language, "profileBioTooLong") };
    }

    const nextUsers = users.map((user) =>
      user.username === currentUser
        ? {
            ...user,
            profile: {
              displayName: profile.displayName.trim(),
              email: nextEmail,
              bio: nextBio,
              avatar: profile.avatar,
            },
          }
        : user,
    );
    setUsers(nextUsers);
    writeJson(STORAGE_KEYS.users, nextUsers);
    return { ok: true, message: getText(language, "profileSaved") };
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    if (!currentUser) {
      return { ok: false, message: getText(language, "profileNeedLogin") };
    }

    if (!currentPassword || !newPassword) {
      return { ok: false, message: getText(language, "authEmpty") };
    }

    const matchedUser = users.find((user) => user.username === currentUser);
    if (!matchedUser || matchedUser.password !== currentPassword) {
      return { ok: false, message: getText(language, "passwordCurrentInvalid") };
    }

    const nextUsers = users.map((user) =>
      user.username === currentUser
        ? {
            ...user,
            password: newPassword,
          }
        : user,
    );
    setUsers(nextUsers);
    writeJson(STORAGE_KEYS.users, nextUsers);
    return { ok: true, message: getText(language, "passwordChanged") };
  };

  const currentProfile = currentUser
    ? users.find((user) => user.username === currentUser)?.profile ?? createDefaultProfile(currentUser)
    : null;

  const accounts = users.map(({ username, profile }) => ({ username, profile }));

  const historyRecords = currentUser ? historyByUser[currentUser] ?? [] : [];

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      toggleTheme,
      t: (key: string) => getText(language, key),
      currentUser,
      currentProfile,
      accounts,
      register,
      login,
      switchUser,
      logout,
      historyRecords,
      addHistoryRecord,
      deleteHistoryRecord,
      updateProfile,
      changePassword,
    }),
    [currentProfile, currentUser, historyRecords, language, theme, users, historyByUser],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}

export function useTranslate() {
  const { language, t } = useApp();

  const translate = (key: string, values?: Record<string, string>) =>
    formatText(t(key), values);

  const styleName = (key: "ink" | "impression" | "cyber" | "oil") =>
    (dictionaries[language].styleNames as Record<string, string>)[key];

  const styleDescription = (key: "ink" | "impression" | "cyber" | "oil") =>
    (dictionaries[language].styleDescriptions as Record<string, string>)[key];

  return { t: translate, styleName, styleDescription };
}
