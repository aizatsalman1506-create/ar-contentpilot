import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Heart,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase";

import "./Dashboard.css";

// ======================================================
// FIRESTORE
// ======================================================

const CALENDAR_COLLECTION = "calendarPosts";

// ======================================================
// HELPERS
// ======================================================

function getStatusLabel(status) {
  const value = String(status || "").toLowerCase();

  if (value === "published") return "PUBLISHED";
  if (value === "scheduled") return "SCHEDULED";

  return "DRAFT";
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "published") return "published";
  if (value === "scheduled") return "scheduled";

  return "draft";
}

function getTypeIcon(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("trend") ||
    value.includes("trending")
  ) {
    return Flame;
  }

  if (
    value.includes("quote") ||
    value.includes("quotes")
  ) {
    return FileText;
  }

  if (
    value.includes("emotional") ||
    value.includes("emotion")
  ) {
    return Heart;
  }

  if (
    value.includes("engagement") ||
    value.includes("viral")
  ) {
    return Zap;
  }

  return Sparkles;
}

function formatScheduledDate(date, time) {
  if (!date) {
    return "No date";
  }

  const dateObject = new Date(
    `${date}T${time || "00:00"}`
  );

  if (Number.isNaN(dateObject.getTime())) {
    return `${date}${time ? ` · ${time}` : ""}`;
  }

  return dateObject.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "",
}) {
  return (
    <div
      className={`dashboard-stat-card ${variant}`}
    >
      <div className="dashboard-stat-top">
        <span className="dashboard-stat-label">
          {label}
        </span>

        <div className="dashboard-stat-icon">
          <Icon size={17} />
        </div>
      </div>

      <div className="dashboard-stat-value">
        {value}
      </div>

      <div className="dashboard-stat-bottom">
        <span className="dashboard-stat-description">
          {description}
        </span>
      </div>
    </div>
  );
}

// ======================================================
// EMPTY QUEUE
// ======================================================

function EmptyQueue({ onCreate }) {
  return (
    <div className="dashboard-empty">
      <div className="dashboard-empty-icon">
        <FileText size={25} />
      </div>

      <strong>
        No upcoming content
      </strong>

      <span>
        Your upcoming posts will appear here
        after you create or schedule content.
      </span>

      <button
        type="button"
        className="dashboard-empty-button"
        onClick={onCreate}
      >
        <Plus size={15} />
        Create Content
      </button>
    </div>
  );
}

// ======================================================
// DASHBOARD
// ======================================================

export default function Dashboard({
  onNavigate,
}) {
  // ====================================================
  // SAFE NAVIGATION
  // ====================================================

  function navigate(page) {
    if (typeof onNavigate === "function") {
      onNavigate(page);
    }
  }

  // ====================================================
  // STATE
  // ====================================================

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ====================================================
  // FIRESTORE REALTIME LISTENER
  // ====================================================

  useEffect(() => {
    setLoading(true);
    setError("");

    let unsubscribe = () => {};

    try {
      const postsQuery = query(
        collection(
          db,
          CALENDAR_COLLECTION
        ),
        orderBy("date", "asc")
      );

      unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          const firestorePosts =
            snapshot.docs.map(
              (snapshotDoc) => {
                const data =
                  snapshotDoc.data();

                return {
                  id: snapshotDoc.id,

                  title:
                    data.title ||
                    data.content ||
                    "",

                  description:
                    data.description ||
                    "",

                  date:
                    data.date ||
                    "",

                  time:
                    data.time ||
                    "00:00",

                  platform:
                    data.platform ||
                    "Threads",

                  type:
                    data.type ||
                    "Content",

                  status:
                    data.status ||
                    "draft",

                  createdAt:
                    data.createdAt ||
                    null,

                  updatedAt:
                    data.updatedAt ||
                    null,
                };
              }
            );

          setPosts(
            firestorePosts
          );

          setLoading(false);
        },
        (firestoreError) => {
          console.error(
            "Dashboard Firestore error:",
            firestoreError
          );

          setPosts([]);
          setLoading(false);

          setError(
            "Unable to load dashboard data from Firestore."
          );
        }
      );
    } catch (firestoreError) {
      console.error(
        "Dashboard setup error:",
        firestoreError
      );

      setPosts([]);
      setLoading(false);

      setError(
        "Unable to connect to dashboard data."
      );
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // STATISTICS
  // ====================================================

  const statistics = useMemo(() => {
    const total =
      posts.length;

    const scheduled =
      posts.filter(
        (post) =>
          String(
            post.status
          ).toLowerCase() ===
          "scheduled"
      ).length;

    const published =
      posts.filter(
        (post) =>
          String(
            post.status
          ).toLowerCase() ===
          "published"
      ).length;

    const drafts =
      posts.filter(
        (post) =>
          String(
            post.status
          ).toLowerCase() ===
          "draft"
      ).length;

    return {
      total,
      scheduled,
      published,
      drafts,
    };
  }, [posts]);

  // ====================================================
  // UPCOMING POSTS
  // ====================================================

  const upcomingPosts =
    useMemo(() => {
      const now =
        new Date();

      return [...posts]
        .filter((post) => {
          if (!post.date) {
            return false;
          }

          const date =
            new Date(
              `${post.date}T${
                post.time ||
                "00:00"
              }`
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return false;
          }

          const status =
            String(
              post.status
            ).toLowerCase();

          return (
            date >= now &&
            status !==
              "published"
          );
        })
        .sort((a, b) => {
          const dateA =
            new Date(
              `${a.date}T${
                a.time ||
                "00:00"
              }`
            );

          const dateB =
            new Date(
              `${b.date}T${
                b.time ||
                "00:00"
              }`
            );

          return (
            dateA - dateB
          );
        })
        .slice(0, 5);
    }, [posts]);

  // ====================================================
  // CONTENT TYPE BREAKDOWN
  // ====================================================

  const typeBreakdown =
    useMemo(() => {
      const counts = {};

      posts.forEach(
        (post) => {
          const type =
            post.type ||
            "Content";

          counts[type] =
            (counts[type] ||
              0) + 1;
        }
      );

      return Object.entries(
        counts
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 4);
    }, [posts]);

  // ====================================================
  // MAX TYPE COUNT
  // ====================================================

  const maxTypeCount =
    useMemo(() => {
      if (
        !typeBreakdown.length
      ) {
        return 1;
      }

      return Math.max(
        ...typeBreakdown.map(
          ([, count]) =>
            count
        )
      );
    }, [typeBreakdown]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="dashboard-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-copy">

          <span className="dashboard-kicker">
            COMMAND CENTER
          </span>

          <h1>
            Dashboard Overview
          </h1>

          <p>
            Monitor your ContentPilot
            content and publishing
            activity from one place.
          </p>

        </div>

        <div className="dashboard-hero-actions">

          <button
            type="button"
            className="dashboard-primary-button"
            onClick={() =>
              navigate("studio")
            }
          >
            <Plus size={16} />

            <span>
              Create Post
            </span>
          </button>

        </div>

      </section>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="dashboard-error">

          <div className="dashboard-error-content">

            <span className="dashboard-error-dot" />

            <span>
              {error}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "calendar"
              )
            }
          >
            Open Calendar
            <ArrowUpRight size={14} />
          </button>

        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <section className="dashboard-stats-grid">

        <StatCard
          label="TOTAL CONTENT"
          value={
            loading
              ? "—"
              : statistics.total
          }
          description="All content records"
          icon={FileText}
          variant="purple"
        />

        <StatCard
          label="SCHEDULED"
          value={
            loading
              ? "—"
              : statistics.scheduled
          }
          description="Waiting to be published"
          icon={Clock3}
          variant="orange"
        />

        <StatCard
          label="PUBLISHED"
          value={
            loading
              ? "—"
              : statistics.published
          }
          description="Successfully published"
          icon={CheckCircle2}
          variant="cyan"
        />

        <button
          type="button"
          className="dashboard-stat-card dashboard-stat-action green"
          onClick={() =>
            navigate(
              "autopilot"
            )
          }
        >

          <div className="dashboard-stat-top">

            <span className="dashboard-stat-label">
              AUTOPILOT
            </span>

            <div className="dashboard-stat-icon">
              <Zap size={17} />
            </div>

          </div>

          <div className="dashboard-stat-value dashboard-stat-view">
            VIEW
          </div>

          <div className="dashboard-stat-bottom">

            <span className="dashboard-stat-description">
              Manage automation
            </span>

            <ArrowUpRight size={14} />

          </div>

        </button>

      </section>

      {/* ==================================================
          QUICK ACTIONS
      ================================================== */}

      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>

            <span className="dashboard-kicker">
              QUICK ACTIONS
            </span>

            <h2>
              Content Command Center
            </h2>

          </div>

        </div>

        <div className="dashboard-quick-grid">

          <button
            type="button"
            className="dashboard-quick-card purple"
            onClick={() =>
              navigate("studio")
            }
          >

            <div className="dashboard-quick-icon">
              <Sparkles size={20} />
            </div>

            <div className="dashboard-quick-content">

              <strong>
                Generate Content
              </strong>

              <span>
                Create new content with AI
              </span>

            </div>

            <ArrowUpRight
              size={16}
              className="dashboard-quick-arrow"
            />

          </button>

          <button
            type="button"
            className="dashboard-quick-card orange"
            onClick={() =>
              navigate(
                "calendar"
              )
            }
          >

            <div className="dashboard-quick-icon">
              <CalendarDays size={20} />
            </div>

            <div className="dashboard-quick-content">

              <strong>
                Schedule Post
              </strong>

              <span>
                Plan your publishing calendar
              </span>

            </div>

            <ArrowUpRight
              size={16}
              className="dashboard-quick-arrow"
            />

          </button>

          <button
            type="button"
            className="dashboard-quick-card cyan"
            onClick={() =>
              navigate(
                "trend-radar"
              )
            }
          >

            <div className="dashboard-quick-icon">
              <Flame size={20} />
            </div>

            <div className="dashboard-quick-content">

              <strong>
                Trend Radar
              </strong>

              <span>
                Discover current opportunities
              </span>

            </div>

            <ArrowUpRight
              size={16}
              className="dashboard-quick-arrow"
            />

          </button>

          <button
            type="button"
            className="dashboard-quick-card green"
            onClick={() =>
              navigate(
                "brand-profile"
              )
            }
          >

            <div className="dashboard-quick-icon">
              <TrendingUp size={20} />
            </div>

            <div className="dashboard-quick-content">

              <strong>
                Brand Brain
              </strong>

              <span>
                Manage your AI brand identity
              </span>

            </div>

            <ArrowUpRight
              size={16}
              className="dashboard-quick-arrow"
            />

          </button>

        </div>

      </section>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <section className="dashboard-main-grid">

        {/* =================================================
            CONTENT OVERVIEW
        ================================================= */}

        <div className="dashboard-panel">

          <div className="dashboard-panel-heading">

            <div>

              <span className="dashboard-kicker">
                CONTENT OVERVIEW
              </span>

              <h2>
                Content Distribution
              </h2>

            </div>

            <button
              type="button"
              className="dashboard-text-button"
              onClick={() =>
                navigate("content")
              }
            >
              View content
              <ArrowUpRight
                size={14}
              />
            </button>

          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="dashboard-spinner" />
              Loading content data...
            </div>
          ) : typeBreakdown.length ===
            0 ? (
            <div className="dashboard-empty-small">

              <FileText
                size={20}
              />

              <span>
                No content data
                available yet.
              </span>

            </div>
          ) : (
            <div className="dashboard-type-list">

              {typeBreakdown.map(
                (
                  [type, count],
                  index
                ) => {

                  const percentage =
                    Math.round(
                      (count /
                        maxTypeCount) *
                        100
                    );

                  const Icon =
                    getTypeIcon(
                      type
                    );

                  return (
                    <div
                      className="dashboard-type-item"
                      key={type}
                    >

                      <div className="dashboard-type-top">

                        <div className="dashboard-type-name">

                          <div
                            className={`dashboard-type-icon type-${index}`}
                          >
                            <Icon
                              size={15}
                            />
                          </div>

                          <strong>
                            {type}
                          </strong>

                        </div>

                        <span>
                          {count}
                        </span>

                      </div>

                      <div className="dashboard-type-bar">

                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

          <div className="dashboard-status-summary">

            <div>

              <span>
                Drafts
              </span>

              <strong>
                {loading
                  ? "—"
                  : statistics.drafts}
              </strong>

            </div>

            <div>

              <span>
                Scheduled
              </span>

              <strong>
                {loading
                  ? "—"
                  : statistics.scheduled}
              </strong>

            </div>

            <div>

              <span>
                Published
              </span>

              <strong>
                {loading
                  ? "—"
                  : statistics.published}
              </strong>

            </div>

          </div>

        </div>

        {/* =================================================
            AUTOPILOT
        ================================================= */}

        <div className="dashboard-panel dashboard-autopilot-panel">

          <div className="dashboard-panel-heading">

            <div>

              <span className="dashboard-kicker">
                AI AUTOPILOT
              </span>

              <h2>
                Automation
              </h2>

            </div>

            <button
              type="button"
              className="dashboard-status-pill"
              onClick={() =>
                navigate(
                  "autopilot"
                )
              }
            >
              <span />
              Manage
            </button>

          </div>

          <div className="dashboard-autopilot-body">

            <div className="dashboard-autopilot-icon">
              <Zap size={25} />
            </div>

            <div className="dashboard-autopilot-content">

              <strong>
                Automation controls
              </strong>

              <p>
                Configure generation,
                scheduling and publishing
                from the Autopilot page.
              </p>

              <button
                type="button"
                className="dashboard-outline-button"
                onClick={() =>
                  navigate(
                    "autopilot"
                  )
                }
              >
                Open Autopilot
                <ArrowUpRight
                  size={14}
                />
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          CONTENT QUEUE
      ================================================== */}

      <section className="dashboard-panel dashboard-queue-panel">

        <div className="dashboard-panel-heading">

          <div>

            <span className="dashboard-kicker">
              CONTENT QUEUE
            </span>

            <h2>
              Upcoming Posts
            </h2>

          </div>

          <button
            type="button"
            className="dashboard-text-button"
            onClick={() =>
              navigate(
                "calendar"
              )
            }
          >
            Open calendar
            <ArrowUpRight
              size={14}
            />
          </button>

        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            Loading upcoming posts...
          </div>
        ) : upcomingPosts.length ===
          0 ? (
          <EmptyQueue
            onCreate={() =>
              navigate("studio")
            }
          />
        ) : (
          <div className="dashboard-post-list">

            {upcomingPosts.map(
              (post) => {

                const Icon =
                  getTypeIcon(
                    post.type
                  );

                return (
                  <div
                    className="dashboard-post-row"
                    key={
                      post.id
                    }
                  >

                    <div className="dashboard-post-icon">
                      <Icon
                        size={16}
                      />
                    </div>

                    <div className="dashboard-post-content">

                      <strong>
                        {post.title ||
                          post.description ||
                          "Untitled content"}
                      </strong>

                      <span>
                        {post.type}
                        {" · "}
                        {post.platform}
                      </span>

                    </div>

                    <div className="dashboard-post-date">

                      <Clock3
                        size={14}
                      />

                      <span>
                        {formatScheduledDate(
                          post.date,
                          post.time
                        )}
                      </span>

                    </div>

                    <span
                      className={`dashboard-post-status ${getStatusClass(
                        post.status
                      )}`}
                    >
                      {getStatusLabel(
                        post.status
                      )}
                    </span>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}