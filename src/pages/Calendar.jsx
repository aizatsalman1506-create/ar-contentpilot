import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import "./Calendar.css";

// ======================================================
// FIRESTORE
// ======================================================

const CONTENT_COLLECTION = "content";

// ======================================================
// MONTHS
// ======================================================

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

// ======================================================
// TYPE CONFIG
// ======================================================

const typeConfig = {
  Trending: {
    icon: Flame,
    className: "orange",
  },

  Inspirational: {
    icon: Sparkles,
    className: "purple",
  },

  Motivation: {
    icon: Zap,
    className: "cyan",
  },

  Emotional: {
    icon: Heart,
    className: "pink",
  },

  Business: {
    icon: Sparkles,
    className: "purple",
  },
};

function getTypeConfig(type) {
  return (
    typeConfig[type] || {
      icon: FileText,
      className: "purple",
    }
  );
}

// ======================================================
// HELPERS
// ======================================================

function getDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return getDateKey(new Date());
}

function parseDateKey(dateKey) {
  if (!dateKey) {
    return null;
  }

  const [year, month, day] =
    dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function getTimestampValue(value) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  return 0;
}

function getContentDate(item) {
  if (item.date) {
    return item.date;
  }

  if (item.scheduledAt) {
    const date =
      typeof item.scheduledAt.toDate ===
      "function"
        ? item.scheduledAt.toDate()
        : new Date(
            getTimestampValue(
              item.scheduledAt
            )
          );

    if (!Number.isNaN(date.getTime())) {
      return getDateKey(date);
    }
  }

  return "";
}

function formatTime(item) {
  if (item.time) {
    const [hours, minutes] =
      item.time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours) || 0,
      Number(minutes) || 0,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-MY",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  return "";
}

function formatDateLong(dateKey) {
  const date =
    parseDateKey(dateKey);

  if (!date) {
    return "No date selected";
  }

  return date.toLocaleDateString(
    "en-MY",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatShortDate(dateKey) {
  const date =
    parseDateKey(dateKey);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    "en-MY",
    {
      day: "numeric",
      month: "short",
    }
  );
}

// ======================================================
// STATUS
// ======================================================

function StatusBadge({ status }) {
  const normalized =
    String(
      status || "draft"
    ).toLowerCase();

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

  const current =
    config[normalized] ||
    config.draft;

  return (
    <span
      className={`calendar-status-badge ${current.className}`}
    >
      <span />
      {current.label}
    </span>
  );
}

// ======================================================
// MAIN
// ======================================================

export default function Calendar({
  onNavigate,
}) {
  // ====================================================
  // STATE
  // ====================================================

  const [contents, setContents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [currentMonth, setCurrentMonth] =
    useState(() => {
      const now = new Date();

      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
    });

  const [selectedDate, setSelectedDate] =
    useState(getTodayKey());

  const [selectedContent, setSelectedContent] =
    useState(null);

  const [menuId, setMenuId] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [showSchedule, setShowSchedule] =
    useState(false);

  const [scheduleDate, setScheduleDate] =
    useState(getTodayKey());

  const [scheduleTime, setScheduleTime] =
    useState("09:00");

  // ====================================================
  // FIRESTORE LISTENER
  // ====================================================

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe =
      onSnapshot(
        collection(
          db,
          CONTENT_COLLECTION
        ),
        (snapshot) => {
          const data =
            snapshot.docs
              .map((item) => {
                const raw =
                  item.data();

                return {
                  id: item.id,

                  title:
                    raw.title ||
                    "Untitled Content",

                  body:
                    raw.body ||
                    raw.content ||
                    "",

                  type:
                    raw.type ||
                    "Inspirational",

                  status:
                    String(
                      raw.status ||
                        "draft"
                    ).toLowerCase(),

                  platform:
                    raw.platform ||
                    "Threads",

                  language:
                    raw.language ||
                    "Bahasa Melayu",

                  date:
                    raw.date ||
                    "",

                  time:
                    raw.time ||
                    "",

                  scheduled:
                    raw.scheduled ||
                    "",

                  scheduledAt:
                    raw.scheduledAt ||
                    null,

                  tags:
                    Array.isArray(
                      raw.tags
                    )
                      ? raw.tags
                      : [],

                  createdAt:
                    raw.createdAt ||
                    null,

                  updatedAt:
                    raw.updatedAt ||
                    null,
                };
              })
              .sort(
                (a, b) =>
                  getTimestampValue(
                    b.createdAt
                  ) -
                  getTimestampValue(
                    a.createdAt
                  )
              );

          setContents(data);

          setSelectedContent(
            (current) => {
              if (!current) {
                return null;
              }

              return (
                data.find(
                  (item) =>
                    item.id ===
                    current.id
                ) || null
              );
            }
          );

          setLoading(false);
        },
        (firestoreError) => {
          console.error(
            "Calendar Firestore error:",
            firestoreError
          );

          setError(
            "Unable to load calendar data from Firestore."
          );

          setLoading(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // CLOSE MENU
  // ====================================================

  useEffect(() => {
    const handleClick = () => {
      setMenuId(null);
    };

    document.addEventListener(
      "click",
      handleClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick
      );
    };
  }, []);

  // ====================================================
  // CALENDAR DAYS
  // ====================================================

  const calendarDays = useMemo(() => {
    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );

    const daysInMonth =
      lastDay.getDate();

    const startingDay =
      firstDay.getDay();

    const totalCells =
      Math.ceil(
        (startingDay +
          daysInMonth) /
          7
      ) * 7;

    const days = [];

    for (
      let index = 0;
      index < totalCells;
      index += 1
    ) {
      const dayNumber =
        index -
        startingDay +
        1;

      if (
        dayNumber < 1 ||
        dayNumber >
          daysInMonth
      ) {
        days.push(null);
        continue;
      }

      const date =
        new Date(
          year,
          month,
          dayNumber
        );

      days.push({
        date,
        key: getDateKey(date),
        dayNumber,
      });
    }

    return days;
  }, [currentMonth]);

  // ====================================================
  // CONTENT BY DATE
  // ====================================================

  const contentByDate =
    useMemo(() => {
      const grouped = {};

      contents.forEach(
        (item) => {
          const dateKey =
            getContentDate(item);

          if (!dateKey) {
            return;
          }

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          grouped[dateKey].push(item);
        }
      );

      Object.keys(grouped).forEach(
        (key) => {
          grouped[key].sort(
            (a, b) => {
              const timeA =
                a.time || "99:99";

              const timeB =
                b.time || "99:99";

              return timeA.localeCompare(
                timeB
              );
            }
          );
        }
      );

      return grouped;
    }, [contents]);

  // ====================================================
  // SELECTED DAY CONTENT
  // ====================================================

  const selectedDayContent =
    useMemo(() => {
      return (
        contentByDate[
          selectedDate
        ] || []
      );
    }, [
      contentByDate,
      selectedDate,
    ]);

  // ====================================================
  // MONTH STATS
  // ====================================================

  const monthStats =
    useMemo(() => {
      const year =
        currentMonth.getFullYear();

      const month =
        currentMonth.getMonth();

      const monthContents =
        contents.filter(
          (item) => {
            const dateKey =
              getContentDate(item);

            if (!dateKey) {
              return false;
            }

            const date =
              parseDateKey(
                dateKey
              );

            if (!date) {
              return false;
            }

            return (
              date.getFullYear() ===
                year &&
              date.getMonth() ===
                month
            );
          }
        );

      return {
        total:
          monthContents.length,

        scheduled:
          monthContents.filter(
            (item) =>
              item.status ===
              "scheduled"
          ).length,

        published:
          monthContents.filter(
            (item) =>
              item.status ===
              "published"
          ).length,

        drafts:
          monthContents.filter(
            (item) =>
              item.status ===
              "draft"
          ).length,
      };
    }, [
      contents,
      currentMonth,
    ]);

  // ====================================================
  // NAVIGATION
  // ====================================================

  const previousMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const goToday = () => {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(
      getTodayKey()
    );
  };

  const selectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setSelectedContent(null);
    setMenuId(null);
  };

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
  // PUBLISH
  // ====================================================

  const handlePublish = async (
    item
  ) => {
    if (!item?.id) {
      return;
    }

    setActionLoading(
      `publish-${item.id}`
    );

    setError("");

    try {
      await updateDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          item.id
        ),
        {
          status: "published",

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
        publishError
      );

      setError(
        "Unable to publish content. Please check Firestore Security Rules."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (
    item
  ) => {
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

    setActionLoading(
      `delete-${item.id}`
    );

    setError("");

    try {
      await deleteDoc(
        doc(
          db,
          CONTENT_COLLECTION,
          item.id
        )
      );

      if (
        selectedContent?.id ===
        item.id
      ) {
        setSelectedContent(null);
      }

      setMenuId(null);
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        "Unable to delete content. Please check Firestore Security Rules."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ====================================================
  // OPEN SCHEDULE
  // ====================================================

  const openSchedule = (
    item = null
  ) => {
    if (item) {
      setSelectedContent(item);

      setScheduleDate(
        getContentDate(item) ||
          selectedDate ||
          getTodayKey()
      );

      setScheduleTime(
        item.time ||
          "09:00"
      );
    } else {
      setScheduleDate(
        selectedDate ||
          getTodayKey()
      );

      setScheduleTime(
        "09:00"
      );
    }

    setMenuId(null);
    setShowSchedule(true);
  };

  // ====================================================
  // SCHEDULE
  // ====================================================

  const handleSchedule = async (
    event
  ) => {
    event.preventDefault();

    if (
      !selectedContent?.id
    ) {
      setError(
        "Please select a content item first."
      );

      return;
    }

    if (
      !scheduleDate ||
      !scheduleTime
    ) {
      setError(
        "Please select date and time."
      );

      return;
    }

    setActionLoading(
      `schedule-${selectedContent.id}`
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
          "Invalid schedule date."
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
            scheduleDateObject,

          updatedAt:
            serverTimestamp(),
        }
      );

      setShowSchedule(false);

      setSelectedDate(
        scheduleDate
      );

      setCurrentMonth(
        new Date(
          scheduleDateObject.getFullYear(),
          scheduleDateObject.getMonth(),
          1
        )
      );
    } catch (scheduleError) {
      console.error(
        scheduleError
      );

      setError(
        scheduleError?.message ||
          "Unable to schedule content."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="calendar-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="page-heading calendar-heading">

        <div>
          <span className="page-kicker">
            CONTENT PLANNING
          </span>

          <h1>
            Calendar
          </h1>

          <p>
            Plan, schedule and manage
            your social content.
          </p>
        </div>

        <div className="calendar-heading-actions">

          <div className="calendar-live-status">
            <span />
            FIRESTORE LIVE
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              openSchedule()
            }
          >
            <Plus size={14} />
            Schedule Content
          </button>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="calendar-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={14} />
          </button>

        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="calendar-stats-grid">

        <div className="calendar-stat-card">

          <div className="calendar-stat-top">

            <span>
              THIS MONTH
            </span>

            <div className="calendar-stat-icon purple">
              <CalendarDays size={15} />
            </div>

          </div>

          <strong>
            {monthStats.total}
          </strong>

          <span>
            Content scheduled or published
          </span>

        </div>

        <div className="calendar-stat-card">

          <div className="calendar-stat-top">

            <span>
              SCHEDULED
            </span>

            <div className="calendar-stat-icon cyan">
              <Clock3 size={15} />
            </div>

          </div>

          <strong>
            {monthStats.scheduled}
          </strong>

          <span>
            Ready to publish
          </span>

        </div>

        <div className="calendar-stat-card">

          <div className="calendar-stat-top">

            <span>
              PUBLISHED
            </span>

            <div className="calendar-stat-icon green">
              <CheckCircle2 size={15} />
            </div>

          </div>

          <strong>
            {monthStats.published}
          </strong>

          <span>
            Successfully published
          </span>

        </div>

        <div className="calendar-stat-card">

          <div className="calendar-stat-top">

            <span>
              DRAFTS
            </span>

            <div className="calendar-stat-icon orange">
              <Edit3 size={15} />
            </div>

          </div>

          <strong>
            {monthStats.drafts}
          </strong>

          <span>
            Content still in draft
          </span>

        </div>

      </div>

      {/* ==================================================
          MAIN
      ================================================== */}

      <div className="calendar-main-grid">

        {/* ==================================================
            CALENDAR PANEL
        ================================================== */}

        <section className="calendar-panel panel">

          <div className="calendar-panel-header">

            <div className="calendar-month-title">

              <span className="page-kicker">
                PUBLISHING CALENDAR
              </span>

              <h2>
                {MONTHS[
                  currentMonth.getMonth()
                ]}{" "}
                {currentMonth.getFullYear()}
              </h2>

            </div>

            <div className="calendar-navigation">

              <button
                type="button"
                onClick={
                  previousMonth
                }
                aria-label="Previous month"
              >
                <ArrowLeft
                  size={14}
                />
              </button>

              <button
                type="button"
                className="calendar-today-button"
                onClick={goToday}
              >
                Today
              </button>

              <button
                type="button"
                onClick={
                  nextMonth
                }
                aria-label="Next month"
              >
                <ArrowRight
                  size={14}
                />
              </button>

            </div>

          </div>

          {/* WEEK DAYS */}

          <div className="calendar-weekdays">

            {WEEK_DAYS.map(
              (day) => (
                <div
                  key={day}
                  className="calendar-weekday"
                >
                  {day}
                </div>
              )
            )}

          </div>

          {/* DAYS */}

          <div className="calendar-grid">

            {calendarDays.map(
              (day, index) => {

                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="calendar-day empty"
                    />
                  );
                }

                const dayContent =
                  contentByDate[
                    day.key
                  ] || [];

                const isToday =
                  day.key ===
                  getTodayKey();

                const isSelected =
                  day.key ===
                  selectedDate;

                return (
                  <button
                    type="button"
                    key={day.key}
                    className={`calendar-day ${
                      isToday
                        ? "today"
                        : ""
                    } ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectDate(
                        day.key
                      )
                    }
                  >

                    <div className="calendar-day-number">

                      <span>
                        {day.dayNumber}
                      </span>

                      {isToday && (
                        <small>
                          TODAY
                        </small>
                      )}

                    </div>

                    <div className="calendar-day-items">

                      {dayContent
                        .slice(0, 3)
                        .map(
                          (
                            item
                          ) => {

                            const config =
                              getTypeConfig(
                                item.type
                              );

                            return (
                              <div
                                key={
                                  item.id
                                }
                                className={`calendar-mini-item ${config.className} ${item.status}`}
                              >

                                <span className="calendar-mini-dot" />

                                <span className="calendar-mini-time">
                                  {formatTime(
                                    item
                                  )}
                                </span>

                                <span className="calendar-mini-title">
                                  {item.title}
                                </span>

                              </div>
                            );
                          }
                        )}

                      {dayContent.length >
                        3 && (
                        <span className="calendar-more-count">
                          +
                          {dayContent.length -
                            3}{" "}
                          more
                        </span>
                      )}

                    </div>

                  </button>
                );
              }
            )}

          </div>

          {/* LEGEND */}

          <div className="calendar-legend">

            <span>
              <i className="legend-dot purple" />
              Inspirational
            </span>

            <span>
              <i className="legend-dot orange" />
              Trending
            </span>

            <span>
              <i className="legend-dot cyan" />
              Motivation
            </span>

            <span>
              <i className="legend-dot pink" />
              Emotional
            </span>

          </div>

        </section>

        {/* ==================================================
            DAY PANEL
        ================================================== */}

        <aside className="calendar-day-panel panel">

          <div className="calendar-day-panel-header">

            <div>

              <span className="page-kicker">
                SELECTED DAY
              </span>

              <h2>
                {formatShortDate(
                  selectedDate
                )}
              </h2>

              <p>
                {formatDateLong(
                  selectedDate
                )}
              </p>

            </div>

            <div className="calendar-selected-icon">
              <CalendarDays
                size={17}
              />
            </div>

          </div>

          <div className="calendar-day-summary">

            <div>
              <strong>
                {
                  selectedDayContent.length
                }
              </strong>

              <span>
                posts
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                openSchedule()
              }
            >
              <Plus size={13} />
              Add post
            </button>

          </div>

          <div className="calendar-day-list">

            {loading ? (

              <div className="calendar-day-empty">

                <div className="calendar-empty-icon loading">
                  <Sparkles size={20} />
                </div>

                <strong>
                  Loading...
                </strong>

                <span>
                  Connecting to Firestore.
                </span>

              </div>

            ) : selectedDayContent.length ===
              0 ? (

              <div className="calendar-day-empty">

                <div className="calendar-empty-icon">
                  <CalendarDays size={20} />
                </div>

                <strong>
                  Nothing scheduled
                </strong>

                <span>
                  There are no content
                  items assigned to this
                  date yet.
                </span>

                <button
                  type="button"
                  onClick={() =>
                    openSchedule()
                  }
                >
                  <Plus size={13} />
                  Schedule content
                </button>

              </div>

            ) : (

              selectedDayContent.map(
                (item) => {

                  const config =
                    getTypeConfig(
                      item.type
                    );

                  const Icon =
                    config.icon;

                  const isActive =
                    selectedContent?.id ===
                    item.id;

                  return (
                    <div
                      key={item.id}
                      className={`calendar-day-content-item ${
                        isActive
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedContent(
                          item
                        )
                      }
                    >

                      <div className="calendar-day-content-top">

                        <div
                          className={`calendar-day-content-icon ${config.className}`}
                        >
                          <Icon size={14} />
                        </div>

                        <div className="calendar-day-content-heading">

                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {formatTime(
                              item
                            )}
                          </span>

                        </div>

                        <div className="calendar-day-content-menu">

                          <button
                            type="button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setMenuId(
                                menuId ===
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
                              className="calendar-dropdown"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedContent(
                                    item
                                  )
                                }
                              >
                                <ExternalLink
                                  size={13}
                                />
                                Preview
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
                                  Reschedule
                                </button>
                              )}

                              {item.status !==
                                "published" && (
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ===
                                    `publish-${item.id}`
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

                                  {actionLoading ===
                                  `publish-${item.id}`
                                    ? "Publishing..."
                                    : "Publish now"}
                                </button>
                              )}

                              <button
                                type="button"
                                className="danger"
                                disabled={
                                  actionLoading ===
                                  `delete-${item.id}`
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

                                {actionLoading ===
                                `delete-${item.id}`
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>
                          )}

                        </div>

                      </div>

                      <p>
                        {item.body ||
                          "No content body."}
                      </p>

                      <div className="calendar-day-content-footer">

                        <StatusBadge
                          status={
                            item.status
                          }
                        />

                        <span>
                          <MessageCircle
                            size={10}
                          />
                          {item.platform}
                        </span>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </aside>

      </div>

      {/* ==================================================
          PREVIEW
      ================================================== */}

      {selectedContent && (
        <section className="calendar-preview panel">

          <div className="calendar-preview-header">

            <div>

              <span className="page-kicker">
                CONTENT PREVIEW
              </span>

              <h2>
                {selectedContent.title}
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedContent(
                  null
                )
              }
              aria-label="Close preview"
            >
              <X size={16} />
            </button>

          </div>

          <div className="calendar-preview-grid">

            <div className="calendar-threads-card">

              <div className="calendar-threads-user">

                <div className="calendar-avatar">
                  AR
                </div>

                <div>
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

              <div className="calendar-threads-body">

                <div className="calendar-preview-type">

                  {(() => {
                    const config =
                      getTypeConfig(
                        selectedContent.type
                      );

                    const Icon =
                      config.icon;

                    return (
                      <span
                        className={`calendar-preview-type-badge ${config.className}`}
                      >
                        <Icon size={11} />

                        {
                          selectedContent.type
                        }
                      </span>
                    );
                  })()}

                </div>

                <p>
                  {selectedContent.body ||
                    "No content body."}
                </p>

                {selectedContent.tags
                  ?.length > 0 && (
                  <div className="calendar-preview-tags">
                    {selectedContent.tags.join(
                      " "
                    )}
                  </div>
                )}

              </div>

              <div className="calendar-threads-actions">

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

            <div className="calendar-preview-details">

              <div className="calendar-detail-row">

                <span>
                  Status
                </span>

                <StatusBadge
                  status={
                    selectedContent.status
                  }
                />

              </div>

              <div className="calendar-detail-row">

                <span>
                  Date
                </span>

                <strong>
                  {getContentDate(
                    selectedContent
                  )
                    ? formatDateLong(
                        getContentDate(
                          selectedContent
                        )
                      )
                    : "Not scheduled"}
                </strong>

              </div>

              <div className="calendar-detail-row">

                <span>
                  Time
                </span>

                <strong>
                  {formatTime(
                    selectedContent
                  ) ||
                    "Not set"}
                </strong>

              </div>

              <div className="calendar-detail-row">

                <span>
                  Platform
                </span>

                <strong>
                  {
                    selectedContent.platform
                  }
                </strong>

              </div>

              <div className="calendar-detail-row">

                <span>
                  Language
                </span>

                <strong>
                  {
                    selectedContent.language
                  }
                </strong>

              </div>

              <div className="calendar-preview-actions">

                {selectedContent.status !==
                  "published" && (
                  <button
                    type="button"
                    className="calendar-action-secondary"
                    onClick={() =>
                      openSchedule(
                        selectedContent
                      )
                    }
                  >
                    <CalendarDays
                      size={13}
                    />
                    Reschedule
                  </button>
                )}

                {selectedContent.status !==
                  "published" && (
                  <button
                    type="button"
                    className="calendar-action-primary"
                    disabled={
                      actionLoading ===
                      `publish-${selectedContent.id}`
                    }
                    onClick={() =>
                      handlePublish(
                        selectedContent
                      )
                    }
                  >
                    <Send size={13} />

                    {actionLoading ===
                    `publish-${selectedContent.id}`
                      ? "Publishing..."
                      : "Publish"}
                  </button>
                )}

              </div>

            </div>

          </div>

        </section>
      )}

      {/* ==================================================
          BOTTOM NAV
      ================================================== */}

      <section className="calendar-bottom-grid">

        <button
          type="button"
          className="calendar-bottom-card purple"
          onClick={() =>
            navigate("studio")
          }
        >

          <div className="calendar-bottom-icon">
            <Sparkles size={17} />
          </div>

          <div>
            <strong>
              Generate content
            </strong>

            <span>
              Create your next post
              with AI Studio.
            </span>
          </div>

          <ArrowRight size={14} />

        </button>

        <button
          type="button"
          className="calendar-bottom-card cyan"
          onClick={() =>
            navigate("content")
          }
        >

          <div className="calendar-bottom-icon">
            <FileText size={17} />
          </div>

          <div>
            <strong>
              Manage content
            </strong>

            <span>
              Review and organize
              your content library.
            </span>
          </div>

          <ArrowRight size={14} />

        </button>

        <button
          type="button"
          className="calendar-bottom-card orange"
          onClick={() =>
            navigate("autopilot")
          }
        >

          <div className="calendar-bottom-icon">
            <Zap size={17} />
          </div>

          <div>
            <strong>
              Enable Autopilot
            </strong>

            <span>
              Automate your publishing
              workflow.
            </span>
          </div>

          <ArrowRight size={14} />

        </button>

      </section>

      {/* ==================================================
          SCHEDULE MODAL
      ================================================== */}

      {showSchedule && (
        <div
          className="calendar-modal-backdrop"
          onClick={() =>
            setShowSchedule(false)
          }
        >

          <div
            className="calendar-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="calendar-modal-header">

              <div>

                <span className="page-kicker">
                  PUBLISHING
                </span>

                <h2>
                  Schedule Content
                </h2>

                <p>
                  Choose when your content
                  should be published.
                </p>

              </div>

              <button
                type="button"
                className="calendar-modal-close"
                onClick={() =>
                  setShowSchedule(false)
                }
              >
                <X size={17} />
              </button>

            </div>

            {!selectedContent ? (

              <div className="calendar-modal-empty">

                <div className="calendar-modal-empty-icon">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <strong>
                  Select content first
                </strong>

                <span>
                  Go to the Content page
                  and select a content item
                  before scheduling it.
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setShowSchedule(
                      false
                    );

                    navigate(
                      "content"
                    );
                  }}
                >
                  <FileText
                    size={13}
                  />
                  Open Content
                </button>

              </div>

            ) : (

              <form
                className="calendar-schedule-form"
                onSubmit={
                  handleSchedule
                }
              >

                <div className="calendar-schedule-summary">

                  <div className="calendar-schedule-summary-icon">
                    <FileText
                      size={15}
                    />
                  </div>

                  <div>

                    <strong>
                      {
                        selectedContent.title
                      }
                    </strong>

                    <span>
                      {
                        selectedContent.platform
                      }
                      {" · "}
                      {
                        selectedContent.type
                      }
                    </span>

                  </div>

                </div>

                <div className="calendar-form-field">

                  <label>
                    DATE
                  </label>

                  <input
                    type="date"
                    value={
                      scheduleDate
                    }
                    onChange={(
                      event
                    ) =>
                      setScheduleDate(
                        event.target
                          .value
                      )
                    }
                    required
                  />

                </div>

                <div className="calendar-form-field">

                  <label>
                    TIME
                  </label>

                  <input
                    type="time"
                    value={
                      scheduleTime
                    }
                    onChange={(
                      event
                    ) =>
                      setScheduleTime(
                        event.target
                          .value
                      )
                    }
                    required
                  />

                </div>

                <div className="calendar-schedule-info">

                  <Clock3 size={14} />

                  <span>
                    Content will be saved
                    as <strong>Scheduled</strong>{" "}
                    in Firestore.
                  </span>

                </div>

                <div className="calendar-modal-actions">

                  <button
                    type="button"
                    className="calendar-cancel-button"
                    onClick={() =>
                      setShowSchedule(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="calendar-save-button"
                    disabled={
                      actionLoading ===
                      `schedule-${selectedContent.id}`
                    }
                  >

                    <Check size={14} />

                    {actionLoading ===
                    `schedule-${selectedContent.id}`
                      ? "Scheduling..."
                      : "Schedule Post"}

                  </button>

                </div>

              </form>

            )}

          </div>

        </div>
      )}

    </div>
  );
}