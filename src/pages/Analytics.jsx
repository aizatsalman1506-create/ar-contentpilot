// ======================================================
// AR CONTENTPILOT
// ANALYTICS PAGE
// ======================================================
// Features:
// - Realtime Firestore content analytics
// - Date range filter
// - Published / draft / scheduled statistics
// - Reach / engagement / interactions from stored metrics
// - Top performing content
// - Platform performance
// - Audience summary when available
// - AI-style insights based on actual content data
// - Responsive UI
// ======================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Flame,
  Heart,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

import "./Analytics.css";

// ======================================================
// DATE OPTIONS
// ======================================================

const dateRanges = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
];

// ======================================================
// HELPERS
// ======================================================

function toDate(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  if (
    value instanceof Date
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  if (
    typeof value === "string"
  ) {
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  return null;
}

function getCreatedDate(item) {
  return (
    toDate(item.createdAt) ||
    toDate(item.updatedAt) ||
    toDate(item.publishedAt) ||
    toDate(item.scheduledAt) ||
    null
  );
}

function getNumericValue(
  value
) {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (
    typeof value ===
    "string"
  ) {
    const cleaned =
      value
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();

    const parsed =
      Number(cleaned);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function getMetric(
  item,
  fields
) {
  for (const field of fields) {
    if (
      item?.[field] !==
      undefined &&
      item?.[field] !== null
    ) {
      return getNumericValue(
        item[field]
      );
    }
  }

  return 0;
}

function getText(item) {
  return (
    item?.body ||
    item?.content ||
    item?.text ||
    item?.description ||
    ""
  );
}

function getTitle(item) {
  const title =
    item?.title?.trim();

  if (title) {
    return title;
  }

  const text =
    getText(item).trim();

  if (!text) {
    return "Untitled content";
  }

  return text.length > 58
    ? `${text.slice(0, 58)}...`
    : text;
}

function getPlatform(item) {
  if (
    Array.isArray(
      item?.platforms
    ) &&
    item.platforms.length
  ) {
    return item.platforms[0];
  }

  return (
    item?.platform ||
    "Threads"
  );
}

function getType(item) {
  return (
    item?.type ||
    item?.contentType ||
    "General"
  );
}

function getAccent(type) {
  const value =
    String(type)
      .toLowerCase();

  if (
    value.includes("emotional")
  ) {
    return "pink";
  }

  if (
    value.includes("viral")
  ) {
    return "orange";
  }

  if (
    value.includes("trend")
  ) {
    return "orange";
  }

  if (
    value.includes("quote") ||
    value.includes("inspir")
  ) {
    return "purple";
  }

  if (
    value.includes("technology") ||
    value.includes("ai")
  ) {
    return "cyan";
  }

  return "purple";
}

function getIconForType(type) {
  const value =
    String(type)
      .toLowerCase();

  if (
    value.includes("emotional")
  ) {
    return Heart;
  }

  if (
    value.includes("viral")
  ) {
    return Zap;
  }

  if (
    value.includes("trend")
  ) {
    return Flame;
  }

  if (
    value.includes("quote") ||
    value.includes("inspir")
  ) {
    return Sparkles;
  }

  return FileText;
}

function getDateRangeDays(
  range
) {
  if (
    range ===
    "Last 7 days"
  ) {
    return 7;
  }

  if (
    range ===
    "Last 90 days"
  ) {
    return 90;
  }

  return 30;
}

function isInsideRange(
  item,
  range
) {
  const date =
    getCreatedDate(item);

  if (!date) {
    return false;
  }

  const now =
    new Date();

  const days =
    getDateRangeDays(
      range
    );

  const start =
    new Date(now);

  start.setDate(
    start.getDate() -
      days
  );

  return date >= start;
}

function formatNumber(
  value
) {
  const number =
    getNumericValue(value);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(
      number >= 10000000
        ? 0
        : 1
    )}M`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(
      number >= 10000
        ? 0
        : 1
    )}K`;
  }

  return Math.round(
    number
  ).toLocaleString();
}

function formatPercent(
  value
) {
  return `${Number(
    value || 0
  ).toFixed(1)}%`;
}

function formatDate(
  value
) {
  const date =
    toDate(value);

  if (!date) {
    return "—";
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
// STAT CARD
// ======================================================

function AnalyticsStatCard({
  label,
  value,
  change,
  description,
  icon: Icon,
  variant,
  negative = false,
}) {
  return (
    <div
      className={`analytics-stat-card analytics-stat-${variant}`}
    >
      <div className="analytics-stat-top">
        <span>
          {label}
        </span>

        <div className="analytics-stat-icon">
          <Icon
            size={17}
            strokeWidth={1.8}
          />
        </div>
      </div>

      <strong>
        {value}
      </strong>

      <div className="analytics-stat-bottom">
        <span
          className={`analytics-stat-change ${
            negative
              ? "negative"
              : ""
          }`}
        >
          {negative ? (
            <ArrowDownRight
              size={11}
            />
          ) : (
            <ArrowUpRight
              size={11}
            />
          )}

          {change}
        </span>

        <span>
          {description}
        </span>
      </div>

      <div className="analytics-stat-glow" />
    </div>
  );
}

// ======================================================
// PERFORMANCE CHART
// ======================================================

function PerformanceChart({
  data,
  activeMetric,
}) {
  const maxValue =
    Math.max(
      ...data.map(
        (item) =>
          Math.max(
            item.reach,
            item.engagement
          )
      ),
      1
    );

  return (
    <div className="performance-chart">
      <div className="chart-y-axis">
        <span>
          {formatNumber(
            maxValue
          )}
        </span>

        <span>
          {formatNumber(
            maxValue * 0.75
          )}
        </span>

        <span>
          {formatNumber(
            maxValue * 0.5
          )}
        </span>

        <span>
          {formatNumber(
            maxValue * 0.25
          )}
        </span>

        <span>
          0
        </span>
      </div>

      <div className="chart-area">
        <div className="chart-grid-lines">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="chart-bars">
          {data.map(
            (item) => {
              const primaryValue =
                activeMetric ===
                "reach"
                  ? item.reach
                  : item.engagement;

              const secondaryValue =
                activeMetric ===
                "reach"
                  ? item.engagement
                  : item.reach;

              const primaryHeight =
                (primaryValue /
                  maxValue) *
                100;

              const secondaryHeight =
                (secondaryValue /
                  maxValue) *
                100;

              return (
                <div
                  className="chart-column"
                  key={
                    item.label
                  }
                >
                  <div className="chart-bar-group">
                    <div
                      className={`chart-bar reach ${
                        activeMetric ===
                        "engagement"
                          ? "muted"
                          : ""
                      }`}
                      style={{
                        height: `${Math.max(
                          primaryHeight,
                          2
                        )}%`,
                      }}
                    >
                      {primaryValue >
                        0 && (
                        <span>
                          {formatNumber(
                            primaryValue
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      className={`chart-bar engagement ${
                        activeMetric ===
                        "reach"
                          ? "muted"
                          : ""
                      }`}
                      style={{
                        height: `${Math.max(
                          secondaryHeight,
                          2
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="chart-label">
                    {item.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PLATFORM CARD
// ======================================================

function PlatformCard({
  platform,
}) {
  const Icon =
    platform.icon;

  return (
    <div className="platform-card">
      <div className="platform-card-top">
        <div
          className={`platform-icon ${platform.accent}`}
        >
          <Icon
            size={16}
            strokeWidth={1.8}
          />
        </div>

        <div className="platform-name">
          <strong>
            {platform.name}
          </strong>

          <span>
            {platform.posts} posts
          </span>
        </div>

        <span className="platform-growth">
          {platform.growth !==
            "—" && (
            <ArrowUpRight
              size={10}
            />
          )}

          {platform.growth}
        </span>
      </div>

      <div className="platform-metrics">
        <div>
          <span>
            Reach
          </span>

          <strong>
            {formatNumber(
              platform.reach
            )}
          </strong>
        </div>

        <div>
          <span>
            Engagement
          </span>

          <strong>
            {formatPercent(
              platform.engagement
            )}
          </strong>
        </div>

        <div>
          <span>
            Interactions
          </span>

          <strong>
            {formatNumber(
              platform.interactions
            )}
          </strong>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// TOP CONTENT ROW
// ======================================================

function TopContentRow({
  content,
  rank,
}) {
  const Icon =
    content.icon;

  return (
    <div className="top-content-row">
      <div className="content-rank">
        {String(rank).padStart(
          2,
          "0"
        )}
      </div>

      <div
        className={`content-row-icon ${content.accent}`}
      >
        <Icon
          size={14}
          strokeWidth={1.8}
        />
      </div>

      <div className="top-content-main">
        <strong>
          {content.title}
        </strong>

        <span>
          {content.type}

          <i>•</i>

          {content.platform}

          <i>•</i>

          {content.date}
        </span>
      </div>

      <div className="content-performance">
        <div>
          <span>
            Reach
          </span>

          <strong>
            {formatNumber(
              content.reach
            )}
          </strong>
        </div>

        <div>
          <span>
            Engagement
          </span>

          <strong>
            {formatPercent(
              content.engagement
            )}
          </strong>
        </div>

        <div className="content-interactions">
          <span>
            <Heart size={11} />
            {formatNumber(
              content.likes
            )}
          </span>

          <span>
            <MessageCircle
              size={11}
            />
            {formatNumber(
              content.comments
            )}
          </span>

          <span>
            <MousePointerClick
              size={11}
            />
            {formatNumber(
              content.shares
            )}
          </span>
        </div>
      </div>

      <ArrowUpRight
        size={14}
        className="content-row-arrow"
      />
    </div>
  );
}

// ======================================================
// INSIGHT CARD
// ======================================================

function InsightCard({
  icon: Icon,
  title,
  description,
  variant,
}) {
  return (
    <div
      className={`analytics-insight-card ${variant}`}
    >
      <div className="insight-icon">
        <Icon
          size={16}
          strokeWidth={1.8}
        />
      </div>

      <div>
        <span className="insight-label">
          AI INSIGHT
        </span>

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyAnalytics({
  message,
}) {
  return (
    <div className="analytics-empty-state">
      <div className="analytics-empty-icon">
        <BarChart3 size={24} />
      </div>

      <strong>
        No analytics data yet
      </strong>

      <span>
        {message}
      </span>
    </div>
  );
}

// ======================================================
// MAIN
// ======================================================

export default function Analytics({
  onNavigate,
}) {
  const [
    dateRange,
    setDateRange,
  ] = useState(
    "Last 30 days"
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    activeMetric,
    setActiveMetric,
  ] = useState("reach");

  const [
    content,
    setContent,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // FIRESTORE REALTIME
  // ====================================================

  useEffect(() => {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      setContent([]);
      setLoading(false);
      setError(
        "Please sign in to view analytics."
      );

      return undefined;
    }

    setLoading(true);
    setError("");

    const contentRef =
      collection(
        db,
        "content"
      );

    const unsubscribe =
      onSnapshot(
        contentRef,
        (snapshot) => {
          const items =
            snapshot.docs
              .map(
                (document) => ({
                  id:
                    document.id,
                  ...document.data(),
                })
              )
              .filter(
                (item) =>
                  item.userId ===
                  currentUser.uid
              );

          setContent(items);
          setLoading(false);
        },
        (snapshotError) => {
          console.error(
            "Analytics Firestore error:",
            snapshotError
          );

          setError(
            snapshotError?.message ||
              "Unable to load analytics data."
          );

          setLoading(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ====================================================
  // RANGE FILTER
  // ====================================================

  const filteredContent =
    useMemo(() => {
      return content.filter(
        (item) =>
          isInsideRange(
            item,
            dateRange
          )
      );
    }, [
      content,
      dateRange,
    ]);

  // ====================================================
  // PUBLISHED
  // ====================================================

  const publishedContent =
    useMemo(() => {
      return filteredContent.filter(
        (item) =>
          String(
            item.status || ""
          ).toLowerCase() ===
            "published" ||
          item.published ===
            true
      );
    }, [
      filteredContent,
    ]);

  // ====================================================
  // METRICS
  // ====================================================

  const metrics =
    useMemo(() => {
      let reach = 0;
      let likes = 0;
      let comments = 0;
      let shares = 0;

      let engagementTotal = 0;
      let engagementCount = 0;

      publishedContent.forEach(
        (item) => {
          reach +=
            getMetric(
              item,
              [
                "reach",
                "impressions",
                "views",
              ]
            );

          likes +=
            getMetric(
              item,
              [
                "likes",
                "likeCount",
              ]
            );

          comments +=
            getMetric(
              item,
              [
                "comments",
                "commentCount",
              ]
            );

          shares +=
            getMetric(
              item,
              [
                "shares",
                "shareCount",
                "reposts",
              ]
            );

          const engagement =
            getMetric(
              item,
              [
                "engagementRate",
                "engagement",
              ]
            );

          if (
            engagement > 0
          ) {
            engagementTotal +=
              engagement;

            engagementCount +=
              1;
          }
        }
      );

      const interactions =
        likes +
        comments +
        shares;

      const engagementRate =
        engagementCount >
        0
          ? engagementTotal /
            engagementCount
          : reach > 0
          ? (interactions /
              reach) *
            100
          : 0;

      return {
        reach,
        likes,
        comments,
        shares,
        interactions,
        engagementRate,
      };
    }, [
      publishedContent,
    ]);

  // ====================================================
  // CONTENT COUNTS
  // ====================================================

  const contentCounts =
    useMemo(() => {
      const drafts =
        filteredContent.filter(
          (item) =>
            String(
              item.status || ""
            ).toLowerCase() ===
            "draft"
        ).length;

      const scheduled =
        filteredContent.filter(
          (item) =>
            String(
              item.status || ""
            ).toLowerCase() ===
            "scheduled"
        ).length;

      return {
        published:
          publishedContent.length,
        drafts,
        scheduled,
      };
    }, [
      filteredContent,
      publishedContent,
    ]);

  // ====================================================
  // PLATFORM DATA
  // ====================================================

  const platformData =
    useMemo(() => {
      const map =
        {};

      publishedContent.forEach(
        (item) => {
          const platform =
            getPlatform(
              item
            );

          if (
            !map[platform]
          ) {
            map[platform] = {
              name: platform,
              posts: 0,
              reach: 0,
              interactions: 0,
              engagementTotal: 0,
              engagementCount: 0,
            };
          }

          map[platform].posts +=
            1;

          map[platform].reach +=
            getMetric(
              item,
              [
                "reach",
                "impressions",
                "views",
              ]
            );

          const likes =
            getMetric(
              item,
              [
                "likes",
                "likeCount",
              ]
            );

          const comments =
            getMetric(
              item,
              [
                "comments",
                "commentCount",
              ]
            );

          const shares =
            getMetric(
              item,
              [
                "shares",
                "shareCount",
                "reposts",
              ]
            );

          map[platform]
            .interactions +=
            likes +
            comments +
            shares;

          const engagement =
            getMetric(
              item,
              [
                "engagementRate",
                "engagement",
              ]
            );

          if (
            engagement > 0
          ) {
            map[platform]
              .engagementTotal +=
              engagement;

            map[platform]
              .engagementCount +=
              1;
          }
        }
      );

      return Object.values(
        map
      )
        .map(
          (
            platform
          ) => ({
            ...platform,
            engagement:
              platform
                .engagementCount >
              0
                ? platform
                    .engagementTotal /
                  platform
                    .engagementCount
                : platform.reach >
                  0
                ? (platform.interactions /
                    platform.reach) *
                  100
                : 0,
            interactions:
              platform.interactions,
            growth: "—",
            accent:
              platform.name
                .toLowerCase()
                .includes(
                  "instagram"
                )
                ? "pink"
                : platform.name
                    .toLowerCase()
                    .includes(
                      "facebook"
                    )
                ? "blue"
                : "purple",
            icon:
              platform.name
                .toLowerCase()
                .includes(
                  "facebook"
                )
                ? Users
                : platform.name
                    .toLowerCase()
                    .includes(
                      "instagram"
                    )
                ? Eye
                : MessageCircle,
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.reach -
            a.reach
        );
    }, [
      publishedContent,
    ]);

  // ====================================================
  // TOP CONTENT
  // ====================================================

  const topContent =
    useMemo(() => {
      return [
        ...publishedContent,
      ]
        .map(
          (item) => {
            const likes =
              getMetric(
                item,
                [
                  "likes",
                  "likeCount",
                ]
              );

            const comments =
              getMetric(
                item,
                [
                  "comments",
                  "commentCount",
                ]
              );

            const shares =
              getMetric(
                item,
                [
                  "shares",
                  "shareCount",
                  "reposts",
                ]
              );

            const reach =
              getMetric(
                item,
                [
                  "reach",
                  "impressions",
                  "views",
                ]
              );

            const interactions =
              likes +
              comments +
              shares;

            const storedEngagement =
              getMetric(
                item,
                [
                  "engagementRate",
                  "engagement",
                ]
              );

            const engagement =
              storedEngagement >
              0
                ? storedEngagement
                : reach >
                  0
                ? (interactions /
                    reach) *
                  100
                : 0;

            return {
              id:
                item.id,

              title:
                getTitle(
                  item
                ),

              type:
                getType(
                  item
                ),

              platform:
                getPlatform(
                  item
                ),

              reach,

              engagement,

              likes,

              comments,

              shares,

              date:
                formatDate(
                  item.createdAt ||
                    item.publishedAt
                ),

              icon:
                getIconForType(
                  getType(
                    item
                  )
                ),

              accent:
                getAccent(
                  getType(
                    item
                  )
                ),
            };
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            if (
              b.engagement !==
              a.engagement
            ) {
              return (
                b.engagement -
                a.engagement
              );
            }

            return (
              b.reach -
              a.reach
            );
          }
        )
        .slice(
          0,
          5
        );
    }, [
      publishedContent,
    ]);

  // ====================================================
  // CHART
  // ====================================================

  const chartData =
    useMemo(() => {
      const days = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ];

      const result =
        days.map(
          (label) => ({
            label,
            reach: 0,
            engagement: 0,
          })
        );

      publishedContent.forEach(
        (item) => {
          const date =
            getCreatedDate(
              item
            );

          if (!date) {
            return;
          }

          const day =
            date.toLocaleDateString(
              "en-US",
              {
                weekday:
                  "short",
              }
            );

          const target =
            result.find(
              (item) =>
                item.label ===
                day
            );

          if (!target) {
            return;
          }

          target.reach +=
            getMetric(
              item,
              [
                "reach",
                "impressions",
                "views",
              ]
            );

          target.engagement +=
            getMetric(
              item,
              [
                "likes",
                "likeCount",
                "comments",
                "commentCount",
                "shares",
                "shareCount",
                "reposts",
              ]
            );
        }
      );

      return result;
    }, [
      publishedContent,
    ]);

  // ====================================================
  // BEST TOPIC
  // ====================================================

  const bestTopic =
    useMemo(() => {
      const map =
        {};

      publishedContent.forEach(
        (item) => {
          const type =
            getType(
              item
            );

          const engagement =
            getMetric(
              item,
              [
                "engagementRate",
                "engagement",
              ]
            );

          if (
            !map[type]
          ) {
            map[type] = {
              total:
                0,
              count:
                0,
            };
          }

          map[type].total +=
            engagement;

          map[type].count +=
            1;
        }
      );

      let winner =
        null;

      Object.entries(
        map
      ).forEach(
        ([
          type,
          data,
        ]) => {
          const average =
            data.count
              ? data.total /
                data.count
              : 0;

          if (
            !winner ||
            average >
              winner.average
          ) {
            winner = {
              type,
              average,
            };
          }
        }
      );

      return (
        winner || {
          type: "Not enough data",
          average: 0,
        }
      );
    }, [
      publishedContent,
    ]);

  // ====================================================
  // REFRESH
  // ====================================================

  function handleRefresh() {
    setRefreshing(true);

    window.setTimeout(
      () => {
        setRefreshing(false);
      },
      700
    );
  }

  // ====================================================
  // INSIGHTS
  // ====================================================

  const insights =
    useMemo(() => {
      if (
        publishedContent.length ===
        0
      ) {
        return [
          {
            icon: BarChart3,
            variant: "purple",
            title:
              "Analytics is ready",
            description:
              "Publish content and connect your platform metrics to start generating performance insights.",
          },
          {
            icon: Clock3,
            variant: "orange",
            title:
              "Build a publishing pattern",
            description:
              "Once enough posts are published, ContentPilot can identify which content performs best.",
          },
          {
            icon: Zap,
            variant: "cyan",
            title:
              "Connect real metrics",
            description:
              "Reach, likes, comments and shares will become meaningful once your publishing integration sends those values to Firestore.",
          },
        ];
      }

      const topicTitle =
        bestTopic.type !==
        "Not enough data"
          ? `${bestTopic.type} is leading`
          : "Keep collecting data";

      const topicDescription =
        bestTopic.average >
        0
          ? `${bestTopic.type} currently has the strongest average engagement at ${formatPercent(
              bestTopic.average
            )}.`
          : "Your current content does not contain enough engagement metrics yet.";

      return [
        {
          icon: TrendingUp,
          variant: "purple",
          title:
            topicTitle,
          description:
            topicDescription,
        },
        {
          icon: Clock3,
          variant: "orange",
          title:
            `${contentCounts.published} posts published`,
          description:
            "Continue publishing consistently so ContentPilot can identify stronger performance patterns.",
        },
        {
          icon: Zap,
          variant: "cyan",
          title:
            `${formatNumber(
              metrics.interactions
            )} interactions`,
          description:
            metrics.interactions >
            0
              ? "Your stored likes, comments and shares are now being reflected in Analytics."
              : "No interaction metrics have been recorded yet.",
        },
      ];
    }, [
      publishedContent,
      bestTopic,
      contentCounts,
      metrics,
    ]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="analytics-page">

      {/* HEADER */}

      <section className="analytics-page-header">
        <div>
          <span className="analytics-page-kicker">
            PERFORMANCE INTELLIGENCE
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Understand what is working,
            measure your content
            performance and grow your
            audience.
          </p>
        </div>

        <div className="analytics-header-actions">

          <div className="analytics-date-select">
            <CalendarDays
              size={14}
            />

            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(
                  event.target.value
                )
              }
            >
              {dateRanges.map(
                (range) => (
                  <option
                    key={range}
                    value={range}
                  >
                    {range}
                  </option>
                )
              )}
            </select>

            <ChevronDown
              size={13}
            />
          </div>

          <button
            type="button"
            className="analytics-refresh-button"
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
                  ? "analytics-refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="analytics-alert">
          {error}
        </div>
      )}

      {/* STATS */}

      <section className="analytics-stats-grid">

        <AnalyticsStatCard
          label="TOTAL REACH"
          value={formatNumber(
            metrics.reach
          )}
          change="LIVE"
          description="from stored metrics"
          icon={Eye}
          variant="purple"
        />

        <AnalyticsStatCard
          label="ENGAGEMENT RATE"
          value={formatPercent(
            metrics.engagementRate
          )}
          change="LIVE"
          description="calculated from content"
          icon={Heart}
          variant="orange"
        />

        <AnalyticsStatCard
          label="TOTAL INTERACTIONS"
          value={formatNumber(
            metrics.interactions
          )}
          change="LIVE"
          description="likes, comments & shares"
          icon={
            MousePointerClick
          }
          variant="cyan"
        />

        <AnalyticsStatCard
          label="CONTENT PUBLISHED"
          value={contentCounts.published}
          change={`${contentCounts.scheduled} queued`}
          description={`${contentCounts.drafts} drafts`}
          icon={FileText}
          variant="green"
        />

      </section>

      {/* MAIN GRID */}

      <section className="analytics-main-grid">

        {/* PERFORMANCE */}

        <div className="analytics-panel analytics-performance-panel">

          <div className="analytics-panel-header">

            <div>
              <span className="analytics-section-kicker">
                PERFORMANCE OVERVIEW
              </span>

              <h2>
                Content Performance
              </h2>

              <p>
                Realtime performance
                calculated from your
                Firestore content data.
              </p>
            </div>

            <div className="metric-switcher">

              <button
                type="button"
                className={
                  activeMetric ===
                  "reach"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveMetric(
                    "reach"
                  )
                }
              >
                <Eye size={12} />
                Reach
              </button>

              <button
                type="button"
                className={
                  activeMetric ===
                  "engagement"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveMetric(
                    "engagement"
                  )
                }
              >
                <Heart size={12} />
                Engagement
              </button>

            </div>

          </div>

          <div className="chart-summary">

            <div>
              <span>
                {activeMetric ===
                "reach"
                  ? "TOTAL REACH"
                  : "ENGAGEMENT RATE"}
              </span>

              <strong>
                {activeMetric ===
                "reach"
                  ? formatNumber(
                      metrics.reach
                    )
                  : formatPercent(
                      metrics.engagementRate
                    )}
              </strong>
            </div>

            <div className="chart-summary-growth">
              <span>
                REALTIME
              </span>

              <strong>
                {publishedContent.length}
              </strong>

              <span>
                published posts
              </span>
            </div>

          </div>

          {loading ? (
            <div className="analytics-chart-loading">
              <RefreshCw
                size={18}
                className="analytics-refresh-spin"
              />

              Loading analytics...
            </div>
          ) : (
            <PerformanceChart
              data={chartData}
              activeMetric={
                activeMetric
              }
            />
          )}

          <div className="chart-legend">

            <span>
              <i className="legend-dot reach" />
              Reach
            </span>

            <span>
              <i className="legend-dot engagement" />
              Interactions
            </span>

          </div>

        </div>

        {/* AUDIENCE */}

        <div className="analytics-panel analytics-audience-panel">

          <div className="analytics-panel-header">

            <div>
              <span className="analytics-section-kicker">
                AUDIENCE
              </span>

              <h2>
                Audience Growth
              </h2>
            </div>

            <Users
              size={17}
              className="panel-heading-icon"
            />

          </div>

          <div className="audience-main">

            <div className="audience-ring">

              <div>
                <strong>
                  —
                </strong>

                <span>
                  Followers
                </span>
              </div>

            </div>

            <div className="audience-growth">

              <span>
                FOLLOWER DATA
              </span>

              <strong>
                Not connected
              </strong>

              <small>
                Connect platform
                analytics
              </small>

            </div>

          </div>

          <div className="audience-breakdown">

            {platformData.length >
            0 ? (
              platformData.map(
                (
                  platform
                ) => (
                  <div
                    className="audience-row"
                    key={
                      platform.name
                    }
                  >
                    <div>
                      <span
                        className={`audience-dot ${platform.accent}`}
                      />

                      {
                        platform.name
                      }
                    </div>

                    <strong>
                      {
                        platform.posts
                      }
                    </strong>

                    <span>
                      posts
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="analytics-small-empty">
                No platform data yet.
              </div>
            )}

          </div>

          <button
            type="button"
            className="analytics-text-button"
            onClick={() =>
              onNavigate &&
              onNavigate(
                "threads"
              )
            }
          >
            Open Threads
            <ArrowUpRight
              size={12}
            />
          </button>

        </div>

      </section>

      {/* PLATFORM */}

      <section className="analytics-panel analytics-platform-panel">

        <div className="analytics-panel-header">

          <div>
            <span className="analytics-section-kicker">
              PLATFORM PERFORMANCE
            </span>

            <h2>
              Where your content performs
            </h2>

            <p>
              Performance calculated from
              your stored content metrics.
            </p>
          </div>

          <BarChart3
            size={18}
            className="panel-heading-icon"
          />

        </div>

        {platformData.length >
        0 ? (
          <div className="platform-grid">

            {platformData.map(
              (platform) => (
                <PlatformCard
                  key={
                    platform.name
                  }
                  platform={
                    platform
                  }
                />
              )
            )}

          </div>
        ) : (
          <EmptyAnalytics
            message="Publish content to start seeing platform performance."
          />
        )}

      </section>

      {/* TOP CONTENT */}

      <section className="analytics-panel analytics-content-panel">

        <div className="analytics-panel-header">

          <div>
            <span className="analytics-section-kicker">
              TOP PERFORMING CONTENT
            </span>

            <h2>
              What's working best
            </h2>

            <p>
              Your strongest published
              content based on the
              available metrics.
            </p>
          </div>

          <button
            type="button"
            className="analytics-text-button"
            onClick={() =>
              onNavigate &&
              onNavigate(
                "content"
              )
            }
          >
            View all content
            <ArrowUpRight
              size={12}
            />
          </button>

        </div>

        {topContent.length >
        0 ? (
          <div className="top-content-table">

            <div className="top-content-header">
              <span>
                CONTENT
              </span>

              <span>
                PERFORMANCE
              </span>

              <span />
            </div>

            {topContent.map(
              (
                item,
                index
              ) => (
                <TopContentRow
                  key={
                    item.id
                  }
                  content={
                    item
                  }
                  rank={
                    index + 1
                  }
                />
              )
            )}

          </div>
        ) : (
          <EmptyAnalytics
            message="No published content was found in the selected period."
          />
        )}

      </section>

      {/* AI INSIGHTS */}

      <section className="analytics-insights-section">

        <div className="analytics-insights-heading">

          <div>
            <span className="analytics-section-kicker">
              AI PERFORMANCE INSIGHTS
            </span>

            <h2>
              What your data is
              telling you
            </h2>
          </div>

          <div className="ai-insight-badge">
            <Sparkles size={12} />
            DATA ANALYZED
          </div>

        </div>

        <div className="analytics-insights-grid">

          {insights.map(
            (
              insight,
              index
            ) => (
              <InsightCard
                key={
                  index
                }
                icon={
                  insight.icon
                }
                variant={
                  insight.variant
                }
                title={
                  insight.title
                }
                description={
                  insight.description
                }
              />
            )
          )}

        </div>

      </section>

      {/* BOTTOM */}

      <section className="analytics-bottom-grid">

        <div className="analytics-bottom-card">

          <div className="analytics-bottom-icon purple">
            <Flame size={16} />
          </div>

          <div>
            <span>
              BEST CONTENT TYPE
            </span>

            <strong>
              {bestTopic.type}
            </strong>

            <p>
              {bestTopic.average >
              0
                ? `${formatPercent(
                    bestTopic.average
                  )} average engagement`
                : "Waiting for metrics"}
            </p>
          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div className="analytics-bottom-card">

          <div className="analytics-bottom-icon orange">
            <Clock3 size={16} />
          </div>

          <div>
            <span>
              PUBLISHED CONTENT
            </span>

            <strong>
              {
                contentCounts.published
              }
            </strong>

            <p>
              {
                contentCounts.scheduled
              }{" "}
              scheduled
            </p>
          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div className="analytics-bottom-card">

          <div className="analytics-bottom-icon green">
            <Zap size={16} />
          </div>

          <div>
            <span>
              DATA STATUS
            </span>

            <strong>
              {loading
                ? "Syncing"
                : "Live"}
            </strong>

            <p>
              Firestore realtime
            </p>
          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

      </section>

    </div>
  );
}