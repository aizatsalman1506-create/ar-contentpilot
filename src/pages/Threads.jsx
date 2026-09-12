// ======================================================
// AR CONTENTPILOT
// THREADS
// ======================================================

import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Edit3,
  Eye,
  Heart,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
  Repeat2,
} from "lucide-react";

import "./Threads.css";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  getThreads,
  createThread,
  updateThread,
  deleteThread,
  getFirestoreErrorMessage,
} from "../lib/firestore";

// ======================================================
// CONSTANTS
// ======================================================

const MAX_CHARACTERS = 500;

const statusFilters = [
  "All Posts",
  "Published",
  "Scheduled",
  "Draft",
];

// ======================================================
// DEFAULT ACCOUNT STATS
// ======================================================
//
// Ini hanya fallback sementara.
// Nilai sebenar akan datang daripada Threads API
// selepas API integration siap.
// ======================================================

const initialStats = {
  followers: 0,
  followersGrowth: "+0.0%",
  posts: 0,
  postsGrowth: "+0.0%",
  engagement: 0,
  engagementGrowth: "+0.0%",
  reach: 0,
  reachGrowth: "+0.0%",
};

// ======================================================
// HELPERS
// ======================================================

function normalizeStatus(status) {
  if (!status) {
    return "Draft";
  }

  const value = String(status).toLowerCase();

  if (value === "published") {
    return "Published";
  }

  if (value === "scheduled") {
    return "Scheduled";
  }

  if (value === "draft") {
    return "Draft";
  }

  return "Draft";
}

// ======================================================
// NUMBER FORMAT
// ======================================================

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  if (typeof value === "string") {
    const parsed = Number(
      value.replace(/,/g, "")
    );

    if (!Number.isNaN(parsed)) {
      return new Intl.NumberFormat("en-US").format(
        parsed
      );
    }

    return value;
  }

  return new Intl.NumberFormat("en-US").format(
    Number(value) || 0
  );
}

// ======================================================
// COMPACT NUMBER
// ======================================================

function formatCompactNumber(value) {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(
      number >= 10000000 ? 0 : 1
    )}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(
      number >= 10000 ? 0 : 1
    )}K`;
  }

  return formatNumber(number);
}

// ======================================================
// PERCENTAGE
// ======================================================

function formatPercentage(value) {
  const number = Number(value) || 0;

  return `${number.toFixed(1)}%`;
}

// ======================================================
// FIRESTORE DATE
// ======================================================

function formatFirestoreDate(value) {
  if (!value) {
    return "Just now";
  }

  try {
    let date;

    if (
      typeof value === "object" &&
      typeof value.toDate === "function"
    ) {
      date = value.toDate();
    } else if (
      typeof value === "object" &&
      value.seconds
    ) {
      date = new Date(
        value.seconds * 1000
      );
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(date);
  } catch {
    return "Just now";
  }
}

// ======================================================
// NORMALIZE POST
// ======================================================

function normalizePost(item) {
  const reach =
    Number(
      item.reach ??
      item.views ??
      0
    ) || 0;

  const likes =
    Number(item.likes) || 0;

  const comments =
    Number(
      item.comments ??
      item.replies ??
      0
    ) || 0;

  const reposts =
    Number(item.reposts) || 0;

  const engagementRate =
    Number(
      item.engagementRate
    ) || 0;

  return {
    id: item.id,

    text:
      item.text ||
      item.content ||
      item.caption ||
      "",

    status: normalizeStatus(
      item.status
    ),

    date:
      item.scheduledAt
        ? formatFirestoreDate(
            item.scheduledAt
          )
        : formatFirestoreDate(
            item.publishedAt ||
            item.createdAt
          ),

    // ==================================================
    // REAL THREADS METRICS
    // ==================================================

    reach,

    likes,

    comments,

    reposts,

    engagementRate,

    // ==================================================
    // BACKWARD COMPATIBILITY
    // ==================================================

    replies: comments,

    views: reach,

    type:
      item.type ||
      item.category ||
      "Custom",

    createdAt:
      item.createdAt || null,

    scheduledAt:
      item.scheduledAt || null,

    publishedAt:
      item.publishedAt || null,

    platform:
      item.platform ||
      "Threads",

    // Threads API identifiers
    threadsPostId:
      item.threadsPostId ||
      item.platformPostId ||
      null,

    threadsUsername:
      item.threadsUsername ||
      null,

    lastMetricsSync:
      item.lastMetricsSync ||
      null,
  };
}

// ======================================================
// STAT CARD
// ======================================================

function ThreadsStatCard({
  label,
  value,
  growth,
  description,
  icon: Icon,
  variant,
}) {
  return (
    <div
      className={`threads-stat-card ${variant}`}
    >
      <div className="threads-stat-top">

        <span>
          {label}
        </span>

        <div className="threads-stat-icon">
          <Icon
            size={16}
            strokeWidth={1.8}
          />
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <div className="threads-stat-bottom">

        <span className="threads-stat-growth">
          <ArrowUpRight size={10} />
          {growth}
        </span>

        <span>
          {description}
        </span>

      </div>

      <div className="threads-stat-glow" />
    </div>
  );
}

// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status || "Draft"
    ).toLowerCase();

  return (
    <span
      className={`threads-status ${normalized}`}
    >
      <span />
      {status}
    </span>
  );
}

// ======================================================
// POST ROW
// ======================================================

function PostRow({
  post,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  return (
    <div className="threads-post-row">

      <div className="threads-post-content">

        <div className="threads-post-avatar">
          AR
        </div>

        <div className="threads-post-body">

          <div className="threads-post-user-row">

            <strong>
              AR Marketing Solutions
            </strong>

            <span className="threads-post-handle">
              {post.threadsUsername
                ? `@${post.threadsUsername}`
                : "@armarketingsolutions"}
            </span>

          </div>

          <p>
            {post.text}
          </p>

          <div className="threads-post-meta">

            <span>
              {post.type}
            </span>

            <span className="meta-dot">
              •
            </span>

            <span>
              {post.date}
            </span>

          </div>

          {post.status ===
            "Published" && (
            <div className="threads-post-performance">

              {/* REACH */}

              <span>
                <Eye size={12} />

                {formatCompactNumber(
                  post.reach
                )}
              </span>

              {/* LIKES */}

              <span>
                <Heart size={12} />

                {formatNumber(
                  post.likes
                )}
              </span>

              {/* COMMENTS */}

              <span>
                <MessageCircle size={12} />

                {formatNumber(
                  post.comments
                )}
              </span>

              {/* REPOSTS */}

              <span>
                <Repeat2 size={12} />

                {formatNumber(
                  post.reposts
                )}
              </span>

              {/* ENGAGEMENT */}

              <span>
                <TrendingUp size={12} />

                {formatPercentage(
                  post.engagementRate
                )}
              </span>

            </div>
          )}

        </div>

      </div>

      <div className="threads-post-status">

        <StatusBadge
          status={post.status}
        />

      </div>

      <div className="threads-post-actions">

        <button
          type="button"
          title="Edit"
          onClick={() =>
            onEdit(post)
          }
        >
          <Edit3 size={13} />
        </button>

        <button
          type="button"
          title="Duplicate"
          onClick={() =>
            onDuplicate(post)
          }
        >
          <Copy size={13} />
        </button>

        <button
          type="button"
          title="Delete"
          onClick={() =>
            onDelete(post.id)
          }
        >
          <Trash2 size={13} />
        </button>

      </div>

    </div>
  );
}

// ======================================================
// COMPOSER
// ======================================================

function ThreadsComposer({
  value,
  setValue,
  onPublish,
  onSchedule,
  onClose,
  editingPost,
  onSaveEdit,
  saving,
}) {
  const remaining =
    MAX_CHARACTERS -
    value.length;

  return (
    <section className="threads-composer-panel">

      <div className="threads-composer-header">

        <div>

          <span className="threads-section-kicker">
            {editingPost
              ? "EDIT THREAD"
              : "NEW THREAD"}
          </span>

          <h2>
            {editingPost
              ? "Edit your post"
              : "Create a new Thread"}
          </h2>

        </div>

        <button
          type="button"
          className="threads-close-button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close composer"
        >
          <X size={16} />
        </button>

      </div>

      <div className="threads-composer-body">

        <div className="threads-composer-user">

          <div className="threads-composer-avatar">
            AR
          </div>

          <div>

            <strong>
              AR Marketing Solutions
            </strong>

            <span>
              @armarketingsolutions
            </span>

          </div>

        </div>

        <textarea
          value={value}
          onChange={(event) =>
            setValue(
              event.target.value
            )
          }
          placeholder="What do you want to share?"
          maxLength={
            MAX_CHARACTERS
          }
          autoFocus
          disabled={saving}
        />

        <div className="threads-composer-footer">

          <div className="threads-composer-tools">

            <button
              type="button"
              title="AI Assistant"
              disabled={saving}
            >
              <Sparkles size={14} />
            </button>

            <button
              type="button"
              title="Add image"
              disabled={saving}
            >
              <Plus size={14} />
            </button>

            <button
              type="button"
              title="Schedule"
              disabled={saving}
            >
              <CalendarDays size={14} />
            </button>

          </div>

          <div className="threads-character-count">

            <span
              className={
                remaining < 50
                  ? "warning"
                  : ""
              }
            >
              {value.length}
            </span>

            /{MAX_CHARACTERS}

          </div>

        </div>

      </div>

      <div className="threads-composer-actions">

        <button
          type="button"
          className="threads-secondary-button"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>

        {editingPost ? (
          <button
            type="button"
            className="threads-primary-button"
            onClick={
              onSaveEdit
            }
            disabled={
              saving ||
              !value.trim()
            }
          >

            {saving ? (
              <RefreshCw
                size={14}
                className="threads-refresh-spinning"
              />
            ) : (
              <Check size={14} />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}

          </button>
        ) : (
          <>
            <button
              type="button"
              className="threads-secondary-button schedule"
              onClick={
                onSchedule
              }
              disabled={
                saving ||
                !value.trim()
              }
            >

              {saving ? (
                <RefreshCw
                  size={14}
                  className="threads-refresh-spinning"
                />
              ) : (
                <Clock3 size={14} />
              )}

              Schedule

            </button>

            <button
              type="button"
              className="threads-primary-button"
              onClick={
                onPublish
              }
              disabled={
                saving ||
                !value.trim()
              }
            >

              {saving ? (
                <RefreshCw
                  size={14}
                  className="threads-refresh-spinning"
                />
              ) : (
                <Send size={14} />
              )}

              {saving
                ? "Publishing..."
                : "Publish Now"}

            </button>
          </>
        )}

      </div>

    </section>
  );
}

// ======================================================
// QUICK INSIGHT
// ======================================================

function QuickInsight({
  icon: Icon,
  title,
  description,
  variant,
}) {
  return (
    <div
      className={`threads-insight ${variant}`}
    >

      <div className="threads-insight-icon">
        <Icon size={15} />
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

    </div>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Threads({
  onNavigate,
}) {

  // ====================================================
  // AUTH
  // ====================================================

  const [user, setUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  // ====================================================
  // THREAD STATE
  // ====================================================

  const [posts, setPosts] =
    useState([]);

  const [activeFilter, setActiveFilter] =
    useState("All Posts");

  const [showComposer, setShowComposer] =
    useState(false);

  const [composerText, setComposerText] =
    useState("");

  const [editingPost, setEditingPost] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    showConnectionSettings,
    setShowConnectionSettings,
  ] = useState(false);

  const [toast, setToast] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ====================================================
  // AUTH LISTENER
  // ====================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(
            currentUser
          );

          setAuthLoading(
            false
          );

        }
      );

    return () =>
      unsubscribe();

  }, []);

  // ====================================================
  // LOAD THREADS
  // ====================================================

  const loadThreads =
    async () => {

      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {

        setError("");

        setLoading(true);

        const data =
          await getThreads();

        const normalized =
          data.map(
            normalizePost
          );

        setPosts(
          normalized
        );

      } catch (loadError) {

        console.error(
          "Failed to load Threads:",
          loadError
        );

        setError(
          getFirestoreErrorMessage(
            loadError
          )
        );

        setPosts([]);

      } finally {

        setLoading(false);

      }
    };

  // ====================================================
  // LOAD AFTER AUTH
  // ====================================================

  useEffect(() => {

    if (
      !authLoading &&
      user
    ) {
      loadThreads();
    }

    if (
      !authLoading &&
      !user
    ) {
      setPosts([]);
      setLoading(false);
    }

  }, [
    authLoading,
    user,
  ]);

  // ====================================================
  // TOAST
  // ====================================================

  const showToast =
    (message) => {

      setToast(
        message
      );

      window.setTimeout(
        () => {
          setToast("");
        },
        2500
      );

    };

  // ====================================================
  // FILTER
  // ====================================================

  const filteredPosts =
    useMemo(() => {

      if (
        activeFilter ===
        "All Posts"
      ) {
        return posts;
      }

      return posts.filter(
        (post) =>
          post.status ===
          activeFilter
      );

    }, [
      posts,
      activeFilter,
    ]);

  // ====================================================
  // REAL STATS
  // ====================================================

  const stats =
    useMemo(() => {

      const published =
        posts.filter(
          (post) =>
            post.status ===
            "Published"
        );

      const totalReach =
        published.reduce(
          (total, post) =>
            total +
            (
              Number(
                post.reach
              ) || 0
            ),
          0
        );

      const totalLikes =
        published.reduce(
          (total, post) =>
            total +
            (
              Number(
                post.likes
              ) || 0
            ),
          0
        );

      const totalComments =
        published.reduce(
          (total, post) =>
            total +
            (
              Number(
                post.comments
              ) || 0
            ),
          0
        );

      const totalReposts =
        published.reduce(
          (total, post) =>
            total +
            (
              Number(
                post.reposts
              ) || 0
            ),
          0
        );

      // ================================================
      // ENGAGEMENT RATE
      // ================================================
      //
      // Jika setiap post mempunyai engagementRate
      // daripada Threads API, kita gunakan weighted
      // calculation berdasarkan reach.
      //
      // engagementRate =
      // ((likes + comments + reposts) / reach) * 100
      //
      // ================================================

      const engagementRate =
        totalReach > 0
          ? (
              (
                (
                  totalLikes +
                  totalComments +
                  totalReposts
                ) /
                totalReach
              ) *
              100
            )
          : 0;

      return {

        followers:
          initialStats.followers,

        followersGrowth:
          initialStats.followersGrowth,

        posts:
          published.length,

        postsGrowth:
          initialStats.postsGrowth,

        engagement:
          engagementRate,

        engagementGrowth:
          initialStats.engagementGrowth,

        reach:
          totalReach,

        reachGrowth:
          initialStats.reachGrowth,

        likes:
          totalLikes,

        comments:
          totalComments,

        reposts:
          totalReposts,

      };

    }, [
      posts,
    ]);

  // ====================================================
  // NEW POST
  // ====================================================

  const openComposer =
    () => {

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      setEditingPost(null);

      setComposerText("");

      setShowComposer(
        true
      );

    };

  // ====================================================
  // CLOSE COMPOSER
  // ====================================================

  const closeComposer =
    () => {

      if (saving) {
        return;
      }

      setShowComposer(
        false
      );

      setEditingPost(
        null
      );

      setComposerText("");

    };

  // ====================================================
  // CREATE FIRESTORE THREAD
  // ====================================================

  const createFirestoreThread =
    async ({
      status,
      scheduledAt = null,
    }) => {

      if (
        !composerText.trim()
      ) {
        return;
      }

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      setSaving(true);

      try {

        const created =
          await createThread({

            text:
              composerText.trim(),

            status,

            type:
              "Custom",

            platform:
              "Threads",

            // ==========================================
            // THREADS METRICS
            // ==========================================

            reach: 0,

            likes: 0,

            comments: 0,

            reposts: 0,

            engagementRate: 0,

            // ==========================================
            // BACKWARD COMPATIBILITY
            // ==========================================

            replies: 0,

            views: 0,

            // ==========================================
            // PLATFORM
            // ==========================================

            threadsPostId:
              null,

            threadsUsername:
              user.email
                ? user.email.split("@")[0]
                : null,

            lastMetricsSync:
              null,

            scheduledAt,

            publishedAt:
              status ===
              "Published"
                ? new Date()
                : null,

          });

        const normalized =
          normalizePost(
            created
          );

        setPosts(
          (current) => [
            normalized,
            ...current,
          ]
        );

        closeComposer();

        showToast(
          status ===
            "published"
            ? "Thread published successfully."
            : "Thread scheduled successfully."
        );

      } catch (createError) {

        console.error(
          "Failed to create Thread:",
          createError
        );

        showToast(
          getFirestoreErrorMessage(
            createError
          )
        );

      } finally {

        setSaving(false);

      }
    };

  // ====================================================
  // PUBLISH
  // ====================================================

  const handlePublish =
    async () => {

      await createFirestoreThread({
        status:
          "published",
      });

    };

  // ====================================================
  // SCHEDULE
  // ====================================================

  const handleSchedule =
    async () => {

      const scheduledAt =
        new Date();

      scheduledAt.setHours(
        scheduledAt.getHours() + 2
      );

      await createFirestoreThread({
        status:
          "scheduled",

        scheduledAt,
      });

    };

  // ====================================================
  // EDIT
  // ====================================================

  const handleEdit =
    (post) => {

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      setEditingPost(
        post
      );

      setComposerText(
        post.text
      );

      setShowComposer(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };

  // ====================================================
  // SAVE EDIT
  // ====================================================

  const handleSaveEdit =
    async () => {

      if (
        !editingPost ||
        !composerText.trim()
      ) {
        return;
      }

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      setSaving(true);

      try {

        await updateThread(
          editingPost.id,
          {
            text:
              composerText.trim(),
          }
        );

        setPosts(
          (current) =>
            current.map(
              (post) =>
                post.id ===
                editingPost.id
                  ? {
                      ...post,
                      text:
                        composerText.trim(),
                    }
                  : post
            )
        );

        closeComposer();

        showToast(
          "Thread updated successfully."
        );

      } catch (updateError) {

        console.error(
          "Failed to update Thread:",
          updateError
        );

        showToast(
          getFirestoreErrorMessage(
            updateError
          )
        );

      } finally {

        setSaving(false);

      }

    };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete =
    async (id) => {

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this Thread permanently?"
        );

      if (!confirmed) {
        return;
      }

      try {

        await deleteThread(
          id
        );

        setPosts(
          (current) =>
            current.filter(
              (post) =>
                post.id !== id
            )
        );

        showToast(
          "Thread deleted successfully."
        );

      } catch (deleteError) {

        console.error(
          "Failed to delete Thread:",
          deleteError
        );

        showToast(
          getFirestoreErrorMessage(
            deleteError
          )
        );

      }

    };

  // ====================================================
  // DUPLICATE
  // ====================================================

  const handleDuplicate =
    async (post) => {

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      try {

        const duplicate =
          await createThread({

            text:
              post.text,

            status:
              "draft",

            type:
              post.type ||
              "Custom",

            platform:
              "Threads",

            reach: 0,

            likes: 0,

            comments: 0,

            reposts: 0,

            engagementRate: 0,

            replies: 0,

            views: 0,

            threadsPostId:
              null,

            threadsUsername:
              user.email
                ? user.email.split("@")[0]
                : null,

            lastMetricsSync:
              null,

            scheduledAt:
              null,

            publishedAt:
              null,

          });

        const normalized =
          normalizePost(
            duplicate
          );

        setPosts(
          (current) => [
            normalized,
            ...current,
          ]
        );

        showToast(
          "Thread duplicated as a draft."
        );

      } catch (duplicateError) {

        console.error(
          "Failed to duplicate Thread:",
          duplicateError
        );

        showToast(
          getFirestoreErrorMessage(
            duplicateError
          )
        );

      }

    };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {

      if (refreshing) {
        return;
      }

      if (!user) {
        showToast(
          "Please login first."
        );
        return;
      }

      setRefreshing(
        true
      );

      try {

        await loadThreads();

        showToast(
          "Threads data refreshed."
        );

      } catch {
        // loadThreads already handles error
      } finally {

        setRefreshing(
          false
        );

      }

    };

  // ====================================================
  // CONNECTION
  // ====================================================

  const handleConnect =
    () => {

      showToast(
        "Threads API connection will be configured next."
      );

    };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleThreadsLogout =
    async () => {

      try {

        await signOut(
          auth
        );

        setUser(null);

        setPosts([]);

        setShowConnectionSettings(
          false
        );

        showToast(
          "Logged out successfully."
        );

      } catch (
        logoutError
      ) {

        console.error(
          "Threads logout failed:",
          logoutError
        );

        showToast(
          "Unable to logout. Please try again."
        );

      }

    };

  // ====================================================
  // AUTH LOADING
  // ====================================================

  if (authLoading) {
    return (
      <div className="threads-page">

        <div className="threads-empty-posts">

          <div>
            <RefreshCw
              size={22}
              className="threads-refresh-spinning"
            />
          </div>

          <strong>
            Checking authentication...
          </strong>

          <span>
            Connecting to AR ContentPilot.
          </span>

        </div>

      </div>
    );
  }

  // ====================================================
  // NOT LOGGED IN
  // ====================================================

  if (!user) {
    return (
      <div className="threads-page">

        <section className="threads-page-header">

          <div>

            <span className="threads-page-kicker">
              SOCIAL PUBLISHING
            </span>

            <h1>
              Threads
            </h1>

            <p>
              Login required to access
              Threads publishing and analytics.
            </p>

          </div>

        </section>

        <section className="threads-connection-panel">

          <div>

            <span className="threads-section-kicker">
              AUTHENTICATION
            </span>

            <strong>
              You are not signed in
            </strong>

            <span>
              Please login to AR ContentPilot
              before using Threads.
            </span>

          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate("login");
              }
            }}
          >
            <Send size={13} />
            Go to Login
          </button>

        </section>

      </div>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="threads-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="threads-page-header">

        <div>

          <span className="threads-page-kicker">
            SOCIAL PUBLISHING
          </span>

          <h1>
            Threads
          </h1>

          <p>
            Manage, publish and monitor your Threads
            content from one command center.
          </p>

        </div>

        <div className="threads-header-actions">

          <div className="threads-connected-badge">
            <span />
            FIRESTORE CONNECTED
          </div>

          <button
            type="button"
            className="threads-refresh-button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "threads-refresh-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

          <button
            type="button"
            className="threads-primary-button header-create"
            onClick={
              openComposer
            }
          >

            <Plus size={14} />

            New Thread

          </button>

        </div>

      </section>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <section className="threads-connection-panel">

          <div>

            <span className="threads-section-kicker">
              FIRESTORE
            </span>

            <strong>
              Unable to load Threads data
            </strong>

            <span>
              {error}
            </span>

          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
          >

            <RefreshCw size={13} />

            Try Again

          </button>

        </section>
      )}

      {/* ==================================================
          ACCOUNT BAR
      ================================================== */}

      <section className="threads-account-bar">

        <div className="threads-account-main">

          <div className="threads-account-avatar">
            AR
          </div>

          <div className="threads-account-info">

            <div className="threads-account-name">

              <strong>
                {user.displayName ||
                  user.email?.split(
                    "@"
                  )[0] ||
                  "AR Marketing Solutions"}
              </strong>

              <span className="threads-account-status">

                <span />

                Connected

              </span>

            </div>

            <span>
              {user.email}
            </span>

          </div>

        </div>

        <div className="threads-account-meta">

          <div>

            <span>
              Followers
            </span>

            <strong>
              {formatNumber(
                stats.followers
              )}
            </strong>

          </div>

          <div>

            <span>
              Posts
            </span>

            <strong>
              {formatNumber(
                stats.posts
              )}
            </strong>

          </div>

          <button
            type="button"
            className="threads-account-settings"
            onClick={() =>
              setShowConnectionSettings(
                (current) =>
                  !current
              )
            }
          >

            <Settings2 size={14} />

            Account

            <ChevronDown size={12} />

          </button>

        </div>

      </section>

      {/* ==================================================
          CONNECTION DROPDOWN
      ================================================== */}

      {showConnectionSettings && (
        <section className="threads-connection-panel">

          <div>

            <span className="threads-section-kicker">
              THREADS CONNECTION
            </span>

            <strong>
              Publishing account
            </strong>

            <span>
              {user.email}
            </span>

          </div>

          <div className="threads-connection-status">

            <CheckCircle2 size={14} />

            Firebase authentication active

          </div>

          <button
            type="button"
            onClick={
              handleConnect
            }
          >

            <Settings2 size={13} />

            Manage Connection

          </button>

          <button
            type="button"
            className="threads-logout-button"
            onClick={
              handleThreadsLogout
            }
          >

            <LogOut size={13} />

            Logout

          </button>

        </section>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <section className="threads-stats-grid">

        <ThreadsStatCard
          label="FOLLOWERS"
          value={formatNumber(
            stats.followers
          )}
          growth={
            stats.followersGrowth
          }
          description="from Threads account"
          icon={Users}
          variant="threads-stat-purple"
        />

        <ThreadsStatCard
          label="POSTS PUBLISHED"
          value={formatNumber(
            stats.posts
          )}
          growth={
            stats.postsGrowth
          }
          description="from Firestore"
          icon={Send}
          variant="threads-stat-orange"
        />

        <ThreadsStatCard
          label="ENGAGEMENT RATE"
          value={formatPercentage(
            stats.engagement
          )}
          growth={
            stats.engagementGrowth
          }
          description="likes + comments + reposts / reach"
          icon={Heart}
          variant="threads-stat-cyan"
        />

        <ThreadsStatCard
          label="TOTAL REACH"
          value={formatCompactNumber(
            stats.reach
          )}
          growth={
            stats.reachGrowth
          }
          description="from Threads metrics"
          icon={TrendingUp}
          variant="threads-stat-green"
        />

      </section>

      {/* ==================================================
          EXTRA METRICS
      ================================================== */}

      <section className="threads-insights-grid">

        <QuickInsight
          icon={Heart}
          title={`${formatNumber(
            stats.likes
          )} likes`}
          description="Total likes from published Threads"
          variant="purple"
        />

        <QuickInsight
          icon={MessageCircle}
          title={`${formatNumber(
            stats.comments
          )} comments`}
          description="Total comments from published Threads"
          variant="cyan"
        />

        <QuickInsight
          icon={Repeat2}
          title={`${formatNumber(
            stats.reposts
          )} reposts`}
          description="Total reposts from published Threads"
          variant="orange"
        />

      </section>

      {/* ==================================================
          COMPOSER
      ================================================== */}

      {showComposer && (
        <ThreadsComposer
          value={
            composerText
          }
          setValue={
            setComposerText
          }
          onPublish={
            handlePublish
          }
          onSchedule={
            handleSchedule
          }
          onClose={
            closeComposer
          }
          editingPost={
            editingPost
          }
          onSaveEdit={
            handleSaveEdit
          }
          saving={
            saving
          }
        />
      )}

      {/* ==================================================
          CONTENT COMMAND CENTER
      ================================================== */}

      <section className="threads-content-panel">

        <div className="threads-content-header">

          <div>

            <span className="threads-section-kicker">
              CONTENT COMMAND CENTER
            </span>

            <h2>
              Your Threads
            </h2>

            <p>
              Manage your drafts, scheduled and
              published posts.
            </p>

          </div>

          <button
            type="button"
            className="threads-secondary-button"
            onClick={
              openComposer
            }
          >

            <Plus size={13} />

            Create Post

          </button>

        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="threads-filter-row">

          <div className="threads-filter-tabs">

            {statusFilters.map(
              (filter) => {

                const count =
                  filter ===
                  "All Posts"
                    ? posts.length
                    : posts.filter(
                        (post) =>
                          post.status ===
                          filter
                      ).length;

                return (
                  <button
                    type="button"
                    key={
                      filter
                    }
                    className={
                      activeFilter ===
                      filter
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveFilter(
                        filter
                      )
                    }
                  >

                    {filter}

                    <span>
                      {count}
                    </span>

                  </button>
                );
              }
            )}

          </div>

          <div className="threads-filter-sort">

            <span>
              Sort by
            </span>

            <button type="button">

              Latest

              <ChevronDown
                size={12}
              />

            </button>

          </div>

        </div>

        {/* ==================================================
            TABLE HEADER
        ================================================== */}

        <div className="threads-table-header">

          <span>
            THREAD
          </span>

          <span>
            STATUS
          </span>

          <span>
            ACTIONS
          </span>

        </div>

        {/* ==================================================
            POSTS
        ================================================== */}

        <div className="threads-post-list">

          {loading ? (

            <div className="threads-empty-posts">

              <div>

                <RefreshCw
                  size={22}
                  className="threads-refresh-spinning"
                />

              </div>

              <strong>
                Loading Threads...
              </strong>

              <span>
                Reading your posts from Firestore.
              </span>

            </div>

          ) : filteredPosts.length ===
            0 ? (

            <div className="threads-empty-posts">

              <div>

                <MessageCircle
                  size={22}
                />

              </div>

              <strong>
                No posts found
              </strong>

              <span>
                Create a new Thread to get started.
              </span>

              <button
                type="button"
                className="threads-primary-button"
                onClick={
                  openComposer
                }
              >

                <Plus size={13} />

                Create Thread

              </button>

            </div>

          ) : (

            filteredPosts.map(
              (post) => (
                <PostRow
                  key={
                    post.id
                  }
                  post={
                    post
                  }
                  onEdit={
                    handleEdit
                  }
                  onDelete={
                    handleDelete
                  }
                  onDuplicate={
                    handleDuplicate
                  }
                />
              )
            )

          )}

        </div>

      </section>

      {/* ==================================================
          INSIGHTS
      ================================================== */}

      <section className="threads-insights-section">

        <div className="threads-section-heading">

          <div>

            <span className="threads-section-kicker">
              PUBLISHING INSIGHTS
            </span>

            <h2>
              Threads Performance
            </h2>

          </div>

          {onNavigate && (
            <button
              type="button"
              className="threads-text-button"
              onClick={() =>
                onNavigate(
                  "analytics"
                )
              }
            >

              View Analytics

              <ArrowUpRight
                size={12}
              />

            </button>
          )}

        </div>

        <div className="threads-insights-grid">

          <QuickInsight
            icon={Zap}
            title="Best posting time"
            description="8:00 PM — highest engagement window"
            variant="purple"
          />

          <QuickInsight
            icon={TrendingUp}
            title="Metrics ready"
            description={`${posts.length} Thread records loaded with Firestore metrics`}
            variant="cyan"
          />

          <QuickInsight
            icon={Sparkles}
            title="AI content opportunity"
            description="Connect AI Studio to generate your next Thread"
            variant="orange"
          />

        </div>

      </section>

      {/* ==================================================
          FOOTER STATUS
      ================================================== */}

      <section className="threads-system-status">

        <div>

          <span className="threads-system-dot" />

          <strong>
            Threads Publishing Engine
          </strong>

          <span>
            Firebase Auth + Firestore Ready
          </span>

        </div>

        <div>

          <Clock3 size={12} />

          Last synced

          {loading
            ? "..."
            : " successfully"}

        </div>

      </section>

      {/* ==================================================
          TOAST
      ================================================== */}

      {toast && (
        <div className="threads-toast">

          <CheckCircle2 size={15} />

          <span>
            {toast}
          </span>

        </div>
      )}

    </div>
  );
}