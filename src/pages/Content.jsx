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
  FileText,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import "./Content.css";

const CONTENT_COLLECTION = "content";

// ======================================================
// CONTENT TYPES
// ======================================================

const contentTypeOptions = [
  "All Types",
  "Trending",
  "Inspirational",
  "Motivation",
  "Emotional",
  "Business",
];

const editableContentTypes = contentTypeOptions.filter(
  (item) => item !== "All Types"
);

// ======================================================
// TYPE CONFIG
// ======================================================

const typeConfig = {
  Trending: {
    icon: Flame,
    iconClass: "orange",
    category: "trending",
  },

  Inspirational: {
    icon: Sparkles,
    iconClass: "purple",
    category: "quotes",
  },

  Motivation: {
    icon: Zap,
    iconClass: "cyan",
    category: "viral",
  },

  Emotional: {
    icon: Heart,
    iconClass: "pink",
    category: "emotional",
  },

  Business: {
    icon: Sparkles,
    iconClass: "purple",
    category: "trending",
  },
};

// ======================================================
// STATUS CONFIG
// ======================================================

const statusConfig = {
  all: {
    label: "All Content",
  },

  draft: {
    label: "Draft",
  },

  scheduled: {
    label: "Scheduled",
  },

  published: {
    label: "Published",
  },
};

// ======================================================
// HELPERS
// ======================================================

function getTypeConfig(type) {
  return (
    typeConfig[type] || {
      icon: FileText,
      iconClass: "purple",
      category: "general",
    }
  );
}

function getTimestampValue(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  return 0;
}

function formatSchedule(item) {
  if (!item) {
    return "Not scheduled";
  }

  if (item.status === "published") {
    return item.scheduled || "Published";
  }

  if (item.scheduled) {
    return item.scheduled;
  }

  if (item.date && item.time) {
    return `${item.date}, ${item.time}`;
  }

  return "Not scheduled";
}

function formatCreatedAt(value) {
  if (!value) {
    return "Recently created";
  }

  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toLocaleString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (value instanceof Date) {
      return value.toLocaleString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  } catch (error) {
    console.error("Date formatting error:", error);
  }

  return "Recently created";
}

function getDateInputValue() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrowDate() {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();

  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");

  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({ status }) {
  const normalized = String(status || "draft").toLowerCase();

  const config = {
    draft: {
      label: "DRAFT",
      className: "draft",
    },

    scheduled: {
      label: "SCHEDULED",
      className: "scheduled",
    },

    published: {
      label: "PUBLISHED",
      className: "published",
    },
  };

  const current = config[normalized] || config.draft;

  return (
    <span
      className={`content-status-badge ${current.className}`}
    >
      <span className="status-dot" />
      {current.label}
    </span>
  );
}

// ======================================================
// TYPE BADGE
// ======================================================

function TypeBadge({ item }) {
  const config = getTypeConfig(item?.type);

  const Icon = config.icon;

  return (
    <span
      className={`content-type-badge ${config.iconClass}`}
    >
      <Icon size={11} />
      {item?.type || "Content"}
    </span>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Content({ onNavigate }) {
  // ====================================================
  // STATE
  // ====================================================

  const [contents, setContents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeStatus, setActiveStatus] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [typeFilter, setTypeFilter] = useState("All Types");

  const [selectedContent, setSelectedContent] = useState(null);

  const [menuId, setMenuId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);

  const [showEdit, setShowEdit] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [publishingId, setPublishingId] = useState(null);

  const [schedulingId, setSchedulingId] = useState(null);

  // ====================================================
  // CREATE FORM
  // ====================================================

  const [newTitle, setNewTitle] = useState("");

  const [newBody, setNewBody] = useState("");

  const [newType, setNewType] = useState("Inspirational");

  // ====================================================
  // EDIT FORM
  // ====================================================

  const [editTitle, setEditTitle] = useState("");

  const [editBody, setEditBody] = useState("");

  const [editType, setEditType] = useState("Inspirational");

  // ====================================================
  // SCHEDULE FORM
  // ====================================================

  const [scheduleDate, setScheduleDate] =
    useState(getTomorrowDate());

  const [scheduleTime, setScheduleTime] =
    useState("09:00");

  // ====================================================
  // FIRESTORE REALTIME LISTENER
  // ====================================================

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      collection(db, CONTENT_COLLECTION),

      (snapshot) => {
        const data = snapshot.docs
          .map((item) => {
            const raw = item.data();

            const config = getTypeConfig(raw.type);

            return {
              id: item.id,

              title: raw.title || "Untitled Content",

              body:
                raw.body ||
                raw.content ||
                raw.description ||
                "",

              excerpt:
                raw.excerpt ||
                raw.body ||
                raw.content ||
                "",

              type: raw.type || "Inspirational",

              category:
                raw.category || config.category,

              language:
                raw.language || "Bahasa Melayu",

              platform:
                raw.platform || "Threads",

              status: String(
                raw.status || "draft"
              ).toLowerCase(),

              scheduled: raw.scheduled || "",

              date: raw.date || "",

              time: raw.time || "",

              scheduledAt:
                raw.scheduledAt || null,

              tags: Array.isArray(raw.tags)
                ? raw.tags
                : [],

              createdAt:
                raw.createdAt || null,

              updatedAt:
                raw.updatedAt || null,

              publishedAt:
                raw.publishedAt || null,
            };
          })
          .sort(
            (a, b) =>
              getTimestampValue(b.createdAt) -
              getTimestampValue(a.createdAt)
          );

        setContents(data);

        setSelectedContent((current) => {
          if (!current) {
            return null;
          }

          return (
            data.find(
              (item) => item.id === current.id
            ) || null
          );
        });

        setLoading(false);
      },

      (firestoreError) => {
        console.error(
          "Content Firestore error:",
          firestoreError
        );

        if (
          firestoreError?.code ===
          "permission-denied"
        ) {
          setError(
            "Firestore permission denied. Please check your Security Rules and sign-in status."
          );
        } else {
          setError(
            "Unable to load content from Firestore."
          );
        }

        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ====================================================

  useEffect(() => {
    const handleDocumentClick = () => {
      setMenuId(null);
    };

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick
      );
    };
  }, []);

  // ====================================================
  // ESCAPE KEY
  // ====================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setMenuId(null);

      if (showCreate) {
        setShowCreate(false);
      }

      if (showEdit) {
        setShowEdit(false);
      }

      if (showSchedule) {
        setShowSchedule(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    showCreate,
    showEdit,
    showSchedule,
  ]);

  // ====================================================
  // NAVIGATION
  // ====================================================

  const navigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ====================================================
  // FILTER
  // ====================================================

  const filteredContent = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return contents.filter((item) => {
      const matchesStatus =
        activeStatus === "all" ||
        item.status === activeStatus;

      const matchesType =
        typeFilter === "All Types" ||
        item.type === typeFilter;

      const searchableText = [
        item.title,
        item.body,
        item.type,
        item.language,
        item.platform,
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesStatus &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    contents,
    activeStatus,
    typeFilter,
    searchQuery,
  ]);

  // ====================================================
  // COUNTS
  // ====================================================

  const counts = useMemo(() => {
    return {
      all: contents.length,

      draft: contents.filter(
        (item) =>
          item.status === "draft"
      ).length,

      scheduled: contents.filter(
        (item) =>
          item.status === "scheduled"
      ).length,

      published: contents.filter(
        (item) =>
          item.status === "published"
      ).length,
    };
  }, [contents]);

  // ====================================================
  // COPY
  // ====================================================

  const handleCopy = async (item) => {
    const hashtags =
      item.tags?.length > 0
        ? item.tags.join(" ")
        : "";

    const copyText = hashtags
      ? `${item.body}\n\n${hashtags}`
      : item.body;

    try {
      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(
          copyText
        );
      } else {
        const textarea =
          document.createElement("textarea");

        textarea.value = copyText;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setCopiedId(item.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch (copyError) {
      console.error(
        "Copy failed:",
        copyError
      );

      setError(
        "Unable to copy content to clipboard."
      );
    }
  };

  // ====================================================
  // CREATE CONTENT
  // ====================================================

  const handleCreate = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const title = newTitle.trim();

    const body = newBody.trim();

    if (!body) {
      setError(
        "Please enter some content before saving."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const config = getTypeConfig(newType);

      await addDoc(
        collection(
          db,
          CONTENT_COLLECTION
        ),
        {
          title:
            title ||
            "Untitled Content",

          body,

          excerpt: body,

          type: newType,

          category:
            config.category,

          language:
            "Bahasa Melayu",

          platform:
            "Threads",

          status:
            "draft",

          scheduled: "",

          date: "",

          time: "",

          tags: [],

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setNewTitle("");
      setNewBody("");
      setNewType(
        "Inspirational"
      );

      setShowCreate(false);
    } catch (createError) {
      console.error(
        "Create content error:",
        createError
      );

      if (
        createError?.code ===
        "permission-denied"
      ) {
        setError(
          "Firestore permission denied. Please check your Security Rules."
        );
      } else {
        setError(
          "Unable to create content."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEdit = (item) => {
    setEditTitle(
      item.title || ""
    );

    setEditBody(
      item.body || ""
    );

    setEditType(
      item.type ||
        "Inspirational"
    );

    setSelectedContent(item);

    setMenuId(null);

    setShowEdit(true);
  };

  // ====================================================
  // SAVE EDIT
  // ====================================================

  const handleEdit = async (event) => {
    event.preventDefault();

    if (
      saving ||
      !selectedContent
    ) {
      return;
    }

    const title = editTitle.trim();

    const body = editBody.trim();

    if (!body) {
      setError(
        "Content body cannot be empty."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const config =
        getTypeConfig(editType);

      await updateDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          selectedContent.id
        ),
        {
          title:
            title ||
            "Untitled Content",

          body,

          excerpt: body,

          type: editType,

          category:
            config.category,

          updatedAt:
            serverTimestamp(),
        }
      );

      setShowEdit(false);
    } catch (editError) {
      console.error(
        "Edit content error:",
        editError
      );

      if (
        editError?.code ===
        "permission-denied"
      ) {
        setError(
          "Firestore permission denied. Please check your Security Rules."
        );
      } else {
        setError(
          "Unable to update content."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (item) => {
    if (!item?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${item.title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError("");

    try {
      await deleteDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          item.id
        )
      );

      setMenuId(null);

      if (
        selectedContent?.id ===
        item.id
      ) {
        setSelectedContent(null);
      }
    } catch (deleteError) {
      console.error(
        "Delete content error:",
        deleteError
      );

      if (
        deleteError?.code ===
        "permission-denied"
      ) {
        setError(
          "Firestore permission denied. Please check your Security Rules."
        );
      } else {
        setError(
          "Unable to delete content."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ====================================================
  // DUPLICATE
  // ====================================================

  const handleDuplicate = async (
    item
  ) => {
    if (!item?.id) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const config =
        getTypeConfig(item.type);

      await addDoc(
        collection(
          db,
          CONTENT_COLLECTION
        ),
        {
          title:
            `${item.title} — Copy`,

          body:
            item.body || "",

          excerpt:
            item.body || "",

          type:
            item.type ||
            "Inspirational",

          category:
            item.category ||
            config.category,

          language:
            item.language ||
            "Bahasa Melayu",

          platform:
            item.platform ||
            "Threads",

          status:
            "draft",

          scheduled: "",

          date: "",

          time: "",

          tags:
            Array.isArray(item.tags)
              ? item.tags
              : [],

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setMenuId(null);
    } catch (duplicateError) {
      console.error(
        "Duplicate content error:",
        duplicateError
      );

      setError(
        "Unable to duplicate content."
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // PUBLISH NOW
  // ====================================================

  const handlePublish = async (
    item
  ) => {
    if (!item?.id) {
      return;
    }

    setPublishingId(item.id);
    setError("");

    try {
      await updateDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          item.id
        ),
        {
          status:
            "published",

          scheduled:
            "Just now",

          publishedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setMenuId(null);
    } catch (publishError) {
      console.error(
        "Publish content error:",
        publishError
      );

      if (
        publishError?.code ===
        "permission-denied"
      ) {
        setError(
          "Firestore permission denied. Please check your Security Rules."
        );
      } else {
        setError(
          "Unable to publish content."
        );
      }
    } finally {
      setPublishingId(null);
    }
  };

  // ====================================================
  // OPEN SCHEDULE
  // ====================================================

  const openSchedule = (item) => {
    setSelectedContent(item);

    setScheduleDate(
      item.date ||
        getTomorrowDate()
    );

    setScheduleTime(
      item.time ||
        "09:00"
    );

    setMenuId(null);

    setShowSchedule(true);
  };

  // ====================================================
  // SCHEDULE CONTENT
  // ====================================================

  const handleSchedule = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedContent?.id) {
      setError(
        "No content selected."
      );
      return;
    }

    if (schedulingId) {
      return;
    }

    if (
      !scheduleDate ||
      !scheduleTime
    ) {
      setError(
        "Please select both date and time."
      );
      return;
    }

    setSchedulingId(
      selectedContent.id
    );

    setError("");

    try {
      const scheduleDateObject =
        new Date(
          `${scheduleDate}T${scheduleTime}:00`
        );

      if (
        Number.isNaN(
          scheduleDateObject.getTime()
        )
      ) {
        throw new Error(
          "Invalid schedule date or time."
        );
      }

      const displayDate =
        scheduleDateObject.toLocaleDateString(
          "en-MY",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        );

      const displayTime =
        scheduleDateObject.toLocaleTimeString(
          "en-MY",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        );

      await updateDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          selectedContent.id
        ),
        {
          status:
            "scheduled",

          date:
            scheduleDate,

          time:
            scheduleTime,

          scheduled:
            `${displayDate}, ${displayTime}`,

          scheduledAt:
            Timestamp.fromDate(
              scheduleDateObject
            ),

          updatedAt:
            serverTimestamp(),
        }
      );

      setShowSchedule(false);

      setMenuId(null);
    } catch (scheduleError) {
      console.error(
        "SCHEDULE CONTENT ERROR",
        scheduleError
      );

      if (
        scheduleError?.code ===
        "permission-denied"
      ) {
        setError(
          "Firestore permission denied. Please make sure you are signed in and your Firestore Security Rules are deployed."
        );
      } else if (
        scheduleError?.code ===
        "failed-precondition"
      ) {
        setError(
          "Firestore is not ready. Please check your Firebase project configuration."
        );
      } else if (
        scheduleError?.code ===
        "unavailable"
      ) {
        setError(
          "Firestore is temporarily unavailable. Please try again."
        );
      } else {
        setError(
          scheduleError?.message ||
            "Unable to schedule content."
        );
      }
    } finally {
      setSchedulingId(null);
    }
  };

  // ====================================================
  // SELECT CONTENT
  // ====================================================

  const selectContent = (item) => {
    setSelectedContent(item);

    setMenuId(null);
  };

  // ====================================================
  // CLEAR FILTERS
  // ====================================================

  const clearFilters = () => {
    setSearchQuery("");

    setTypeFilter("All Types");

    setActiveStatus("all");
  };

  // ====================================================
  // EMPTY STATE
  // ====================================================

  const showEmpty =
    !loading &&
    filteredContent.length === 0;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="content-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="page-heading content-heading">

        <div className="content-heading-copy">

          <span className="page-kicker">
            CONTENT MANAGEMENT
          </span>

          <h1>
            Content
          </h1>

          <p>
            Manage, review and organize
            your AI-generated social
            content.
          </p>

        </div>

        <div className="content-heading-actions">

          <div className="content-engine-status">
            <span />
            FIRESTORE LIVE
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={14} />
            Create Content
          </button>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="content-error">

          <div className="content-error-message">
            <span className="content-error-dot" />

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            <X size={14} />
          </button>

        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="content-stats-grid">

        <button
          type="button"
          className={`content-stat-card ${
            activeStatus === "all"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveStatus("all")
          }
        >

          <div className="content-stat-top">

            <span>
              ALL CONTENT
            </span>

            <div className="content-stat-icon purple">
              <FileText size={15} />
            </div>

          </div>

          <strong>
            {counts.all}
          </strong>

          <span>
            Total content items
          </span>

        </button>

        <button
          type="button"
          className={`content-stat-card ${
            activeStatus === "draft"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveStatus("draft")
          }
        >

          <div className="content-stat-top">

            <span>
              DRAFT
            </span>

            <div className="content-stat-icon orange">
              <Edit3 size={15} />
            </div>

          </div>

          <strong>
            {counts.draft}
          </strong>

          <span>
            Waiting for review
          </span>

        </button>

        <button
          type="button"
          className={`content-stat-card ${
            activeStatus === "scheduled"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveStatus("scheduled")
          }
        >

          <div className="content-stat-top">

            <span>
              SCHEDULED
            </span>

            <div className="content-stat-icon cyan">
              <CalendarDays size={15} />
            </div>

          </div>

          <strong>
            {counts.scheduled}
          </strong>

          <span>
            Ready to publish
          </span>

        </button>

        <button
          type="button"
          className={`content-stat-card ${
            activeStatus === "published"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveStatus("published")
          }
        >

          <div className="content-stat-top">

            <span>
              PUBLISHED
            </span>

            <div className="content-stat-icon green">
              <CheckCircle2 size={15} />
            </div>

          </div>

          <strong>
            {counts.published}
          </strong>

          <span>
            Successfully published
          </span>

        </button>

      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="content-toolbar panel">

        <div className="content-tabs">

          {Object.entries(
            statusConfig
          ).map(([key, config]) => (
            <button
              type="button"
              key={key}
              className={
                activeStatus === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveStatus(key)
              }
            >

              {config.label}

              <span>
                {counts[key]}
              </span>

            </button>
          ))}

        </div>

        <div className="content-toolbar-controls">

          <div className="content-search">

            <Search size={14} />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search content..."
            />

            {searchQuery && (
              <button
                type="button"
                className="content-search-clear"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}

          </div>

          <div className="content-filter">

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
            >

              {contentTypeOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

            <ChevronDown size={12} />

          </div>

        </div>

      </div>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="content-main-grid">

        {/* ==================================================
            CONTENT LIST
        ================================================== */}

        <div className="content-list-panel panel">

          <div className="content-list-header">

            <div>

              <span className="page-kicker">
                CONTENT LIBRARY
              </span>

              <h2>
                {loading
                  ? "Loading..."
                  : `${filteredContent.length} content ${
                      filteredContent.length ===
                      1
                        ? "item"
                        : "items"
                    }`}
              </h2>

            </div>

            <span className="content-list-note">

              <span className="live-dot" />

              {loading
                ? "Connecting..."
                : "Live Firestore data"}

            </span>

          </div>

          <div className="content-list">

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading ? (

              <div className="content-empty-state">

                <div className="content-empty-icon loading">
                  <Sparkles size={22} />
                </div>

                <strong>
                  Loading content...
                </strong>

                <span>
                  Connecting to your
                  Firestore content library.
                </span>

              </div>

            ) : showEmpty ? (

              /* ==================================================
                 EMPTY
              ================================================== */

              <div className="content-empty-state">

                <div className="content-empty-icon">
                  <FileText size={22} />
                </div>

                <strong>
                  {contents.length === 0
                    ? "Your content library is empty"
                    : "No content found"}
                </strong>

                <span>
                  {contents.length === 0
                    ? "Create your first content item to start building your library."
                    : "Try adjusting your search, status or content type filter."}
                </span>

                {contents.length === 0 ? (

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreate(true)
                    }
                  >
                    <Plus size={13} />
                    Create your first content
                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>

                )}

              </div>

            ) : (

              /* ==================================================
                 CONTENT
              ================================================== */

              filteredContent.map(
                (item) => {

                  const config =
                    getTypeConfig(
                      item.type
                    );

                  const Icon =
                    config.icon;

                  const isSelected =
                    selectedContent?.id ===
                    item.id;

                  return (
                    <div
                      className={`content-list-item ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      key={item.id}
                      onClick={() =>
                        selectContent(item)
                      }
                    >

                      {/* ICON */}

                      <div
                        className={`content-list-icon ${config.iconClass}`}
                      >
                        <Icon size={15} />
                      </div>

                      {/* COPY */}

                      <div className="content-list-copy">

                        <div className="content-list-title-row">

                          <strong>
                            {item.title}
                          </strong>

                          <TypeBadge
                            item={item}
                          />

                        </div>

                        <p>
                          {item.body ||
                            "No content body."}
                        </p>

                        <div className="content-list-meta">

                          <span>
                            <MessageCircle
                              size={11}
                            />
                            {item.platform}
                          </span>

                          <span>
                            <span className="tiny-icon">
                              ◎
                            </span>
                            {item.language}
                          </span>

                          <span>
                            <Clock3
                              size={11}
                            />
                            {formatSchedule(
                              item
                            )}
                          </span>

                        </div>

                      </div>

                      {/* RIGHT */}

                      <div className="content-list-right">

                        <StatusBadge
                          status={
                            item.status
                          }
                        />

                        <div className="content-item-menu">

                          <button
                            type="button"
                            className="content-more-button"
                            aria-label="More options"
                            onClick={(
                              event
                            ) => {

                              event.stopPropagation();

                              setMenuId(
                                (current) =>
                                  current ===
                                  item.id
                                    ? null
                                    : item.id
                              );

                            }}
                          >
                            <MoreHorizontal
                              size={15}
                            />
                          </button>

                          {menuId ===
                            item.id && (

                            <div
                              className="content-dropdown"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    item
                                  )
                                }
                              >
                                <Edit3
                                  size={13}
                                />
                                View / Edit
                              </button>

                              {item.status !==
                                "published" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openSchedule(
                                      item
                                    )
                                  }
                                >
                                  <CalendarDays
                                    size={13}
                                  />
                                  Schedule
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDuplicate(
                                    item
                                  )
                                }
                                disabled={saving}
                              >
                                <Copy
                                  size={13}
                                />
                                Duplicate
                              </button>

                              {item.status !==
                                "published" && (
                                <button
                                  type="button"
                                  disabled={
                                    publishingId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    handlePublish(
                                      item
                                    )
                                  }
                                >
                                  <Send
                                    size={13}
                                  />

                                  {publishingId ===
                                  item.id
                                    ? "Publishing..."
                                    : "Publish now"}
                                </button>
                              )}

                              <button
                                type="button"
                                className="danger"
                                disabled={
                                  deletingId ===
                                  item.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                              >
                                <Trash2
                                  size={13}
                                />

                                {deletingId ===
                                item.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          )}

                        </div>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

        {/* ==================================================
            PREVIEW
        ================================================== */}

        <div className="content-preview-panel panel">

          {!selectedContent ? (

            <div className="content-preview-empty">

              <div className="content-preview-empty-icon">
                <Sparkles size={22} />
              </div>

              <span className="page-kicker">
                CONTENT PREVIEW
              </span>

              <h2>
                Select a content item
              </h2>

              <p>
                Click any content from
                the Firestore library
                to preview it here.
              </p>

            </div>

          ) : (

            <>

              {/* HEADER */}

              <div className="content-preview-header">

                <div>

                  <span className="page-kicker">
                    CONTENT PREVIEW
                  </span>

                  <h2>
                    Threads Preview
                  </h2>

                </div>

                <StatusBadge
                  status={
                    selectedContent.status
                  }
                />

              </div>

              {/* THREADS CARD */}

              <div className="threads-preview-card">

                <div className="threads-preview-user">

                  <div className="threads-preview-avatar">
                    AR
                  </div>

                  <div className="threads-preview-user-copy">

                    <strong>
                      AR Marketing
                      Solutions
                    </strong>

                    <span>
                      @armarketingsolutions
                    </span>

                  </div>

                  <MoreHorizontal
                    size={15}
                  />

                </div>

                <div className="threads-preview-content">

                  <div className="threads-preview-type">

                    <TypeBadge
                      item={
                        selectedContent
                      }
                    />

                  </div>

                  <p>
                    {selectedContent.body ||
                      "No content available."}
                  </p>

                  {selectedContent.tags
                    ?.length > 0 && (

                    <div className="threads-preview-hashtags">
                      {selectedContent.tags.join(
                        " "
                      )}
                    </div>

                  )}

                </div>

                <div className="threads-preview-actions">

                  <span>
                    <Heart size={14} />
                  </span>

                  <span>
                    <MessageCircle
                      size={14}
                    />
                  </span>

                  <span>
                    ↻
                  </span>

                  <span>
                    <Send size={14} />
                  </span>

                </div>

              </div>

              {/* DETAILS */}

              <div className="content-preview-details">

                <div className="content-detail-row">

                  <span>
                    Content type
                  </span>

                  <strong>
                    {selectedContent.type}
                  </strong>

                </div>

                <div className="content-detail-row">

                  <span>
                    Language
                  </span>

                  <strong>
                    {selectedContent.language}
                  </strong>

                </div>

                <div className="content-detail-row">

                  <span>
                    Platform
                  </span>

                  <strong>
                    {selectedContent.platform}
                  </strong>

                </div>

                <div className="content-detail-row">

                  <span>
                    Schedule
                  </span>

                  <strong>
                    {formatSchedule(
                      selectedContent
                    )}
                  </strong>

                </div>

                {selectedContent.createdAt && (

                  <div className="content-detail-row">

                    <span>
                      Created
                    </span>

                    <strong>
                      {formatCreatedAt(
                        selectedContent.createdAt
                      )}
                    </strong>

                  </div>

                )}

              </div>

              {/* ACTIONS */}

              <div className="content-preview-actions">

                <button
                  type="button"
                  className="preview-secondary-button"
                  onClick={() =>
                    handleCopy(
                      selectedContent
                    )
                  }
                >

                  {copiedId ===
                  selectedContent.id ? (
                    <>
                      <Check size={13} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copy
                    </>
                  )}

                </button>

                {selectedContent.status !==
                  "published" && (

                  <button
                    type="button"
                    className="preview-secondary-button"
                    onClick={() =>
                      openSchedule(
                        selectedContent
                      )
                    }
                  >
                    <CalendarDays
                      size={13}
                    />
                    Schedule
                  </button>

                )}

                <button
                  type="button"
                  className="preview-secondary-button"
                  onClick={() =>
                    openEdit(
                      selectedContent
                    )
                  }
                >
                  <Edit3 size={13} />
                  Edit
                </button>

                {selectedContent.status !==
                  "published" && (

                  <button
                    type="button"
                    className="preview-primary-button"
                    disabled={
                      publishingId ===
                      selectedContent.id
                    }
                    onClick={() =>
                      handlePublish(
                        selectedContent
                      )
                    }
                  >

                    <Send size={13} />

                    {publishingId ===
                    selectedContent.id
                      ? "Publishing..."
                      : "Publish"}

                  </button>

                )}

              </div>

            </>

          )}

        </div>

      </div>

      {/* ==================================================
          BOTTOM ACTIONS
      ================================================== */}

      <section className="content-bottom-grid">

        <button
          type="button"
          className="content-bottom-card purple"
          onClick={() =>
            navigate("studio")
          }
        >

          <div className="content-bottom-icon">
            <Sparkles size={17} />
          </div>

          <div>

            <strong>
              Generate more content
            </strong>

            <span>
              Use AI Studio to create
              your next post.
            </span>

          </div>

          <ArrowUpRight size={14} />

        </button>

        <button
          type="button"
          className="content-bottom-card orange"
          onClick={() =>
            navigate("calendar")
          }
        >

          <div className="content-bottom-icon">
            <CalendarDays size={17} />
          </div>

          <div>

            <strong>
              Plan your content
            </strong>

            <span>
              View and manage your
              publishing calendar.
            </span>

          </div>

          <ArrowUpRight size={14} />

        </button>

        <button
          type="button"
          className="content-bottom-card cyan"
          onClick={() =>
            navigate("autopilot")
          }
        >

          <div className="content-bottom-icon">
            <Zap size={17} />
          </div>

          <div>

            <strong>
              Enable Autopilot
            </strong>

            <span>
              Let AI prepare content
              automatically.
            </span>

          </div>

          <ArrowUpRight size={14} />

        </button>

      </section>

      {/* ==================================================
          CREATE MODAL
      ================================================== */}

      {showCreate && (

        <div
          className="content-modal-backdrop"
          onClick={() =>
            setShowCreate(false)
          }
        >

          <div
            className="content-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="content-modal-header">

              <div>

                <span className="page-kicker">
                  NEW CONTENT
                </span>

                <h2>
                  Create Content
                </h2>

                <p>
                  Create a new content
                  item in your Firestore
                  library.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="content-modal-close"
              >
                <X size={17} />
              </button>

            </div>

            <form
              className="content-create-form"
              onSubmit={handleCreate}
            >

              <div className="content-create-field">

                <label>
                  TITLE
                </label>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Jangan takut untuk bermula..."
                />

              </div>

              <div className="content-create-field">

                <label>
                  CONTENT
                </label>

                <textarea
                  value={newBody}
                  onChange={(event) =>
                    setNewBody(
                      event.target.value
                    )
                  }
                  placeholder="Tulis content anda di sini..."
                  rows={7}
                  required
                />

              </div>

              <div className="content-create-field">

                <label>
                  CONTENT TYPE
                </label>

                <div className="content-create-select">

                  <select
                    value={newType}
                    onChange={(event) =>
                      setNewType(
                        event.target.value
                      )
                    }
                  >

                    {editableContentTypes.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={13}
                  />

                </div>

              </div>

              <div className="content-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-create-button"
                  disabled={saving}
                >

                  <Plus size={14} />

                  {saving
                    ? "Saving..."
                    : "Create Draft"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==================================================
          EDIT MODAL
      ================================================== */}

      {showEdit &&
        selectedContent && (

        <div
          className="content-modal-backdrop"
          onClick={() =>
            setShowEdit(false)
          }
        >

          <div
            className="content-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="content-modal-header">

              <div>

                <span className="page-kicker">
                  EDIT CONTENT
                </span>

                <h2>
                  View / Edit
                </h2>

                <p>
                  Update your content
                  directly in Firestore.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEdit(false)
                }
                className="content-modal-close"
              >
                <X size={17} />
              </button>

            </div>

            <form
              className="content-create-form"
              onSubmit={handleEdit}
            >

              <div className="content-create-field">

                <label>
                  TITLE
                </label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="content-create-field">

                <label>
                  CONTENT
                </label>

                <textarea
                  value={editBody}
                  onChange={(event) =>
                    setEditBody(
                      event.target.value
                    )
                  }
                  rows={9}
                  required
                />

              </div>

              <div className="content-create-field">

                <label>
                  CONTENT TYPE
                </label>

                <div className="content-create-select">

                  <select
                    value={editType}
                    onChange={(event) =>
                      setEditType(
                        event.target.value
                      )
                    }
                  >

                    {editableContentTypes.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={13}
                  />

                </div>

              </div>

              <div className="content-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowEdit(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-create-button"
                  disabled={saving}
                >

                  <Check size={14} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==================================================
          SCHEDULE MODAL
      ================================================== */}

      {showSchedule &&
        selectedContent && (

        <div
          className="content-modal-backdrop"
          onClick={() =>
            setShowSchedule(false)
          }
        >

          <div
            className="content-modal schedule-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="content-modal-header">

              <div>

                <span className="page-kicker">
                  PUBLISHING
                </span>

                <h2>
                  Schedule Content
                </h2>

                <p>
                  Choose when this content
                  should be published.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSchedule(false)
                }
                className="content-modal-close"
              >
                <X size={17} />
              </button>

            </div>

            <form
              className="content-create-form"
              onSubmit={
                handleSchedule
              }
            >

              <div className="content-schedule-summary">

                <div className="schedule-summary-icon">
                  <CalendarDays
                    size={17}
                  />
                </div>

                <div>

                  <strong>
                    {selectedContent.title}
                  </strong>

                  <span>
                    {selectedContent.platform}
                    {" · "}
                    {selectedContent.type}
                  </span>

                </div>

              </div>

              <div className="content-create-field">

                <label>
                  DATE
                </label>

                <input
                  type="date"
                  value={
                    scheduleDate
                  }
                  min={
                    getDateInputValue()
                  }
                  onChange={(event) =>
                    setScheduleDate(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              <div className="content-create-field">

                <label>
                  TIME
                </label>

                <input
                  type="time"
                  value={
                    scheduleTime
                  }
                  onChange={(event) =>
                    setScheduleTime(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              <div className="content-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowSchedule(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-create-button"
                  disabled={
                    schedulingId ===
                    selectedContent.id
                  }
                >

                  <CalendarDays
                    size={14}
                  />

                  {schedulingId ===
                  selectedContent.id
                    ? "Scheduling..."
                    : "Schedule Post"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}