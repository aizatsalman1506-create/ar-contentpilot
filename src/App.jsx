// ======================================================
// AR CONTENTPILOT
// APP
// ======================================================

import { useEffect, useState } from "react";

import {
  BarChart3,
  Brain,
  CalendarDays,
  ChevronRight,
  FileText,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  UserCircle,
  X,
  Zap,
} from "lucide-react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";

// ======================================================
// AUTH PAGE
// ======================================================

import Login from "./pages/auth/Login";

// ======================================================
// PAGES
// ======================================================

import Dashboard from "./pages/Dashboard";
import Studio from "./pages/Studio";
import TrendRadar from "./pages/TrendRadar";
import Content from "./pages/Content";
import Calendar from "./pages/Calendar";
import Autopilot from "./pages/Autopilot";
import Threads from "./pages/Threads";
import Analytics from "./pages/Analytics";
import BrandProfile from "./pages/BrandProfile";
import SettingsPage from "./pages/Settings";

// ======================================================
// CSS
// ======================================================

import "./App.css";

// ======================================================
// NAVIGATION
// ======================================================

const workspaceItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "studio",
    label: "AI Studio",
    icon: Sparkles,
  },
  {
    id: "trend-radar",
    label: "Trend Radar",
    icon: Flame,
    badge: "LIVE",
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    id: "autopilot",
    label: "Autopilot",
    icon: Zap,
    online: true,
  },
  {
    id: "threads",
    label: "Threads",
    icon: MessageCircle,
  },
];

const insightItems = [
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    id: "brand-profile",
    label: "Brand Brain",
    icon: Brain,
  },
];

const systemItems = [
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
  },
];

// ======================================================
// PAGE TITLES
// ======================================================

const pageTitles = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Your AI content command center.",
  },

  studio: {
    title: "Content Studio",
    subtitle: "Create and prepare content with AI.",
  },

  "trend-radar": {
    title: "Trend Radar",
    subtitle: "Discover what is trending in Malaysia.",
  },

  content: {
    title: "Content",
    subtitle: "Manage your content queue and drafts.",
  },

  calendar: {
    title: "Calendar",
    subtitle: "Plan and manage your publishing schedule.",
  },

  autopilot: {
    title: "Autopilot",
    subtitle: "Automate your content workflow.",
  },

  threads: {
    title: "Threads",
    subtitle: "Manage your Threads publishing.",
  },

  analytics: {
    title: "Analytics",
    subtitle: "Track your content performance.",
  },

  "brand-profile": {
    title: "Brand Brain",
    subtitle: "Manage your brand profile and voice.",
  },

  settings: {
    title: "Settings",
    subtitle: "Manage your ContentPilot settings.",
  },
};

// ======================================================
// HELPERS
// ======================================================

function getInitials(user) {
  if (!user) {
    return "AR";
  }

  const displayName =
    user.displayName?.trim();

  if (displayName) {
    const parts =
      displayName.split(/\s+/);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
    }

    return displayName
      .slice(0, 2)
      .toUpperCase();
  }

  const email =
    user.email?.trim();

  if (email) {
    return email
      .slice(0, 2)
      .toUpperCase();
  }

  return "AR";
}

function getUserName(user) {
  if (!user) {
    return "AR Marketing";
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email?.trim()) {
    return user.email.split("@")[0];
  }

  return "AR Marketing";
}

// ======================================================
// SIDEBAR NAV ITEM
// ======================================================

function SidebarNavItem({
  item,
  active,
  onClick,
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={`sidebar-nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="sidebar-nav-icon">
        <Icon size={19} />
      </span>

      <span className="sidebar-nav-label">
        {item.label}
      </span>

      {item.badge && (
        <span className="sidebar-live-badge">
          {item.badge}
        </span>
      )}

      {item.online && (
        <span className="sidebar-online-dot" />
      )}

      {active && (
        <ChevronRight
          size={16}
          className="sidebar-active-arrow"
        />
      )}
    </button>
  );
}

// ======================================================
// APP
// ======================================================

function App() {
  // ====================================================
  // NAVIGATION STATE
  // ====================================================

  const [activePage, setActivePage] =
    useState("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // ====================================================
  // AUTH STATE
  // ====================================================

  const [user, setUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ====================================================
  // STUDIO STATE
  // ====================================================

  const [studioPrefill, setStudioPrefill] =
    useState(null);

  // ====================================================
  // SEARCH STATE
  // ====================================================

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  // ====================================================
  // FIREBASE AUTH LISTENER
  // ====================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          console.log(
            "Firebase auth state:",
            currentUser
          );

          setUser(currentUser);
          setAuthLoading(false);
        },
        (error) => {
          console.error(
            "Auth listener error:",
            error
          );

          setUser(null);
          setAuthLoading(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // NAVIGATION
  // ====================================================

  function navigateTo(page) {
    if (!page) {
      return;
    }

    setActivePage(page);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }

  // ====================================================
  // LOGIN
  // ====================================================

  function handleLogin(currentUser) {
    if (!currentUser) {
      return;
    }

    setUser(currentUser);
    setActivePage("dashboard");
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }

  // ====================================================
  // TREND → STUDIO
  // ====================================================

  function handleGenerateFromTrend(trend) {
    if (!trend) {
      return;
    }

    setStudioPrefill({
      trendId:
        trend.id || "",

      title:
        trend.title || "",

      topic:
        trend.title || "",

      description:
        trend.description || "",

      category:
        trend.category ||
        "General",

      hashtags:
        Array.isArray(
          trend.hashtags
        )
          ? trend.hashtags
          : [],

      ideas:
        Array.isArray(
          trend.ideas
        )
          ? trend.ideas
          : [],

      source:
        trend.source ||
        "Google Trends",

      sourceUrl:
        trend.sourceUrl || "",

      momentum:
        Number(
          trend.momentum
        ) || 0,

      opportunity:
        trend.opportunity ||
        "Low",
    });

    navigateTo("studio");
  }

  // ====================================================
  // STUDIO PREFILL
  // ====================================================

  function handleStudioLoaded() {
    // Kept intentionally.
    //
    // Studio may use this callback
    // when consuming Trend Radar prefill.
  }

  // ====================================================
  // LOGOUT
  // ====================================================

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await signOut(auth);

      // Firebase onAuthStateChanged
      // akan set user kepada null.
      setUser(null);

      // Reset app state.
      setActivePage("dashboard");
      setMobileMenuOpen(false);
      setSearchOpen(false);
      setSearchValue("");
      setStudioPrefill(null);
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // ====================================================
  // KEYBOARD SHORTCUT
  // ====================================================

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ====================================================
  // SEARCH
  // ====================================================

  const allNavigationItems = [
    ...workspaceItems,
    ...insightItems,
    ...systemItems,
  ];

  const normalizedSearch =
    searchValue
      .trim()
      .toLowerCase();

  const searchResults =
    allNavigationItems.filter(
      (item) =>
        item.label
          .toLowerCase()
          .includes(
            normalizedSearch
          )
    );

  function handleSearchNavigate(page) {
    navigateTo(page);
    setSearchValue("");
  }

  // ====================================================
  // CURRENT PAGE
  // ====================================================

  const currentPage =
    pageTitles[activePage] ||
    pageTitles.dashboard;

  // ====================================================
  // PAGE RENDER
  // ====================================================

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={navigateTo}
          />
        );

      case "studio":
        return (
          <Studio
            trendPrefill={
              studioPrefill
            }
            onPrefillConsumed={
              handleStudioLoaded
            }
          />
        );

      case "trend-radar":
        return (
          <TrendRadar
            onGenerateContent={
              handleGenerateFromTrend
            }
          />
        );

      case "content":
        return (
          <Content
            onNavigate={navigateTo}
          />
        );

      case "calendar":
        return (
          <Calendar
            onNavigate={navigateTo}
          />
        );

      case "autopilot":
        return (
          <Autopilot
            onNavigate={navigateTo}
          />
        );

      case "threads":
        return (
          <Threads
            onNavigate={navigateTo}
          />
        );

      case "analytics":
        return (
          <Analytics
            onNavigate={navigateTo}
          />
        );

      case "brand-profile":
        return (
          <BrandProfile
            onNavigate={navigateTo}
          />
        );

      case "settings":
        return (
          <SettingsPage
            onNavigate={navigateTo}
          />
        );

      default:
        return (
          <Dashboard
            onNavigate={navigateTo}
          />
        );
    }
  }

  // ====================================================
  // AUTH LOADING
  // ====================================================

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">

          <div className="app-loading-logo">
            AR
          </div>

          <div className="app-loading-text">

            <strong>
              AR ContentPilot
            </strong>

            <span>
              Loading workspace...
            </span>

          </div>

        </div>
      </div>
    );
  }

  // ====================================================
  // LOGIN PAGE
  // ====================================================

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  // ====================================================
  // MAIN APPLICATION
  // ====================================================

  return (
    <div className="app-shell">

      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`app-sidebar ${
          mobileMenuOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {/* BRAND */}

        <div className="sidebar-brand">

          <button
            type="button"
            className="sidebar-brand-button"
            onClick={() =>
              navigateTo("dashboard")
            }
          >

            <div className="sidebar-logo">
              AR
            </div>

            <div className="sidebar-brand-text">

              <strong>
                AR ContentPilot
              </strong>

              <span>
                AR MARKETING SOLUTIONS
              </span>

            </div>

          </button>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>

        {/* ==================================================
            WORKSPACE
        ================================================== */}

        <div className="sidebar-section">

          <span className="sidebar-section-label">
            WORKSPACE
          </span>

          <nav className="sidebar-nav">

            {workspaceItems.map(
              (item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={
                    activePage ===
                    item.id
                  }
                  onClick={() =>
                    navigateTo(
                      item.id
                    )
                  }
                />
              )
            )}

          </nav>

        </div>

        {/* ==================================================
            INSIGHTS
        ================================================== */}

        <div className="sidebar-section">

          <span className="sidebar-section-label">
            INSIGHTS
          </span>

          <nav className="sidebar-nav">

            {insightItems.map(
              (item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={
                    activePage ===
                    item.id
                  }
                  onClick={() =>
                    navigateTo(
                      item.id
                    )
                  }
                />
              )
            )}

          </nav>

        </div>

        {/* ==================================================
            SYSTEM
        ================================================== */}

        <div className="sidebar-section">

          <span className="sidebar-section-label">
            SYSTEM
          </span>

          <nav className="sidebar-nav">

            {systemItems.map(
              (item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={
                    activePage ===
                    item.id
                  }
                  onClick={() =>
                    navigateTo(
                      item.id
                    )
                  }
                />
              )
            )}

          </nav>

        </div>

        {/* ==================================================
            SIDEBAR BOTTOM
        ================================================== */}

        <div className="sidebar-bottom">

          {/* USER */}

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">
              {getInitials(user)}
            </div>

            <div className="sidebar-user-info">

              <strong>
                {getUserName(user)}
              </strong>

              <span>
                Administrator
              </span>

            </div>

            <button
              type="button"
              className="sidebar-user-settings"
              onClick={() =>
                navigateTo(
                  "settings"
                )
              }
              aria-label="Settings"
            >
              <SettingsIcon
                size={17}
              />
            </button>

          </div>

          {/* LOGOUT */}

          <button
            type="button"
            className="sidebar-logout"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
          >

            <LogOut size={17} />

            <span>
              {loggingOut
                ? "Signing out..."
                : "Sign out"}
            </span>

          </button>

        </div>

      </aside>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="app-main">

        {/* ==================================================
            TOPBAR
        ================================================== */}

        <header className="app-topbar">

          <div className="topbar-left">

            {/* MOBILE MENU */}

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setMobileMenuOpen(
                  true
                )
              }
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* BREADCRUMB */}

            <div className="topbar-breadcrumb">

              <span>
                AR ContentPilot
              </span>

              <ChevronRight
                size={16}
              />

              <strong>
                {
                  currentPage.title
                }
              </strong>

            </div>

          </div>

          <div className="topbar-right">

            {/* ==================================================
                SEARCH
            ================================================== */}

            <button
              type="button"
              className="topbar-search-button"
              onClick={() =>
                setSearchOpen(
                  true
                )
              }
            >

              <Search size={17} />

              <span>
                Search workspace
              </span>

              <kbd>
                Ctrl K
              </kbd>

            </button>

            {/* ==================================================
                USER
            ================================================== */}

            <button
              type="button"
              className="topbar-user"
              onClick={() =>
                navigateTo(
                  "brand-profile"
                )
              }
            >

              <div className="topbar-avatar">
                {getInitials(user)}
              </div>

              <div className="topbar-user-info">

                <strong>
                  {getUserName(user)}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

              <UserCircle
                size={19}
              />

            </button>

          </div>

        </header>

        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <div className="app-content">
          {renderPage()}
        </div>

      </main>

      {/* ==================================================
          SEARCH MODAL
      ================================================== */}

      {searchOpen && (
        <div
          className="app-search-overlay"
          onMouseDown={() =>
            setSearchOpen(
              false
            )
          }
        >

          <div
            className="app-search-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {/* SEARCH HEADER */}

            <div className="app-search-header">

              <Search size={20} />

              <input
                autoFocus
                type="text"
                placeholder="Search workspace..."
                value={
                  searchValue
                }
                onChange={(
                  event
                ) =>
                  setSearchValue(
                    event.target
                      .value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setSearchOpen(
                    false
                  )
                }
                aria-label="Close search"
              >
                <X size={19} />
              </button>

            </div>

            {/* SEARCH RESULTS */}

            <div className="app-search-results">

              {searchResults.length >
              0 ? (
                searchResults.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        className="app-search-result"
                        onClick={() =>
                          handleSearchNavigate(
                            item.id
                          )
                        }
                      >

                        <div className="app-search-result-icon">
                          <Icon
                            size={18}
                          />
                        </div>

                        <div className="app-search-result-content">

                          <strong>
                            {
                              item.label
                            }
                          </strong>

                          <span>
                            Open page
                          </span>

                        </div>

                        <ChevronRight
                          size={17}
                        />

                      </button>
                    );
                  }
                )
              ) : (
                <div className="app-search-empty">

                  <Search
                    size={26}
                  />

                  <strong>
                    No results found
                  </strong>

                  <span>
                    Try another page
                    name.
                  </span>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default App;