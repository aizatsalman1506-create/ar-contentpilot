// ======================================================
// AR CONTENTPILOT
// TREND RADAR v4
// LIVE GOOGLE TRENDS MALAYSIA
// ======================================================

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flame,
  Lightbulb,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import "./TrendRadar.css";

// ======================================================
// API
// ======================================================

const API_URL = "/api/trend";

// ======================================================
// CATEGORIES
// ======================================================

const CATEGORIES = [
  "All",
  "Technology",
  "Business",
  "Sports",
  "Entertainment",
  "Lifestyle",
  "General",
];

// ======================================================
// HELPERS
// ======================================================

function formatUpdatedTime(value) {
  if (!value) {
    return "Unknown";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

function getMomentumClass(momentum = 0) {
  const score = Number(momentum) || 0;

  if (score >= 85) {
    return "rising";
  }

  if (score >= 70) {
    return "hot";
  }

  return "stable";
}

function getMomentumLabel(momentum = 0) {
  const score = Number(momentum) || 0;

  if (score >= 85) {
    return "RISING";
  }

  if (score >= 70) {
    return "HOT";
  }

  return "STABLE";
}

function getOpportunityClass(opportunity = "") {
  const value = String(opportunity).toLowerCase().trim();

  if (value === "very high") {
    return "very-high";
  }

  if (value === "high") {
    return "high";
  }

  if (value === "medium") {
    return "medium";
  }

  return "low";
}

function getCategoryIcon(category) {
  switch (category) {
    case "Technology":
      return Sparkles;

    case "Business":
      return TrendingUp;

    case "Sports":
      return Trophy;

    case "Entertainment":
      return MessageCircle;

    case "Lifestyle":
      return Flame;

    default:
      return BarChart3;
  }
}

function getCategoryClass(category = "") {
  return String(category)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeTrend(trend, index = 0) {
  const momentum = Number(trend?.momentum) || 0;

  const opportunity =
    trend?.opportunity ||
    "Low";

  return {
    id:
      trend?.id ||
      `trend-${index}-${Date.now()}`,

    rank:
      trend?.rank ||
      String(index + 1).padStart(2, "0"),

    rankNumber:
      Number(trend?.rankNumber) ||
      Number(trend?.rank) ||
      index + 1,

    title:
      trend?.title ||
      "Untitled trend",

    category:
      trend?.category ||
      "General",

    description:
      trend?.description ||
      "Live trend detected in Malaysia.",

    hashtags:
      Array.isArray(trend?.hashtags)
        ? trend.hashtags
        : [],

    momentum,

    growth:
      trend?.growth ||
      "—",

    posts:
      trend?.posts ||
      "—",

    engagement:
      trend?.engagement ||
      "Live",

    status:
      trend?.status ||
      getMomentumLabel(momentum),

    statusType:
      trend?.statusType ||
      getMomentumClass(momentum),

    accent:
      trend?.accent ||
      "blue",

    icon:
      trend?.icon ||
      "bar-chart",

    opportunity,

    opportunityType:
      trend?.opportunityType ||
      getOpportunityClass(opportunity),

    opportunityText:
      trend?.opportunityText ||
      "Monitor this trend before creating content.",

    ideas:
      Array.isArray(trend?.ideas)
        ? trend.ideas
        : [],

    source:
      trend?.source ||
      "Google Trends",

    sourceUrl:
      trend?.sourceUrl ||
      "",

    publishedAt:
      trend?.publishedAt ||
      null,

    live:
      trend?.live !== false,

    country:
      trend?.country ||
      "MY",

    sourceType:
      trend?.sourceType ||
      "google-trends-rss",

    updatedAt:
      trend?.updatedAt ||
      null,
  };
}

// ======================================================
// COMPONENT
// ======================================================

export default function TrendRadar({
  onGenerateContent,
}) {
  // ====================================================
  // STATE
  // ====================================================

  const [trends, setTrends] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [selectedTrend, setSelectedTrend] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [copiedHashtag, setCopiedHashtag] =
    useState("");

  // ====================================================
  // LOAD TRENDS
  // ====================================================

  const loadTrends = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          API_URL,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Trend API returned an invalid JSON response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Trend API returned ${response.status}`
          );
        }

        if (
          !data ||
          data.success !== true
        ) {
          throw new Error(
            data?.message ||
              "Trend API request failed."
          );
        }

        const incomingTrends =
          Array.isArray(data.trends)
            ? data.trends.map(
                (trend, index) =>
                  normalizeTrend(
                    trend,
                    index
                  )
              )
            : [];

        setTrends(
          incomingTrends
        );

        setLastUpdated(
          data.updatedAt ||
            new Date().toISOString()
        );

        if (selectedTrend) {
          const updatedSelected =
            incomingTrends.find(
              (trend) =>
                trend.id ===
                selectedTrend.id
            );

          if (updatedSelected) {
            setSelectedTrend(
              updatedSelected
            );
          }
        }

        // Auto-select first trend
        // when nothing is selected.
        if (
          !selectedTrend &&
          incomingTrends.length > 0
        ) {
          setSelectedTrend(
            incomingTrends[0]
          );
        }
      } catch (err) {
        console.error(
          "Trend Radar error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load live trend data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedTrend]
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // ====================================================
  // FILTERED TRENDS
  // ====================================================

  const filteredTrends =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return trends.filter(
        (trend) => {
          const categoryMatch =
            activeCategory === "All" ||
            trend.category ===
              activeCategory;

          if (!categoryMatch) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchable = [
            trend.title,
            trend.category,
            trend.description,
            ...(trend.hashtags || []),
            ...(trend.ideas || []),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            keyword
          );
        }
      );
    }, [
      trends,
      search,
      activeCategory,
    ]);

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    const total =
      trends.length;

    const hot =
      trends.filter(
        (trend) =>
          trend.momentum >= 70
      ).length;

    const rising =
      trends.filter(
        (trend) =>
          trend.momentum >= 85
      ).length;

    const opportunities =
      trends.filter(
        (trend) => {
          const value =
            String(
              trend.opportunity
            ).toLowerCase();

          return (
            value === "high" ||
            value === "very high"
          );
        }
      ).length;

    const averageMomentum =
      total > 0
        ? Math.round(
            trends.reduce(
              (
                totalScore,
                trend
              ) =>
                totalScore +
                trend.momentum,
              0
            ) / total
          )
        : 0;

    return {
      total,
      hot,
      rising,
      opportunities,
      averageMomentum,
    };
  }, [trends]);

  // ====================================================
  // COPY HASHTAG
  // ====================================================

  async function handleCopyHashtag(
    hashtag
  ) {
    try {
      if (
        !navigator.clipboard
      ) {
        throw new Error(
          "Clipboard is not available."
        );
      }

      await navigator.clipboard.writeText(
        hashtag
      );

      setCopiedHashtag(
        hashtag
      );

      window.setTimeout(() => {
        setCopiedHashtag("");
      }, 1600);
    } catch (err) {
      console.error(
        "Copy hashtag error:",
        err
      );
    }
  }

  // ====================================================
  // GENERATE CONTENT
  // ====================================================

  function handleGenerateContent(
    trend,
    idea = ""
  ) {
    if (
      typeof onGenerateContent ===
      "function"
    ) {
      onGenerateContent({
        ...trend,
        selectedIdea: idea,
      });

      return;
    }

    setSelectedTrend(
      trend
    );
  }

  // ====================================================
  // OPEN SOURCE
  // ====================================================

  function handleOpenSource(
    trend
  ) {
    if (
      !trend?.sourceUrl
    ) {
      return;
    }

    window.open(
      trend.sourceUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ====================================================
  // SELECT TREND
  // ====================================================

  function handleSelectTrend(
    trend
  ) {
    setSelectedTrend(
      trend
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="trend-radar-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="trend-radar-header">

        <div className="trend-radar-header-left">

          <div className="trend-radar-title-row">

            <div className="trend-radar-title-icon">
              <Activity size={22} />
            </div>

            <div>
              <h1>
                Trend Radar
              </h1>

              <p>
                Discover what is trending
                in Malaysia right now.
              </p>
            </div>

          </div>

          <div className="trend-live-indicator">

            <span className="trend-live-dot" />

            <span>
              LIVE
            </span>

            <span className="trend-live-source">
              Google Trends Malaysia
            </span>

          </div>

        </div>

        <div className="trend-radar-header-actions">

          <div className="trend-last-updated">
            <Clock3 size={14} />

            <span>
              Updated{" "}
              {formatUpdatedTime(
                lastUpdated
              )}
            </span>
          </div>

          <button
            type="button"
            className="trend-refresh-button"
            onClick={() =>
              loadTrends({
                silent: true,
              })
            }
            disabled={
              loading ||
              refreshing
            }
          >
            {refreshing ? (
              <Loader2
                size={16}
                className="trend-spin"
              />
            ) : (
              <RefreshCw
                size={16}
              />
            )}

            <span>
              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </span>
          </button>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="trend-error-card">

          <div className="trend-error-icon">
            <AlertCircle
              size={20}
            />
          </div>

          <div className="trend-error-content">

            <strong>
              Unable to load Trend Radar
            </strong>

            <span>
              {error}
            </span>

            <small>
              Make sure you are running
              the application with{" "}
              <code>
                npx vercel dev
              </code>{" "}
              so that{" "}
              <code>
                /api/trend
              </code>{" "}
              is available.
            </small>

          </div>

          <button
            type="button"
            onClick={() =>
              loadTrends()
            }
          >
            Try again
          </button>

        </div>
      )}

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="trend-summary-grid">

        <div className="trend-summary-card">

          <div className="trend-summary-icon blue">
            <Activity size={19} />
          </div>

          <div className="trend-summary-content">
            <span>
              Live Trends
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>

          <div className="trend-summary-meta">
            Malaysia
          </div>

        </div>

        <div className="trend-summary-card">

          <div className="trend-summary-icon orange">
            <Flame size={19} />
          </div>

          <div className="trend-summary-content">
            <span>
              Hot Trends
            </span>

            <strong>
              {summary.hot}
            </strong>
          </div>

          <div className="trend-summary-meta">
            ≥ 70 momentum
          </div>

        </div>

        <div className="trend-summary-card">

          <div className="trend-summary-icon purple">
            <TrendingUp size={19} />
          </div>

          <div className="trend-summary-content">
            <span>
              Rising
            </span>

            <strong>
              {summary.rising}
            </strong>
          </div>

          <div className="trend-summary-meta">
            ≥ 85 momentum
          </div>

        </div>

        <div className="trend-summary-card">

          <div className="trend-summary-icon green">
            <Lightbulb size={19} />
          </div>

          <div className="trend-summary-content">
            <span>
              Opportunities
            </span>

            <strong>
              {summary.opportunities}
            </strong>
          </div>

          <div className="trend-summary-meta">
            High potential
          </div>

        </div>

      </div>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="trend-toolbar">

        <div className="trend-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search trends..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="trend-search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="trend-category-tabs">

          {CATEGORIES.map(
            (category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory ===
                  category
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
              >
                {category}
              </button>
            )
          )}

        </div>

      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      {loading ? (
        <div className="trend-loading-state">

          <div className="trend-loading-spinner">
            <Loader2
              size={30}
              className="trend-spin"
            />
          </div>

          <h3>
            Loading live trends...
          </h3>

          <p>
            Connecting to Google Trends
            Malaysia.
          </p>

        </div>
      ) : filteredTrends.length === 0 ? (
        <div className="trend-empty-state">

          <div className="trend-empty-icon">
            <Search size={25} />
          </div>

          <h3>
            No trends found
          </h3>

          <p>
            Try another keyword or
            category.
          </p>

          {(search ||
            activeCategory !==
              "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory(
                  "All"
                );
              }}
            >
              Clear filters
            </button>
          )}

        </div>
      ) : (
        <div className="trend-layout">

          {/* =================================================
              TREND LIST
          ================================================= */}

          <div className="trend-list">

            <div className="trend-list-header">

              <div>
                <h2>
                  Trending Now
                </h2>

                <span>
                  {filteredTrends.length}{" "}
                  trend
                  {filteredTrends.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  found
                </span>
              </div>

              <div className="trend-list-live">
                <span />
                Live data
              </div>

            </div>

            {filteredTrends.map(
              (
                trend,
                index
              ) => {
                const CategoryIcon =
                  getCategoryIcon(
                    trend.category
                  );

                const isSelected =
                  selectedTrend?.id ===
                  trend.id;

                return (
                  <article
                    key={trend.id}
                    className={`trend-card ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectTrend(
                        trend
                      )
                    }
                  >

                    {/* RANK */}

                    <div className="trend-card-rank">
                      <span>
                        {trend.rank ||
                          String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                      </span>
                    </div>

                    {/* ICON */}

                    <div
                      className={`trend-card-icon ${getCategoryClass(
                        trend.category
                      )}`}
                    >
                      <CategoryIcon
                        size={20}
                      />
                    </div>

                    {/* MAIN */}

                    <div className="trend-card-main">

                      <div className="trend-card-topline">

                        <span className="trend-category">
                          {trend.category}
                        </span>

                        <span
                          className={`trend-status ${getMomentumClass(
                            trend.momentum
                          )}`}
                        >
                          <span />
                          {trend.status ||
                            getMomentumLabel(
                              trend.momentum
                            )}
                        </span>

                      </div>

                      <h3>
                        {trend.title}
                      </h3>

                      <p>
                        {trend.description}
                      </p>

                      <div className="trend-card-tags">

                        {trend.hashtags
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              hashtag
                            ) => (
                              <button
                                type="button"
                                key={
                                  hashtag
                                }
                                className="trend-hashtag"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  handleCopyHashtag(
                                    hashtag
                                  );
                                }}
                              >
                                {copiedHashtag ===
                                hashtag ? (
                                  <Check
                                    size={
                                      11
                                    }
                                  />
                                ) : null}

                                {hashtag}
                              </button>
                            )
                          )}

                      </div>

                    </div>

                    {/* MOMENTUM */}

                    <div className="trend-card-momentum">

                      <div className="momentum-label">
                        Momentum
                      </div>

                      <div className="momentum-score">

                        <strong>
                          {trend.momentum}
                        </strong>

                        <span>
                          /99
                        </span>

                      </div>

                      <div className="momentum-bar">

                        <span
                          style={{
                            width: `${Math.min(
                              Math.max(
                                trend.momentum,
                                0
                              ),
                              99
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ARROW */}

                    <div className="trend-card-arrow">
                      <ChevronRight
                        size={18}
                      />
                    </div>

                  </article>
                );
              }
            )}

          </div>

          {/* =================================================
              DETAIL PANEL
          ================================================= */}

          <aside className="trend-detail-panel">

            {selectedTrend ? (
              <div className="trend-detail-inner">

                {/* DETAIL HEADER */}

                <div className="trend-detail-header">

                  <div
                    className={`trend-detail-icon ${getCategoryClass(
                      selectedTrend.category
                    )}`}
                  >
                    {(() => {
                      const Icon =
                        getCategoryIcon(
                          selectedTrend.category
                        );

                      return (
                        <Icon
                          size={22}
                        />
                      );
                    })()}
                  </div>

                  <div className="trend-detail-heading">

                    <div className="trend-detail-category">
                      {selectedTrend.category}
                    </div>

                    <h2>
                      {selectedTrend.title}
                    </h2>

                  </div>

                </div>

                {/* LIVE */}

                <div className="trend-detail-live">

                  <span className="trend-live-dot" />

                  <strong>
                    LIVE TREND
                  </strong>

                  <span>
                    Google Trends Malaysia
                  </span>

                </div>

                {/* MOMENTUM */}

                <div className="trend-detail-momentum">

                  <div className="detail-momentum-header">

                    <span>
                      Momentum Score
                    </span>

                    <strong>
                      {selectedTrend.momentum}
                      <small>
                        /99
                      </small>
                    </strong>

                  </div>

                  <div className="detail-momentum-track">

                    <span
                      className={getMomentumClass(
                        selectedTrend.momentum
                      )}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            selectedTrend.momentum,
                            0
                          ),
                          99
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="detail-momentum-footer">

                    <span
                      className={`trend-status ${getMomentumClass(
                        selectedTrend.momentum
                      )}`}
                    >
                      <span />

                      {selectedTrend.status}
                    </span>

                    <span>
                      Opportunity:{" "}
                      <strong>
                        {
                          selectedTrend.opportunity
                        }
                      </strong>
                    </span>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="trend-detail-section">

                  <div className="trend-section-label">

                    <BarChart3
                      size={15}
                    />

                    Overview

                  </div>

                  <p>
                    {
                      selectedTrend.description
                    }
                  </p>

                </div>

                {/* METRICS */}

                <div className="trend-detail-metrics">

                  <div className="trend-detail-metric">

                    <span>
                      Rank
                    </span>

                    <strong>
                      #
                      {
                        selectedTrend.rankNumber
                      }
                    </strong>

                  </div>

                  <div className="trend-detail-metric">

                    <span>
                      Growth
                    </span>

                    <strong>
                      {
                        selectedTrend.growth
                      }
                    </strong>

                  </div>

                  <div className="trend-detail-metric">

                    <span>
                      Searches
                    </span>

                    <strong>
                      {
                        selectedTrend.posts
                      }
                    </strong>

                  </div>

                  <div className="trend-detail-metric">

                    <span>
                      Engagement
                    </span>

                    <strong>
                      {
                        selectedTrend.engagement
                      }
                    </strong>

                  </div>

                </div>

                {/* OPPORTUNITY */}

                <div className="trend-opportunity-box">

                  <div className="trend-opportunity-icon">
                    <Lightbulb
                      size={17}
                    />
                  </div>

                  <div>

                    <div className="trend-opportunity-title">

                      <span>
                        Content Opportunity
                      </span>

                      <span
                        className={`opportunity-badge ${getOpportunityClass(
                          selectedTrend.opportunity
                        )}`}
                      >
                        {
                          selectedTrend.opportunity
                        }
                      </span>

                    </div>

                    <p>
                      {
                        selectedTrend.opportunityText
                      }
                    </p>

                  </div>

                </div>

                {/* HASHTAGS */}

                <div className="trend-detail-section">

                  <div className="trend-section-label">

                    <HashIcon />

                    Suggested Hashtags

                  </div>

                  <div className="detail-hashtags">

                    {selectedTrend.hashtags.length >
                    0 ? (
                      selectedTrend.hashtags.map(
                        (
                          hashtag
                        ) => (
                          <button
                            type="button"
                            key={
                              hashtag
                            }
                            onClick={() =>
                              handleCopyHashtag(
                                hashtag
                              )
                            }
                          >
                            {copiedHashtag ===
                            hashtag ? (
                              <>
                                <Check
                                  size={
                                    12
                                  }
                                />

                                Copied
                              </>
                            ) : (
                              hashtag
                            )}
                          </button>
                        )
                      )
                    ) : (
                      <span>
                        No hashtags available.
                      </span>
                    )}

                  </div>

                </div>

                {/* IDEAS */}

                <div className="trend-detail-section">

                  <div className="trend-section-label">

                    <Sparkles
                      size={15}
                    />

                    Content Ideas

                  </div>

                  <div className="trend-ideas">

                    {selectedTrend.ideas.length >
                    0 ? (
                      selectedTrend.ideas
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            idea,
                            index
                          ) => (
                            <button
                              type="button"
                              key={`${selectedTrend.id}-idea-${index}`}
                              onClick={() =>
                                handleGenerateContent(
                                  selectedTrend,
                                  idea
                                )
                              }
                            >
                              <span>
                                {index + 1}
                              </span>

                              <strong>
                                {idea}
                              </strong>

                              <ChevronRight
                                size={
                                  15
                                }
                              />
                            </button>
                          )
                        )
                    ) : (
                      <div className="trend-no-ideas">
                        No content ideas
                        available.
                      </div>
                    )}

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="trend-detail-actions">

                  <button
                    type="button"
                    className="trend-primary-action"
                    onClick={() =>
                      handleGenerateContent(
                        selectedTrend,
                        selectedTrend.ideas?.[0] ||
                          ""
                      )
                    }
                  >
                    <Sparkles
                      size={17}
                    />

                    Generate Content

                  </button>

                  <button
                    type="button"
                    className="trend-secondary-action"
                    onClick={() =>
                      handleOpenSource(
                        selectedTrend
                      )
                    }
                    disabled={
                      !selectedTrend.sourceUrl
                    }
                  >
                    <ExternalLink
                      size={16}
                    />

                    View on Google Trends

                  </button>

                </div>

                {/* SOURCE */}

                <div className="trend-detail-source">

                  <span>
                    Source
                  </span>

                  <strong>
                    {
                      selectedTrend.source
                    }
                  </strong>

                  <span>
                    •
                  </span>

                  <span>
                    Malaysia
                  </span>

                </div>

              </div>
            ) : (
              <div className="trend-detail-placeholder">

                <div className="trend-placeholder-icon">
                  <Zap size={25} />
                </div>

                <h3>
                  Select a trend
                </h3>

                <p>
                  Select any trend from the
                  list to view momentum,
                  opportunity, hashtags and
                  content ideas.
                </p>

              </div>
            )}

          </aside>

        </div>
      )}

    </div>
  );
}

// ======================================================
// HASH ICON
// ======================================================

function HashIcon() {
  return (
    <span
      style={{
        fontWeight: 800,
        fontSize: "14px",
        lineHeight: 1,
      }}
    >
      #
    </span>
  );
}