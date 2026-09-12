// ======================================================
// AR CONTENTPILOT
// SETTINGS
// ======================================================

import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  Globe2,
  KeyRound,
  LayoutGrid,
  Lock,
  Palette,
  Save,
  Settings2,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import "./Settings.css";

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_SETTINGS = {
  companyName: "AR Marketing Solutions",

  language: "Bahasa Melayu",

  timezone: "Asia/Kuala_Lumpur",

  emailNotifications: true,

  trendNotifications: true,

  autopilotNotifications: true,

  weeklyReport: false,

  darkMode: true,

  autoSave: true,

  aiEnabled: true,

  defaultStyle: "Casual",

  autopilotEnabled: true,
};

// ======================================================
// SETTINGS
// ======================================================

export default function Settings() {
  // ====================================================
  // MAIN
  // ====================================================

  const [activeSection, setActiveSection] =
    useState("general");

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ====================================================
  // GENERAL
  // ====================================================

  const [companyName, setCompanyName] =
    useState(DEFAULT_SETTINGS.companyName);

  const [language, setLanguage] =
    useState(DEFAULT_SETTINGS.language);

  const [timezone, setTimezone] =
    useState(DEFAULT_SETTINGS.timezone);

  const [autoSave, setAutoSave] =
    useState(DEFAULT_SETTINGS.autoSave);

  const [darkMode, setDarkMode] =
    useState(DEFAULT_SETTINGS.darkMode);

  // ====================================================
  // PROFILE
  // ====================================================

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [emailVerified, setEmailVerified] =
    useState(false);

  const [pendingEmail, setPendingEmail] =
    useState(false);

  // ====================================================
  // NOTIFICATIONS
  // ====================================================

  const [emailNotifications, setEmailNotifications] =
    useState(
      DEFAULT_SETTINGS.emailNotifications
    );

  const [trendNotifications, setTrendNotifications] =
    useState(
      DEFAULT_SETTINGS.trendNotifications
    );

  const [autopilotNotifications, setAutopilotNotifications] =
    useState(
      DEFAULT_SETTINGS.autopilotNotifications
    );

  const [weeklyReport, setWeeklyReport] =
    useState(
      DEFAULT_SETTINGS.weeklyReport
    );

  // ====================================================
  // AI
  // ====================================================

  const [aiEnabled, setAiEnabled] =
    useState(DEFAULT_SETTINGS.aiEnabled);

  const [defaultStyle, setDefaultStyle] =
    useState(DEFAULT_SETTINGS.defaultStyle);

  // ====================================================
  // AUTOMATION
  // ====================================================

  const [autopilotEnabled, setAutopilotEnabled] =
    useState(
      DEFAULT_SETTINGS.autopilotEnabled
    );

  // ====================================================
  // SECURITY
  // ====================================================

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [showTwoFactorInfo, setShowTwoFactorInfo] =
    useState(false);

  const [showSessions, setShowSessions] =
    useState(false);

  const [sessionRefreshing, setSessionRefreshing] =
    useState(false);

  // ====================================================
  // SECTIONS
  // ====================================================

  const sections = [
    {
      id: "general",
      label: "General",
      description: "Basic workspace settings",
      icon: Settings2,
    },
    {
      id: "profile",
      label: "Profile",
      description: "Your account information",
      icon: User,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Alerts and updates",
      icon: Bell,
    },
    {
      id: "ai",
      label: "AI Engine",
      description: "AI content preferences",
      icon: Sparkles,
    },
    {
      id: "automation",
      label: "Automation",
      description: "Autopilot controls",
      icon: Zap,
    },
    {
      id: "appearance",
      label: "Appearance",
      description: "Interface preferences",
      icon: Palette,
    },
    {
      id: "security",
      label: "Security",
      description: "Security and access",
      icon: Shield,
    },
  ];

  // ====================================================
  // AUTH LISTENER
  // ====================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            setLoading(false);
            return;
          }

          try {
            await loadSettings(currentUser);

            setDisplayName(
              currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "AR Marketing"
            );

            setEmail(
              currentUser.email || ""
            );

            setEmailVerified(
              currentUser.emailVerified
            );
          } catch (err) {
            console.error(
              "Settings load error:",
              err
            );

            setError(
              "Unable to load your settings."
            );
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error(
            "Auth listener error:",
            err
          );

          setError(
            "Unable to load your account."
          );

          setLoading(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // LOAD SETTINGS
  // ====================================================

  async function loadSettings(currentUser) {
    const settingsRef = doc(
      db,
      "users",
      currentUser.uid
    );

    const snapshot =
      await getDoc(settingsRef);

    if (!snapshot.exists()) {
      applyLocalSettings(
        DEFAULT_SETTINGS
      );

      return;
    }

    const data =
      snapshot.data();

    const savedSettings =
      data.settings || {};

    const mergedSettings = {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };

    applyLocalSettings(
      mergedSettings
    );
  }

  // ====================================================
  // APPLY LOCAL SETTINGS
  // ====================================================

  function applyLocalSettings(settings) {
    setCompanyName(
      settings.companyName ??
        DEFAULT_SETTINGS.companyName
    );

    setLanguage(
      settings.language ??
        DEFAULT_SETTINGS.language
    );

    setTimezone(
      settings.timezone ??
        DEFAULT_SETTINGS.timezone
    );

    setEmailNotifications(
      settings.emailNotifications ??
        DEFAULT_SETTINGS.emailNotifications
    );

    setTrendNotifications(
      settings.trendNotifications ??
        DEFAULT_SETTINGS.trendNotifications
    );

    setAutopilotNotifications(
      settings.autopilotNotifications ??
        DEFAULT_SETTINGS.autopilotNotifications
    );

    setWeeklyReport(
      settings.weeklyReport ??
        DEFAULT_SETTINGS.weeklyReport
    );

    setDarkMode(
      settings.darkMode ??
        DEFAULT_SETTINGS.darkMode
    );

    setAutoSave(
      settings.autoSave ??
        DEFAULT_SETTINGS.autoSave
    );

    setAiEnabled(
      settings.aiEnabled ??
        DEFAULT_SETTINGS.aiEnabled
    );

    setDefaultStyle(
      settings.defaultStyle ??
        DEFAULT_SETTINGS.defaultStyle
    );

    setAutopilotEnabled(
      settings.autopilotEnabled ??
        DEFAULT_SETTINGS.autopilotEnabled
    );

    applyTheme(
      settings.darkMode ??
        DEFAULT_SETTINGS.darkMode
    );
  }

  // ====================================================
  // THEME
  // ====================================================

  function applyTheme(isDark) {
    if (
      typeof document ===
      "undefined"
    ) {
      return;
    }

    document.documentElement.dataset.theme =
      isDark
        ? "dark"
        : "light";

    document.body.classList.toggle(
      "light-mode",
      !isDark
    );

    localStorage.setItem(
      "arcp_theme",
      isDark
        ? "dark"
        : "light"
    );
  }

  // ====================================================
  // CURRENT SETTINGS
  // ====================================================

  const currentSettings =
    useMemo(
      () => ({
        companyName,
        language,
        timezone,

        emailNotifications,
        trendNotifications,
        autopilotNotifications,
        weeklyReport,

        darkMode,
        autoSave,

        aiEnabled,
        defaultStyle,

        autopilotEnabled,
      }),
      [
        companyName,
        language,
        timezone,
        emailNotifications,
        trendNotifications,
        autopilotNotifications,
        weeklyReport,
        darkMode,
        autoSave,
        aiEnabled,
        defaultStyle,
        autopilotEnabled,
      ]
    );

  // ====================================================
  // SAVE FIRESTORE
  // ====================================================

  async function saveSettings(
    settings = currentSettings
  ) {
    if (!user) {
      return;
    }

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        settings,
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  }

  // ====================================================
  // SAVE ALL CHANGES
  // ====================================================

  async function handleSave() {
    if (!user || saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setMessage("");
    setError("");

    try {
      // ----------------------------------------------
      // DISPLAY NAME
      // ----------------------------------------------

      const cleanDisplayName =
        displayName.trim();

      if (
        cleanDisplayName !==
        (user.displayName || "")
      ) {
        await updateProfile(
          user,
          {
            displayName:
              cleanDisplayName || null,
          }
        );
      }

      // ----------------------------------------------
      // EMAIL
      // ----------------------------------------------

      const cleanEmail =
        email.trim();

      if (
        cleanEmail &&
        cleanEmail !== user.email
      ) {
        await verifyBeforeUpdateEmail(
          user,
          cleanEmail
        );

        setPendingEmail(true);

        setMessage(
          "Verification email sent to your new email address."
        );
      }

      // ----------------------------------------------
      // FIRESTORE
      // ----------------------------------------------

      await saveSettings();

      // ----------------------------------------------
      // THEME
      // ----------------------------------------------

      applyTheme(darkMode);

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      setSaved(true);

      if (
        !cleanEmail ||
        cleanEmail === user.email
      ) {
        setMessage(
          "Settings saved successfully."
        );
      }

      window.setTimeout(() => {
        setSaved(false);
      }, 2200);
    } catch (err) {
      console.error(
        "Save settings error:",
        err
      );

      switch (err.code) {
        case "auth/requires-recent-login":
          setError(
            "Please sign in again before changing your email."
          );
          break;

        case "auth/email-already-in-use":
          setError(
            "That email address is already in use."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Email update is not enabled for this Firebase Authentication setup."
          );
          break;

        case "permission-denied":
          setError(
            "Firestore permission denied. Check your Firebase security rules."
          );
          break;

        default:
          setError(
            "Unable to save settings. Please try again."
          );
      }
    } finally {
      setSaving(false);
    }
  }

  // ====================================================
  // AUTO PERSIST
  // ====================================================

  async function autoPersist(
    nextSettings
  ) {
    if (
      !user ||
      !autoSave
    ) {
      return;
    }

    try {
      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          settings: {
            ...currentSettings,
            ...nextSettings,
          },
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    } catch (err) {
      console.error(
        "Auto save error:",
        err
      );
    }
  }

  // ====================================================
  // UPDATE SETTING
  // ====================================================

  function updateSetting(
    key,
    value,
    setter
  ) {
    setter(value);

    if (
      key === "darkMode"
    ) {
      applyTheme(value);
    }

    autoPersist({
      [key]: value,
    });
  }

  // ====================================================
  // EMAIL VERIFICATION
  // ====================================================

  async function handleSendVerification() {
    if (!user) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await sendEmailVerification(
        user
      );

      setMessage(
        "Verification email has been sent."
      );
    } catch (err) {
      console.error(
        "Verification error:",
        err
      );

      if (
        err.code ===
        "auth/too-many-requests"
      ) {
        setError(
          "Too many verification requests. Please try again later."
        );
      } else {
        setError(
          "Unable to send verification email."
        );
      }
    }
  }

  // ====================================================
  // REFRESH ACCOUNT
  // ====================================================

  async function handleRefreshAccount() {
    if (!user) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await reload(user);

      setEmailVerified(
        user.emailVerified
      );

      setEmail(
        user.email || ""
      );

      setDisplayName(
        user.displayName ||
          user.email?.split("@")[0] ||
          "AR Marketing"
      );

      setMessage(
        user.emailVerified
          ? "Email address is verified."
          : "Email is still not verified."
      );
    } catch (err) {
      console.error(
        "Refresh account error:",
        err
      );

      setError(
        "Unable to refresh account status."
      );
    }
  }

  // ====================================================
  // PASSWORD MODAL
  // ====================================================

  function openPasswordModal() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordError("");
    setPasswordSuccess("");

    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    if (
      changingPassword
    ) {
      return;
    }

    setShowPasswordModal(false);
  }

  // ====================================================
  // CHANGE PASSWORD
  // ====================================================

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setPasswordError("");
    setPasswordSuccess("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please complete all password fields."
      );

      return;
    }

    if (
      newPassword.length < 6
    ) {
      setPasswordError(
        "New password must contain at least 6 characters."
      );

      return;
    }

    if (
      newPassword ===
      currentPassword
    ) {
      setPasswordError(
        "New password must be different from your current password."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );

      return;
    }

    try {
      setChangingPassword(true);

      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      await updatePassword(
        user,
        newPassword
      );

      setPasswordSuccess(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 1800);
    } catch (err) {
      console.error(
        "Password change error:",
        err
      );

      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          setPasswordError(
            "Current password is incorrect."
          );
          break;

        case "auth/weak-password":
          setPasswordError(
            "New password is too weak."
          );
          break;

        case "auth/requires-recent-login":
          setPasswordError(
            "Please sign in again before changing your password."
          );
          break;

        case "auth/too-many-requests":
          setPasswordError(
            "Too many attempts. Please try again later."
          );
          break;

        default:
          setPasswordError(
            "Unable to change password. Please try again."
          );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  // ====================================================
  // ACTIVE SESSION
  // ====================================================

  async function handleReviewSessions() {
    if (!user) {
      return;
    }

    try {
      setSessionRefreshing(true);

      await user.getIdToken(
        true
      );

      setShowSessions(true);
    } catch (err) {
      console.error(
        "Session refresh error:",
        err
      );

      setError(
        "Unable to refresh your current session."
      );
    } finally {
      setSessionRefreshing(false);
    }
  }

  // ====================================================
  // INITIALS
  // ====================================================

  function getInitials() {
    const name =
      displayName.trim();

    if (name) {
      const parts =
        name.split(/\s+/);

      if (
        parts.length >= 2
      ) {
        return (
          parts[0][0] +
          parts[
            parts.length - 1
          ][0]
        ).toUpperCase();
      }

      return name
        .slice(0, 2)
        .toUpperCase();
    }

    if (email) {
      return email
        .slice(0, 2)
        .toUpperCase();
    }

    return "AR";
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-loading-card">
          <div className="settings-loading-icon">
            AR
          </div>

          <strong>
            Loading Settings
          </strong>

          <span>
            Connecting to your account...
          </span>
        </div>
      </div>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="settings-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="settings-header">

        <div>
          <span className="settings-kicker">
            SYSTEM CONFIGURATION
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Configure your AR ContentPilot workspace,
            AI engine and automation preferences.
          </p>
        </div>

        <button
          type="button"
          className={`settings-save-button ${
            saved ? "saved" : ""
          }`}
          onClick={handleSave}
          disabled={
            saving || !user
          }
        >
          {saving ? (
            <>
              <span className="settings-button-spinner" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            <>
              <Save size={15} />
              Save Changes
            </>
          )}
        </button>

      </div>

      {/* ==================================================
          MESSAGE
      ================================================== */}

      {(message || error) && (
        <div
          className={`settings-message ${
            error
              ? "error"
              : "success"
          }`}
        >
          <span>
            {error || message}
          </span>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setError("");
            }}
            aria-label="Close message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ==================================================
          SETTINGS LAYOUT
      ================================================== */}

      <div className="settings-layout">

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <aside className="settings-navigation">

          <div className="settings-nav-title">
            SETTINGS
          </div>

          {sections.map(
            (section) => {
              const Icon =
                section.icon;

              const active =
                activeSection ===
                section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`settings-nav-item ${
                    active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveSection(
                      section.id
                    )
                  }
                >
                  <div className="settings-nav-icon">
                    <Icon size={15} />
                  </div>

                  <div className="settings-nav-copy">
                    <strong>
                      {section.label}
                    </strong>

                    <span>
                      {section.description}
                    </span>
                  </div>

                  {active && (
                    <span className="settings-active-line" />
                  )}
                </button>
              );
            }
          )}

        </aside>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <main className="settings-content">

          {/* ==================================================
              GENERAL
          ================================================== */}

          {activeSection ===
            "general" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Settings2}
                title="General Settings"
                description="Manage your workspace identity and regional preferences."
              />

              <div className="settings-card">

                <div className="settings-card-header">

                  <div>
                    <h3>
                      Workspace
                    </h3>

                    <p>
                      Basic information about your ContentPilot workspace.
                    </p>
                  </div>

                  <div className="settings-card-icon purple">
                    <LayoutGrid size={17} />
                  </div>

                </div>

                <div className="settings-form-grid">

                  <Field
                    label="Workspace Name"
                    value={companyName}
                    onChange={(value) =>
                      updateSetting(
                        "companyName",
                        value,
                        setCompanyName
                      )
                    }
                    placeholder="Workspace name"
                  />

                  <SelectField
                    label="Language"
                    value={language}
                    onChange={(value) =>
                      updateSetting(
                        "language",
                        value,
                        setLanguage
                      )
                    }
                    options={[
                      "Bahasa Melayu",
                      "English",
                      "Bahasa Melayu + English",
                    ]}
                  />

                  <SelectField
                    label="Timezone"
                    value={timezone}
                    onChange={(value) =>
                      updateSetting(
                        "timezone",
                        value,
                        setTimezone
                      )
                    }
                    options={[
                      "Asia/Kuala_Lumpur",
                      "Asia/Singapore",
                      "Asia/Bangkok",
                      "Asia/Jakarta",
                    ]}
                  />

                  <div className="settings-field">

                    <label>
                      Workspace ID
                    </label>

                    <div className="settings-readonly">
                      <span>
                        ARCP-2026-001
                      </span>

                      <small>
                        READ ONLY
                      </small>
                    </div>

                  </div>

                </div>

              </div>

              <div className="settings-card">

                <div className="settings-card-header">

                  <div>
                    <h3>
                      Workspace Behaviour
                    </h3>

                    <p>
                      Control how the application behaves.
                    </p>
                  </div>

                  <div className="settings-card-icon cyan">
                    <Globe2 size={17} />
                  </div>

                </div>

                <ToggleRow
                  title="Auto Save"
                  description="Automatically preserve changes while editing settings."
                  checked={autoSave}
                  onChange={(value) => {
                    setAutoSave(value);

                    if (user) {
                      setDoc(
                        doc(
                          db,
                          "users",
                          user.uid
                        ),
                        {
                          settings: {
                            ...currentSettings,
                            autoSave: value,
                          },
                          updatedAt:
                            serverTimestamp(),
                        },
                        {
                          merge: true,
                        }
                      ).catch(
                        (err) =>
                          console.error(
                            "Auto save preference error:",
                            err
                          )
                      );
                    }
                  }}
                />

                <ToggleRow
                  title="Dark Interface"
                  description="Use the dark AR ContentPilot interface."
                  checked={darkMode}
                  onChange={(value) =>
                    updateSetting(
                      "darkMode",
                      value,
                      setDarkMode
                    )
                  }
                />

              </div>

            </section>
          )}

          {/* ==================================================
              PROFILE
          ================================================== */}

          {activeSection ===
            "profile" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={User}
                title="Profile"
                description="Manage your administrator profile information."
              />

              <div className="settings-card">

                <div className="settings-profile-preview">

                  <div className="settings-profile-avatar">
                    {getInitials()}
                  </div>

                  <div className="settings-profile-copy">
                    <strong>
                      {displayName ||
                        "AR Marketing"}
                    </strong>

                    <span>
                      Administrator
                    </span>
                  </div>

                  <div className="profile-status">
                    <span />
                    ACTIVE
                  </div>

                </div>

                <div className="settings-divider" />

                <div className="settings-form-grid">

                  <Field
                    label="Display Name"
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder="Display name"
                  />

                  <div className="settings-field">

                    <label>
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="Email address"
                    />

                    <div className="settings-email-status">

                      {emailVerified ? (
                        <span className="verified">
                          <Check size={12} />
                          Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={
                            handleSendVerification
                          }
                        >
                          Verify email
                        </button>
                      )}

                    </div>

                  </div>

                  <div className="settings-field">

                    <label>
                      Role
                    </label>

                    <div className="settings-readonly">
                      <span>
                        Administrator
                      </span>

                      <small>
                        ADMIN
                      </small>
                    </div>

                  </div>

                  <div className="settings-field">

                    <label>
                      Account Status
                    </label>

                    <div className="settings-readonly">

                      <span className="status-text-active">
                        Active
                      </span>

                      <small>
                        {emailVerified
                          ? "VERIFIED"
                          : "UNVERIFIED"}
                      </small>

                    </div>

                  </div>

                </div>

                {pendingEmail && (
                  <div className="settings-inline-notice">

                    <strong>
                      Email verification pending
                    </strong>

                    <span>
                      Check your new email address and complete verification.
                    </span>

                  </div>
                )}

              </div>

              <div className="settings-card">

                <div className="settings-card-header">

                  <div>
                    <h3>
                      Account Verification
                    </h3>

                    <p>
                      Refresh your Firebase account status after verification.
                    </p>
                  </div>

                  <div className="settings-card-icon cyan">
                    <Shield size={17} />
                  </div>

                </div>

                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={
                    handleRefreshAccount
                  }
                >
                  Refresh Account Status
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          {activeSection ===
            "notifications" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Bell}
                title="Notifications"
                description="Choose which alerts AR ContentPilot should show."
              />

              <div className="settings-card">

                <div className="settings-card-header">

                  <div>
                    <h3>
                      Notification Preferences
                    </h3>

                    <p>
                      Keep your workspace informed without unnecessary noise.
                    </p>
                  </div>

                  <div className="settings-card-icon orange">
                    <Bell size={17} />
                  </div>

                </div>

                <ToggleRow
                  title="Email Notifications"
                  description="Receive important system alerts by email."
                  checked={emailNotifications}
                  onChange={(value) =>
                    updateSetting(
                      "emailNotifications",
                      value,
                      setEmailNotifications
                    )
                  }
                />

                <ToggleRow
                  title="Trend Alerts"
                  description="Notify me when important topics start gaining momentum."
                  checked={trendNotifications}
                  onChange={(value) =>
                    updateSetting(
                      "trendNotifications",
                      value,
                      setTrendNotifications
                    )
                  }
                />

                <ToggleRow
                  title="Autopilot Alerts"
                  description="Notify me about generated and scheduled content."
                  checked={autopilotNotifications}
                  onChange={(value) =>
                    updateSetting(
                      "autopilotNotifications",
                      value,
                      setAutopilotNotifications
                    )
                  }
                />

                <ToggleRow
                  title="Weekly Performance Report"
                  description="Receive a weekly summary of content performance."
                  checked={weeklyReport}
                  onChange={(value) =>
                    updateSetting(
                      "weeklyReport",
                      value,
                      setWeeklyReport
                    )
                  }
                />

              </div>

            </section>
          )}

          {/* ==================================================
              AI ENGINE
          ================================================== */}

          {activeSection ===
            "ai" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Sparkles}
                title="AI Engine"
                description="Configure how the AI content engine behaves."
              />

              <div className="settings-card">

                <div className="settings-ai-banner">

                  <div className="settings-ai-icon">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <strong>
                      AI Content Engine
                    </strong>

                    <span>
                      {aiEnabled
                        ? "Your AI engine is ready to generate content."
                        : "AI generation is currently disabled."}
                    </span>
                  </div>

                  <div
                    className={`ai-status ${
                      aiEnabled
                        ? ""
                        : "offline"
                    }`}
                  >
                    <span />
                    {aiEnabled
                      ? "READY"
                      : "OFF"}
                  </div>

                </div>

                <div className="settings-divider" />

                <ToggleRow
                  title="Enable AI Engine"
                  description="Allow AR ContentPilot to generate content using AI."
                  checked={aiEnabled}
                  onChange={(value) =>
                    updateSetting(
                      "aiEnabled",
                      value,
                      setAiEnabled
                    )
                  }
                />

                <div className="settings-divider" />

                <div className="settings-card-header compact">

                  <div>
                    <h3>
                      Default Content Style
                    </h3>

                    <p>
                      Used when no specific style is selected.
                    </p>
                  </div>

                </div>

                <div className="settings-chip-grid">

                  {[
                    "Casual",
                    "Professional",
                    "Inspirational",
                    "Bold",
                    "Emotional",
                    "Funny",
                  ].map(
                    (style) => (
                      <button
                        type="button"
                        key={style}
                        className={`settings-style-chip ${
                          defaultStyle ===
                          style
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          updateSetting(
                            "defaultStyle",
                            style,
                            setDefaultStyle
                          )
                        }
                      >
                        {style}

                        {defaultStyle ===
                          style && (
                          <Check size={12} />
                        )}
                      </button>
                    )
                  )}

                </div>

              </div>

            </section>
          )}

          {/* ==================================================
              AUTOMATION
          ================================================== */}

          {activeSection ===
            "automation" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Zap}
                title="Automation"
                description="Control automatic content generation and publishing."
              />

              <div className="settings-card">

                <div className="automation-status">

                  <div className="automation-icon">
                    <Bot size={21} />
                  </div>

                  <div className="automation-copy">

                    <span className="settings-small-label">
                      AUTOPILOT STATUS
                    </span>

                    <h3>
                      {autopilotEnabled
                        ? "Automation is active"
                        : "Automation is paused"}
                    </h3>

                    <p>
                      {autopilotEnabled
                        ? "AR ContentPilot is ready to generate your next content."
                        : "Automatic generation is currently paused."}
                    </p>

                  </div>

                  <button
                    type="button"
                    className={`automation-toggle-button ${
                      autopilotEnabled
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      updateSetting(
                        "autopilotEnabled",
                        !autopilotEnabled,
                        setAutopilotEnabled
                      )
                    }
                  >
                    {autopilotEnabled
                      ? "ACTIVE"
                      : "PAUSED"}
                  </button>

                </div>

                <div className="settings-divider" />

                <ToggleRow
                  title="Autopilot"
                  description="Automatically generate content according to your schedule."
                  checked={autopilotEnabled}
                  onChange={(value) =>
                    updateSetting(
                      "autopilotEnabled",
                      value,
                      setAutopilotEnabled
                    )
                  }
                />

                <div className="automation-info-grid">

                  <div>
                    <span>
                      GENERATION FREQUENCY
                    </span>

                    <strong>
                      Every 4 hours
                    </strong>
                  </div>

                  <div>
                    <span>
                      DAILY LIMIT
                    </span>

                    <strong>
                      6 posts
                    </strong>
                  </div>

                  <div>
                    <span>
                      PLATFORM
                    </span>

                    <strong>
                      Threads
                    </strong>
                  </div>

                </div>

              </div>

            </section>
          )}

          {/* ==================================================
              APPEARANCE
          ================================================== */}

          {activeSection ===
            "appearance" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Palette}
                title="Appearance"
                description="Customize the visual experience of AR ContentPilot."
              />

              <div className="settings-card">

                <div className="settings-card-header">

                  <div>
                    <h3>
                      Theme
                    </h3>

                    <p>
                      Choose the interface appearance.
                    </p>
                  </div>

                  <div className="settings-card-icon purple">
                    <Palette size={17} />
                  </div>

                </div>

                <div className="theme-options">

                  <button
                    type="button"
                    className={`theme-option ${
                      darkMode
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateSetting(
                        "darkMode",
                        true,
                        setDarkMode
                      )
                    }
                  >

                    <div className="theme-preview dark-preview">
                      <div className="theme-preview-sidebar" />

                      <div className="theme-preview-content">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="theme-option-bottom">

                      <strong>
                        Dark
                      </strong>

                      {darkMode && (
                        <Check size={14} />
                      )}

                    </div>

                  </button>

                  <button
                    type="button"
                    className={`theme-option ${
                      !darkMode
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateSetting(
                        "darkMode",
                        false,
                        setDarkMode
                      )
                    }
                  >

                    <div className="theme-preview light-preview">
                      <div className="theme-preview-sidebar" />

                      <div className="theme-preview-content">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <div className="theme-option-bottom">

                      <strong>
                        Light
                      </strong>

                      {!darkMode && (
                        <Check size={14} />
                      )}

                    </div>

                  </button>

                </div>

              </div>

            </section>
          )}

          {/* ==================================================
              SECURITY
          ================================================== */}

          {activeSection ===
            "security" && (
            <section className="settings-section">

              <SettingsSectionHeader
                icon={Shield}
                title="Security"
                description="Manage account protection and access settings."
              />

              <div className="settings-card">

                <div className="security-status">

                  <div className="security-icon">
                    <Shield size={19} />
                  </div>

                  <div>
                    <strong>
                      Account Security
                    </strong>

                    <span>
                      {emailVerified
                        ? "Your account is protected and email verified."
                        : "Please verify your email address to improve account security."}
                    </span>
                  </div>

                  <span
                    className={`security-good ${
                      emailVerified
                        ? ""
                        : "warning"
                    }`}
                  >
                    {emailVerified
                      ? "SECURE"
                      : "ACTION NEEDED"}
                  </span>

                </div>

                <div className="settings-divider" />

                <SecurityRow
                  icon={KeyRound}
                  title="Password"
                  description="Change your account password."
                  action="Change"
                  onClick={
                    openPasswordModal
                  }
                />

                <SecurityRow
                  icon={Lock}
                  title="Two-Factor Authentication"
                  description="Add an extra layer of account protection."
                  action="Configure"
                  onClick={() =>
                    setShowTwoFactorInfo(
                      true
                    )
                  }
                />

                <SecurityRow
                  icon={Shield}
                  title="Active Sessions"
                  description="Review the current authenticated Firebase session."
                  action={
                    sessionRefreshing
                      ? "Refreshing..."
                      : "Review"
                  }
                  onClick={
                    handleReviewSessions
                  }
                  disabled={
                    sessionRefreshing
                  }
                />

              </div>

            </section>
          )}

        </main>

      </div>

      {/* ==================================================
          PASSWORD MODAL
      ================================================== */}

      {showPasswordModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={
            closePasswordModal
          }
        >

          <div
            className="settings-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="settings-modal-header">

              <div>
                <span>
                  SECURITY
                </span>

                <h3>
                  Change Password
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closePasswordModal
                }
                disabled={
                  changingPassword
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleChangePassword
              }
            >

              <div className="settings-modal-body">

                <Field
                  label="Current Password"
                  value={
                    currentPassword
                  }
                  onChange={
                    setCurrentPassword
                  }
                  placeholder="Current password"
                  type="password"
                />

                <Field
                  label="New Password"
                  value={newPassword}
                  onChange={
                    setNewPassword
                  }
                  placeholder="New password"
                  type="password"
                />

                <Field
                  label="Confirm New Password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  placeholder="Confirm new password"
                  type="password"
                />

                {passwordError && (
                  <div className="settings-modal-error">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="settings-modal-success">
                    {passwordSuccess}
                  </div>
                )}

              </div>

              <div className="settings-modal-footer">

                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={
                    closePasswordModal
                  }
                  disabled={
                    changingPassword
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-primary-button"
                  disabled={
                    changingPassword
                  }
                >
                  {changingPassword
                    ? "Changing..."
                    : "Change Password"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          2FA INFO
      ================================================== */}

      {showTwoFactorInfo && (
        <div
          className="settings-modal-overlay"
          onMouseDown={() =>
            setShowTwoFactorInfo(
              false
            )
          }
        >

          <div
            className="settings-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="settings-modal-header">

              <div>
                <span>
                  SECURITY
                </span>

                <h3>
                  Two-Factor Authentication
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTwoFactorInfo(
                    false
                  )
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="settings-modal-body">

              <div className="settings-security-info">

                <div className="settings-security-info-icon">
                  <Lock size={20} />
                </div>

                <div>

                  <strong>
                    MFA is not enabled yet
                  </strong>

                  <p>
                    Your current login uses Firebase
                    Authentication with email and password.
                  </p>

                  <p>
                    We will implement the complete
                    Firebase multi-factor verification
                    flow separately instead of displaying
                    a fake enabled status.
                  </p>

                </div>

              </div>

            </div>

            <div className="settings-modal-footer">

              <button
                type="button"
                className="settings-primary-button"
                onClick={() =>
                  setShowTwoFactorInfo(
                    false
                  )
                }
              >
                Understood
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          SESSION MODAL
      ================================================== */}

      {showSessions && (
        <div
          className="settings-modal-overlay"
          onMouseDown={() =>
            setShowSessions(false)
          }
        >

          <div
            className="settings-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="settings-modal-header">

              <div>
                <span>
                  SECURITY
                </span>

                <h3>
                  Current Session
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSessions(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="settings-modal-body">

              <div className="session-detail">

                <div className="session-detail-row">

                  <span>
                    Account
                  </span>

                  <strong>
                    {user?.email ||
                      "Unknown"}
                  </strong>

                </div>

                <div className="session-detail-row">

                  <span>
                    Authentication
                  </span>

                  <strong>
                    Firebase Authentication
                  </strong>

                </div>

                <div className="session-detail-row">

                  <span>
                    Status
                  </span>

                  <strong className="session-active">
                    ACTIVE
                  </strong>

                </div>

                <div className="session-detail-row">

                  <span>
                    User ID
                  </span>

                  <strong className="session-uid">
                    {user?.uid ||
                      "-"}
                  </strong>

                </div>

              </div>

              <p className="settings-session-note">
                This is the browser session currently
                authenticated with Firebase. Managing and
                revoking all other devices requires a
                server-side Firebase Admin implementation.
              </p>

            </div>

            <div className="settings-modal-footer">

              <button
                type="button"
                className="settings-primary-button"
                onClick={() =>
                  setShowSessions(false)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ======================================================
// SECTION HEADER
// ======================================================

function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="settings-section-header">

      <div className="settings-section-icon">
        <Icon size={18} />
      </div>

      <div>

        <span>
          AR CONTENTPILOT
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

// ======================================================
// FIELD
// ======================================================

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="settings-field">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
      />

    </div>
  );
}

// ======================================================
// SELECT
// ======================================================

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="settings-field">

      <label>
        {label}
      </label>

      <div className="settings-select">

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
        >
          {options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>

        <ChevronDown size={13} />

      </div>

    </div>
  );
}

// ======================================================
// TOGGLE
// ======================================================

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="settings-toggle-row">

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`settings-toggle ${
          checked
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange(!checked)
        }
      >
        <span />
      </button>

    </div>
  );
}

// ======================================================
// SECURITY ROW
// ======================================================

function SecurityRow({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  disabled = false,
}) {
  return (
    <div className="security-row">

      <div className="security-row-icon">
        <Icon size={16} />
      </div>

      <div className="security-row-copy">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <button
        type="button"
        className="security-action"
        onClick={onClick}
        disabled={disabled}
      >
        {action}
      </button>

    </div>
  );
}