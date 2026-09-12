// ======================================================
// AR CONTENTPILOT
// LIVE TREND RADAR API V2
// Google Trends Malaysia
// ======================================================
//
// File:
// api/trend.js
//
// Purpose:
// Fetch live Google Trends Malaysia data and transform it
// into Trend Radar data used by AR ContentPilot.
//
// IMPORTANT:
// - This file runs as a Vercel Serverless Function.
// - Local development should use:
//   npx vercel dev
//
// Endpoint:
// GET /api/trend
//
// ======================================================


// ======================================================
// GOOGLE TRENDS
// ======================================================

const GOOGLE_TRENDS_URL =
  "https://trends.google.com/trending/rss?geo=MY";


// ======================================================
// BASIC HELPERS
// ======================================================

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .trim();
}


function cleanText(value = "") {
  return decodeXml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function getTag(xml, tag) {
  const safeTag = String(tag)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<${safeTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safeTag}>`,
    "i"
  );

  const match = xml.match(regex);

  return match
    ? cleanText(match[1])
    : "";
}


function getAllItems(xml) {
  return (
    xml.match(
      /<item\b[\s\S]*?<\/item>/gi
    ) || []
  );
}


// ======================================================
// NUMBER HELPERS
// ======================================================

function parseNumber(value = "") {
  if (!value) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/\+/g, "")
    .trim()
    .toUpperCase();

  const match = cleaned.match(
    /(\d+(?:\.\d+)?)\s*([KMB])?/
  );

  if (!match) {
    return 0;
  }

  const number = Number(match[1]) || 0;
  const suffix = match[2] || "";

  if (suffix === "K") {
    return number * 1000;
  }

  if (suffix === "M") {
    return number * 1000000;
  }

  if (suffix === "B") {
    return number * 1000000000;
  }

  return number;
}


function formatNumber(number) {
  const value = Number(number) || 0;

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  if (value > 0) {
    return String(Math.round(value));
  }

  return "—";
}


// ======================================================
// GOOGLE TRENDS DATA PARSING
// ======================================================

function parseSearchVolume(description = "") {
  const patterns = [
    /([\d,.]+\s*[KMB]?\+?)\s+searches?/i,
    /([\d,.]+\s*[KMB]?\+?)\s+search/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);

    if (match) {
      return match[1]
        .replace(/\s+/g, "")
        .trim();
    }
  }

  return "—";
}


function parseGrowth(description = "") {
  const patterns = [
    /(?:growth|increase|increased|up|surge|surged)[^+\d-]*([+-]?\d[\d,.]*%)/i,
    /([+-]?\d[\d,.]*%)\s*(?:growth|increase|increased|up)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
}


function parseTraffic(description = "") {
  return parseSearchVolume(
    description
  );
}


// ======================================================
// NORMALIZE TITLE
// ======================================================

function normalizeTitle(title = "") {
  return String(title)
    .replace(/\s+/g, " ")
    .trim();
}


function titleWords(title = "") {
  return normalizeTitle(title)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}


// ======================================================
// CATEGORY DETECTION
// ======================================================

function containsAny(text, words) {
  return words.some((word) =>
    text.includes(word)
  );
}


function inferCategory(title = "") {
  const value =
    normalizeTitle(title).toLowerCase();

  // --------------------------------------------------
  // SPORTS
  // --------------------------------------------------

  const sportsWords = [
    "football",
    "soccer",
    "fifa",
    "uefa",
    "liga",
    "league",
    "champions",
    "premier league",
    "europa league",
    "world cup",
    "cup",
    "match",
    "score",
    "vs",
    "lwn",
    "fc ",
    " f.c.",
    "bayern",
    "munich",
    "liverpool",
    "chelsea",
    "arsenal",
    "barcelona",
    "real madrid",
    "manchester",
    "man utd",
    "man united",
    "psg",
    "al-nassr",
    "inter milan",
    "juventus",
    "milan",
    "tennis",
    "wimbledon",
    "us open",
    "australian open",
    "french open",
    "coco gauff",
    "gauff",
    "sabalenka",
    "aryna",
    "player",
    "pemain",
    "badminton",
    "bwf",
    "olympic",
    "olympics",
    "f1",
    "formula 1",
    "motogp",
    "racing",
    "nba",
    "nfl",
    "cricket",
  ];

  // --------------------------------------------------
  // TECHNOLOGY
  // --------------------------------------------------

  const technologyWords = [
    "iphone",
    "ipad",
    "macbook",
    "imac",
    "apple",
    "samsung",
    "android",
    "google",
    "chatgpt",
    "openai",
    "gemini",
    "claude",
    "ai",
    "artificial intelligence",
    "technology",
    "tech",
    "airpods",
    "laptop",
    "smartphone",
    "phone",
    "pixel",
    "galaxy",
    "fold",
    "app",
    "software",
    "microsoft",
    "windows",
    "meta",
    "facebook",
    "instagram",
    "threads",
    "tiktok",
    "youtube",
    "whatsapp",
    "cyber",
    "crypto",
    "bitcoin",
    "ethereum",
  ];

  // --------------------------------------------------
  // ENTERTAINMENT
  // --------------------------------------------------

  const entertainmentWords = [
    "marvel",
    "wolverine",
    "avengers",
    "dc",
    "batman",
    "superman",
    "movie",
    "film",
    "cinema",
    "series",
    "drama",
    "netflix",
    "disney",
    "actor",
    "actress",
    "celebrity",
    "artis",
    "singer",
    "pelakon",
    "concert",
    "music",
    "song",
    "album",
    "tour",
    "festival",
    "award",
    "oscar",
    "grammy",
    "trevor noah",
    "taylor swift",
    "beyonce",
    "rihanna",
    "aliff",
    "redza",
  ];

  // --------------------------------------------------
  // BUSINESS / FINANCE
  // --------------------------------------------------

  const businessWords = [
    "business",
    "bisnes",
    "entrepreneur",
    "startup",
    "company",
    "sales",
    "marketing",
    "brand",
    "bank",
    "banking",
    "money",
    "emas",
    "gold",
    "investment",
    "invest",
    "investing",
    "market",
    "stock",
    "stocks",
    "economy",
    "economic",
    "ringgit",
    "finance",
    "financial",
    "loan",
    "interest rate",
    "property",
    "rumah",
    "housing",
    "bursa",
    "maybank",
    "cimb",
    "public bank",
  ];

  // --------------------------------------------------
  // LIFESTYLE
  // --------------------------------------------------

  const lifestyleWords = [
    "life",
    "lifestyle",
    "health",
    "food",
    "travel",
    "fashion",
    "beauty",
    "fitness",
    "recipe",
    "restaurant",
    "hotel",
    "holiday",
    "vacation",
    "perth",
    "malaysia",
    "education",
    "school",
    "university",
    "career",
    "work",
    "job",
    "pencen",
    "parenting",
    "family",
    "ramadan",
    "hari raya",
    "puasa",
    "wedding",
  ];

  if (
    containsAny(
      value,
      sportsWords
    )
  ) {
    return "Sports";
  }

  if (
    containsAny(
      value,
      technologyWords
    )
  ) {
    return "Technology";
  }

  if (
    containsAny(
      value,
      entertainmentWords
    )
  ) {
    return "Entertainment";
  }

  if (
    containsAny(
      value,
      businessWords
    )
  ) {
    return "Business";
  }

  if (
    containsAny(
      value,
      lifestyleWords
    )
  ) {
    return "Lifestyle";
  }

  return "General";
}


// ======================================================
// CATEGORY ACCENT
// ======================================================

function getAccent(category) {
  switch (category) {
    case "Technology":
      return "purple";

    case "Business":
      return "orange";

    case "Sports":
      return "green";

    case "Entertainment":
      return "pink";

    case "Lifestyle":
      return "cyan";

    default:
      return "blue";
  }
}


// ======================================================
// CATEGORY ICON
// ======================================================

function getIcon(category) {
  switch (category) {
    case "Technology":
      return "sparkles";

    case "Business":
      return "trending-up";

    case "Sports":
      return "zap";

    case "Entertainment":
      return "message-circle";

    case "Lifestyle":
      return "flame";

    default:
      return "bar-chart";
  }
}


// ======================================================
// GROWTH ESTIMATION
// ======================================================
//
// Google Trends RSS sometimes does not expose a direct
// percentage growth value.
//
// Instead of falsely displaying "+100%" for everything,
// we use the trend position + traffic information to
// create a transparent estimated momentum.
//
// ======================================================

function getGrowthNumber(growth) {
  if (!growth) {
    return 0;
  }

  return Number(
    String(growth)
      .replace("%", "")
      .replace("+", "")
      .replace(",", "")
      .trim()
  ) || 0;
}


function estimateGrowth(
  rank,
  volume,
  publishedAt
) {
  const numericVolume =
    parseNumber(volume);

  let score = 0;

  // Higher-ranked trends receive
  // stronger baseline momentum.

  if (rank === 1) {
    score += 45;
  } else if (rank <= 3) {
    score += 38;
  } else if (rank <= 5) {
    score += 32;
  } else if (rank <= 10) {
    score += 26;
  } else if (rank <= 20) {
    score += 20;
  } else {
    score += 15;
  }

  // Traffic signal.

  if (numericVolume >= 100000) {
    score += 30;
  } else if (numericVolume >= 50000) {
    score += 25;
  } else if (numericVolume >= 20000) {
    score += 20;
  } else if (numericVolume >= 10000) {
    score += 15;
  } else if (numericVolume >= 5000) {
    score += 10;
  } else if (numericVolume >= 2000) {
    score += 6;
  }

  // Recent publication gets a small boost.

  if (publishedAt) {
    const publishedTime =
      new Date(
        publishedAt
      ).getTime();

    if (
      Number.isFinite(
        publishedTime
      )
    ) {
      const ageHours =
        (
          Date.now() -
          publishedTime
        ) /
        (1000 * 60 * 60);

      if (ageHours <= 2) {
        score += 20;
      } else if (ageHours <= 6) {
        score += 15;
      } else if (ageHours <= 12) {
        score += 10;
      } else if (ageHours <= 24) {
        score += 5;
      }
    }
  }

  return Math.min(
    Math.max(
      Math.round(score),
      1
    ),
    99
  );
}


// ======================================================
// MOMENTUM
// ======================================================

function calculateMomentum({
  rank,
  growth,
  volume,
  publishedAt,
}) {
  const growthNumber =
    getGrowthNumber(
      growth
    );

  // If actual growth exists,
  // prioritize it.

  if (growthNumber > 0) {
    let score = 50;

    if (growthNumber >= 1000) {
      score += 40;
    } else if (growthNumber >= 500) {
      score += 35;
    } else if (growthNumber >= 300) {
      score += 30;
    } else if (growthNumber >= 200) {
      score += 25;
    } else if (growthNumber >= 100) {
      score += 18;
    } else if (growthNumber >= 50) {
      score += 12;
    } else if (growthNumber >= 20) {
      score += 7;
    }

    if (rank <= 3) {
      score += 5;
    }

    return Math.min(
      score,
      99
    );
  }

  // Otherwise use estimated momentum.

  return estimateGrowth(
    rank,
    volume,
    publishedAt
  );
}


// ======================================================
// STATUS
// ======================================================

function getStatus(momentum) {
  if (momentum >= 85) {
    return {
      label: "RISING",
      type: "rising",
    };
  }

  if (momentum >= 70) {
    return {
      label: "HOT",
      type: "hot",
    };
  }

  return {
    label: "STABLE",
    type: "stable",
  };
}


// ======================================================
// OPPORTUNITY
// ======================================================

function getOpportunity(momentum) {
  if (momentum >= 90) {
    return {
      label: "Very High",
      type: "very-high",
    };
  }

  if (momentum >= 80) {
    return {
      label: "High",
      type: "high",
    };
  }

  if (momentum >= 65) {
    return {
      label: "Medium",
      type: "medium",
    };
  }

  return {
    label: "Low",
    type: "low",
  };
}


// ======================================================
// HASHTAGS
// ======================================================

function sanitizeHashtag(word = "") {
  return String(word)
    .replace(
      /[^a-zA-Z0-9À-ÿ]/g,
      ""
    )
    .trim();
}


function generateHashtags(
  title,
  category
) {
  const words =
    titleWords(title)
      .map(
        sanitizeHashtag
      )
      .filter(
        (word) =>
          word.length >= 2
      )
      .slice(0, 2);

  const categoryMap = {
    Technology: "#Technology",
    Business: "#Business",
    Sports: "#Sports",
    Entertainment:
      "#Entertainment",
    Lifestyle: "#Lifestyle",
    General: "#Trending",
  };

  const tags = [
    ...words.map(
      (word) =>
        `#${word}`
    ),
    categoryMap[
      category
    ] || "#Trending",
  ];

  return [
    ...new Set(tags),
  ].slice(0, 3);
}


// ======================================================
// CONTENT IDEAS
// ======================================================

function generateIdeas(
  title,
  category
) {
  const cleanTitle =
    normalizeTitle(title);

  const ideas = [
    `Apa sebenarnya yang sedang berlaku dengan ${cleanTitle}?`,

    `Kenapa ${cleanTitle} tiba-tiba trending di Malaysia?`,

    `3 perkara yang perlu anda tahu tentang ${cleanTitle}`,
  ];

  if (
    category ===
    "Sports"
  ) {
    ideas.push(
      `Apa kesan trend ${cleanTitle} kepada peminat sukan Malaysia?`
    );
  }

  if (
    category ===
    "Technology"
  ) {
    ideas.push(
      `Apa yang pengguna Malaysia perlu tahu tentang ${cleanTitle}?`
    );
  }

  if (
    category ===
    "Business"
  ) {
    ideas.push(
      `Apa peluang bisnes yang boleh dilihat daripada trend ${cleanTitle}?`
    );
  }

  if (
    category ===
    "Entertainment"
  ) {
    ideas.push(
      `Kenapa ramai rakyat Malaysia bercakap tentang ${cleanTitle}?`
    );
  }

  if (
    category ===
    "Lifestyle"
  ) {
    ideas.push(
      `Apa yang trend ${cleanTitle} tunjuk tentang kehidupan rakyat Malaysia?`
    );
  }

  return ideas.slice(
    0,
    4
  );
}


// ======================================================
// DESCRIPTION
// ======================================================

function generateDescription(
  title,
  category,
  momentum
) {
  let categoryText =
    "perhatian umum";

  switch (category) {
    case "Technology":
      categoryText =
        "teknologi dan inovasi";
      break;

    case "Business":
      categoryText =
        "bisnes dan ekonomi";
      break;

    case "Sports":
      categoryText =
        "sukan";
      break;

    case "Entertainment":
      categoryText =
        "hiburan dan budaya popular";
      break;

    case "Lifestyle":
      categoryText =
        "gaya hidup";
      break;

    default:
      categoryText =
        "carian semasa";
  }

  return (
    `Trend "${title}" sedang mendapat perhatian dalam kategori ${categoryText} di Malaysia. ` +
    `Trend Radar menganggarkan momentum semasa pada ${momentum}/99 berdasarkan ` +
    `kedudukan trend, jumlah carian yang tersedia dan kesegaran data.`
  );
}


// ======================================================
// OPPORTUNITY TEXT
// ======================================================

function generateOpportunityText(
  title,
  opportunity,
  category
) {
  if (
    opportunity ===
    "Very High"
  ) {
    return (
      `"${title}" mempunyai momentum yang sangat tinggi. ` +
      `Ini merupakan peluang pantas untuk menghasilkan content ${category.toLowerCase()} ` +
      `sebelum perhatian terhadap trend mula menurun.`
    );
  }

  if (
    opportunity ===
    "High"
  ) {
    return (
      `"${title}" menunjukkan momentum yang kuat. ` +
      `Pertimbangkan content yang relevan dan cepat untuk mengambil peluang daripada trend ini.`
    );
  }

  if (
    opportunity ===
    "Medium"
  ) {
    return (
      `"${title}" sedang mendapat perhatian di Malaysia. ` +
      `Trend ini sesuai digunakan sebagai inspirasi content jika ia relevan dengan audience anda.`
    );
  }

  return (
    `"${title}" mempunyai momentum sederhana. ` +
    `Pantau perkembangannya sebelum menghasilkan content khusus mengenai trend ini.`
  );
}


// ======================================================
// SOURCE URL
// ======================================================

function getSourceUrl(title) {
  return (
    "https://trends.google.com/trends/explore" +
    `?geo=MY&q=${encodeURIComponent(
      title
    )}`
  );
}


// ======================================================
// CREATE TREND OBJECT
// ======================================================

function createTrend(
  item,
  index
) {
  const title =
    normalizeTitle(
      getTag(
        item,
        "title"
      )
    );

  const description =
    cleanText(
      getTag(
        item,
        "description"
      )
    );

  const pubDate =
    getTag(
      item,
      "pubDate"
    ) ||
    getTag(
      item,
      "ht:approx_traffic_time"
    ) ||
    null;

  const rank =
    index + 1;

  const volume =
    parseTraffic(
      description
    );

  const actualGrowth =
    parseGrowth(
      description
    );

  const growth =
    actualGrowth ||
    null;

  const category =
    inferCategory(
      title
    );

  const momentum =
    calculateMomentum({
      rank,
      growth,
      volume,
      publishedAt:
        pubDate,
    });

  const status =
    getStatus(
      momentum
    );

  const opportunity =
    getOpportunity(
      momentum
    );

  const hashtags =
    generateHashtags(
      title,
      category
    );

  const ideas =
    generateIdeas(
      title,
      category
    );

  return {
    id:
      `google-${index}-${Date.now()}`,

    rank:
      String(rank).padStart(
        2,
        "0"
      ),

    rankNumber:
      rank,

    title,

    category,

    description:
      generateDescription(
        title,
        category,
        momentum
      ),

    hashtags,

    momentum,

    // Only show real growth when Google Trends
    // actually provides it.
    growth:
      growth ||
      "—",

    // Raw traffic / search volume.
    posts:
      volume ||
      "—",

    engagement:
      "Live",

    status:
      status.label,

    statusType:
      status.type,

    accent:
      getAccent(
        category
      ),

    icon:
      getIcon(
        category
      ),

    opportunity:
      opportunity.label,

    opportunityType:
      opportunity.type,

    opportunityText:
      generateOpportunityText(
        title,
        opportunity.label,
        category
      ),

    ideas,

    source:
      "Google Trends",

    sourceUrl:
      getSourceUrl(
        title
      ),

    publishedAt:
      pubDate,

    live:
      true,

    country:
      "MY",

    sourceType:
      "google-trends-rss",

    updatedAt:
      new Date().toISOString(),
  };
}


// ======================================================
// REMOVE DUPLICATES
// ======================================================

function removeDuplicateTrends(
  trends
) {
  const seen =
    new Set();

  return trends.filter(
    (trend) => {
      const key =
        normalizeTitle(
          trend.title
        ).toLowerCase();

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}


// ======================================================
// SORT TRENDS
// ======================================================

function sortTrends(
  trends
) {
  return [
    ...trends,
  ].sort(
    (a, b) => {
      if (
        b.momentum !==
        a.momentum
      ) {
        return (
          b.momentum -
          a.momentum
        );
      }

      return (
        a.rankNumber -
        b.rankNumber
      );
    }
  );
}


// ======================================================
// REFRESH RANKS
// ======================================================

function refreshRanks(
  trends
) {
  return trends.map(
    (
      trend,
      index
    ) => ({
      ...trend,

      rank:
        String(
          index + 1
        ).padStart(
          2,
          "0"
        ),

      rankNumber:
        index + 1,
    })
  );
}


// ======================================================
// MAIN HANDLER
// ======================================================

export default async function handler(
  req,
  res
) {
  // --------------------------------------------------
  // CORS
  // --------------------------------------------------

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // --------------------------------------------------
  // OPTIONS
  // --------------------------------------------------

  if (
    req.method ===
    "OPTIONS"
  ) {
    return res
      .status(200)
      .end();
  }

  // --------------------------------------------------
  // ONLY GET
  // --------------------------------------------------

  if (
    req.method !==
    "GET"
  ) {
    return res
      .status(405)
      .json({
        success:
          false,

        message:
          "Method not allowed",
      });
  }

  // --------------------------------------------------
  // FETCH GOOGLE TRENDS
  // --------------------------------------------------

  try {
    const response =
      await fetch(
        GOOGLE_TRENDS_URL,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

            Accept:
              "application/rss+xml, application/xml, text/xml, */*",
          },
        }
      );

    // ------------------------------------------------
    // GOOGLE RESPONSE ERROR
    // ------------------------------------------------

    if (
      !response.ok
    ) {
      throw new Error(
        `Google Trends returned ${response.status}`
      );
    }

    // ------------------------------------------------
    // XML
    // ------------------------------------------------

    const xml =
      await response.text();

    if (
      !xml ||
      xml.length < 20
    ) {
      throw new Error(
        "Google Trends returned an empty response."
      );
    }

    // ------------------------------------------------
    // ITEMS
    // ------------------------------------------------

    const items =
      getAllItems(
        xml
      );

    if (
      !items.length
    ) {
      throw new Error(
        "No trend items were found in Google Trends RSS."
      );
    }

    // ------------------------------------------------
    // CREATE TRENDS
    // ------------------------------------------------

    let trends =
      items
        .map(
          (
            item,
            index
          ) =>
            createTrend(
              item,
              index
            )
        )
        .filter(
          (
            trend
          ) =>
            trend.title
        );

    // ------------------------------------------------
    // REMOVE DUPLICATES
    // ------------------------------------------------

    trends =
      removeDuplicateTrends(
        trends
      );

    // ------------------------------------------------
    // SORT BY MOMENTUM
    // ------------------------------------------------

    trends =
      sortTrends(
        trends
      );

    // ------------------------------------------------
    // LIMIT
    // ------------------------------------------------

    trends =
      trends.slice(
        0,
        30
      );

    // ------------------------------------------------
    // REFRESH RANKS
    // ------------------------------------------------

    trends =
      refreshRanks(
        trends
      );

    // ------------------------------------------------
    // RESPONSE
    // ------------------------------------------------

    return res
      .status(200)
      .json({
        success:
          true,

        source:
          "Google Trends Malaysia",

        country:
          "MY",

        region:
          "Malaysia",

        updatedAt:
          new Date().toISOString(),

        count:
          trends.length,

        live:
          true,

        trends,
      });
  } catch (error) {
    // ------------------------------------------------
    // ERROR
    // ------------------------------------------------

    console.error(
      "Trend Radar API V2 Error:",
      error
    );

    return res
      .status(500)
      .json({
        success:
          false,

        source:
          "Google Trends Malaysia",

        country:
          "MY",

        live:
          false,

        message:
          "Unable to retrieve live Google Trends data.",

        error:
          error?.message ||
          "Unknown error",

        trends:
          [],
      });
  }
}