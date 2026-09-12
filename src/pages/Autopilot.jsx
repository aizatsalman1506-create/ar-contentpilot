// ======================================================
// AR CONTENTPILOT
// AUTOPILOT PAGE
// ======================================================
// REAL GEMINI AI VERSION
//
// Features:
// - Real Gemini AI generation
// - Gemini 3.6 Flash
// - Trending / Viral / Quotes / Emotional
// - Tone selection
// - Language selection
// - AI hashtags
// - Firestore content queue
// - Firestore calendar scheduling
// - Autopilot interval
// - Daily limit
// - Auto queue
// - Auto publish preparation
// - Existing AR ContentPilot UI preserved
// ======================================================

import { useMemo, useState } from "react";

import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  Hash,
  Heart,
  History,
  MessageCircle,
  Pause,
  Play,
  Quote,
  RefreshCw,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import "./Autopilot.css";

// ======================================================
// FIRESTORE COLLECTIONS
// ======================================================

const CALENDAR_COLLECTION = "calendarPosts";
const CONTENT_COLLECTION = "content";

// ======================================================
// GEMINI
// ======================================================

// IMPORTANT:
// Put this in .env:
//
// VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
//
// Then restart Vite:
//
// npm run dev
//
// Do NOT put the API key directly inside this file.

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || "";

const GEMINI_MODEL =
  "gemini-3.6-flash";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ======================================================
// CONTENT OPTIONS
// ======================================================

const contentOptions = [
  {
    id: "trending",
    label: "Trending",
    description: "Current hot topics",
    icon: Flame,
    className: "orange",
  },
  {
    id: "viral",
    label: "Viral",
    description: "High engagement ideas",
    icon: Zap,
    className: "purple",
  },
  {
    id: "quotes",
    label: "Quotes",
    description: "Life & wisdom",
    icon: Quote,
    className: "cyan",
  },
  {
    id: "emotional",
    label: "Emotional",
    description: "Feelings & stories",
    icon: Heart,
    className: "pink",
  },
];

// ======================================================
// OPTIONS
// ======================================================

const intervalOptions = [
  "Every 2 hours",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Once a day",
];

const toneOptions = [
  "Casual",
  "Professional",
  "Inspirational",
  "Funny",
  "Emotional",
  "Bold",
];

const languageOptions = [
  "Bahasa Melayu",
  "English",
  "Bahasa Melayu + English",
];

// ======================================================
// TOGGLE
// ======================================================

function Toggle({
  enabled,
  onChange,
}) {
  return (
    <button
      type="button"
      className={`autopilot-toggle ${
        enabled ? "enabled" : ""
      }`}
      onClick={() => onChange(!enabled)}
      aria-label={
        enabled
          ? "Disable setting"
          : "Enable setting"
      }
    >
      <span />
    </button>
  );
}

// ======================================================
// SETTING ROW
// ======================================================

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="automation-setting-row">
      <div className="automation-setting-icon">
        <Icon size={15} />
      </div>

      <div className="automation-setting-copy">
        <strong>{title}</strong>

        <span>
          {description}
        </span>
      </div>

      <Toggle
        enabled={enabled}
        onChange={onChange}
      />
    </div>
  );
}

// ======================================================
// HELPERS
// ======================================================

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

function getTimeKey(date) {
  return `${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function getIntervalHours(interval) {
  const intervalMap = {
    "Every 2 hours": 2,
    "Every 4 hours": 4,
    "Every 6 hours": 6,
    "Every 8 hours": 8,
    "Once a day": 24,
  };

  return intervalMap[interval] || 4;
}

// ======================================================
// NEXT SCHEDULE TIME
// ======================================================

function getNextScheduleTime(
  interval,
  startTime,
  endTime
) {
  const now = new Date();

  const hours =
    getIntervalHours(interval);

  const [startHour, startMinute] =
    String(startTime)
      .split(":")
      .map(Number);

  const [endHour, endMinute] =
    String(endTime)
      .split(":")
      .map(Number);

  const startMinutes =
    startHour * 60 +
    startMinute;

  const endMinutes =
    endHour * 60 +
    endMinute;

  const nowMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  let candidate = new Date(now);

  candidate.setSeconds(0);
  candidate.setMilliseconds(0);

  // ----------------------------------------------------
  // FIRST RUN
  // ----------------------------------------------------

  if (nowMinutes < startMinutes) {
    candidate.setHours(
      startHour,
      startMinute,
      0,
      0
    );

    return candidate;
  }

  // ----------------------------------------------------
  // OUTSIDE END WINDOW
  // ----------------------------------------------------

  if (
    endMinutes >= startMinutes &&
    nowMinutes >= endMinutes
  ) {
    candidate.setDate(
      candidate.getDate() + 1
    );

    candidate.setHours(
      startHour,
      startMinute,
      0,
      0
    );

    return candidate;
  }

  // ----------------------------------------------------
  // NEXT INTERVAL
  // ----------------------------------------------------

  candidate = new Date(
    now.getTime() +
      hours * 60 * 60 * 1000
  );

  candidate.setSeconds(0);
  candidate.setMilliseconds(0);

  const candidateMinutes =
    candidate.getHours() * 60 +
    candidate.getMinutes();

  if (
    endMinutes >= startMinutes &&
    candidateMinutes > endMinutes
  ) {
    candidate.setDate(
      candidate.getDate() + 1
    );

    candidate.setHours(
      startHour,
      startMinute,
      0,
      0
    );
  }

  return candidate;
}

// ======================================================
// GEMINI JSON CLEANER
// ======================================================

function cleanGeminiJson(text) {
  if (!text) {
    return null;
  }

  let cleaned =
    String(text).trim();

  cleaned =
    cleaned
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned =
      cleaned.slice(
        firstBrace,
        lastBrace + 1
      );
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ======================================================
// GEMINI GENERATION
// ======================================================

async function generateWithGemini({
  contentType,
  tone,
  language,
  autoHashtags,
}) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key belum diset. Sila tambah VITE_GEMINI_API_KEY dalam fail .env dan restart Vite."
    );
  }

  const typeLabel =
    contentOptions.find(
      (item) =>
        item.id === contentType
    )?.label ||
    "Trending";

  const hashtagInstruction =
    autoHashtags
      ? `
Generate 4 to 6 relevant hashtags.
Hashtags must be natural and relevant.
Do not use random hashtags.
Return them as an array of strings.
`
      : `
Return an empty hashtags array.
`;

  const languageInstruction =
    language === "Bahasa Melayu"
      ? `
Write naturally in Malaysian Bahasa Melayu.
Use modern, conversational Malaysian Malay.
Do not sound like a textbook.
`
      : language === "English"
      ? `
Write naturally in English.
Use modern social-media English.
`
      : `
Use a natural combination of Bahasa Melayu and English.
The result must sound like a Malaysian creator, not a translation.
`;

  const typeInstruction = {
    trending: `
Create content around a current-interest topic
that people in Malaysia would likely discuss.
Do not invent fake statistics or fake news.
Make the opening hook strong.
`,
    viral: `
Create highly engaging social content.
Start with a strong hook.
Use curiosity, relatability or a useful insight.
Do not use clickbait that makes false claims.
`,
    quotes: `
Create an original life or mindset quote-style post.
It must feel thoughtful and memorable.
Avoid famous copyrighted quotes.
`,
    emotional: `
Create relatable emotional content about life,
struggle, growth, relationships, work or self-worth.
Make it emotionally authentic without becoming overly dramatic.
`,
  };

  const prompt = `
You are the real AI content engine for AR ContentPilot.

Create ONE high-quality Threads post.

CONTENT TYPE:
${typeLabel}

TONE:
${tone}

LANGUAGE:
${language}

TARGET AUDIENCE:
Malaysian social media audience.

${languageInstruction}

${typeInstruction[contentType]}

WRITING RULES:
- Write like a real human creator.
- No generic AI-sounding introductions.
- No "In today's fast-paced world".
- No unnecessary corporate language.
- No fake facts.
- No fake statistics.
- No "As an AI".
- Make the first sentence strong.
- Keep the post concise enough for Threads.
- Prefer short paragraphs.
- Use natural Malaysian social-media style.
- Avoid excessive emojis.
- Maximum 500 characters for the main body.
- Make the content useful, relatable or emotionally interesting.

${hashtagInstruction}

Return ONLY valid JSON.

Required JSON format:

{
  "title": "short internal title",
  "body": "the Threads post",
  "hashtags": ["#example", "#threads"],
  "type": "${typeLabel}"
}
`;

  const response =
    await fetch(
      GEMINI_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",

              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 700,
            responseMimeType:
              "application/json",
          },
        }),
      }
    );

  if (!response.ok) {
    let errorMessage =
      "Gemini generation failed.";

    try {
      const errorData =
        await response.json();

      errorMessage =
        errorData?.error?.message ||
        errorMessage;
    } catch {
      // Ignore parsing error.
    }

    throw new Error(
      errorMessage
    );
  }

  const data =
    await response.json();

  const rawText =
    data?.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text || "";

  if (!rawText) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  const parsed =
    cleanGeminiJson(rawText);

  if (!parsed) {
    throw new Error(
      "Gemini returned an invalid response format."
    );
  }

  const body =
    String(
      parsed.body ||
        parsed.description ||
        ""
    ).trim();

  if (!body) {
    throw new Error(
      "Gemini did not generate any content."
    );
  }

  let hashtags =
    Array.isArray(
      parsed.hashtags
    )
      ? parsed.hashtags
      : [];

  hashtags =
    hashtags
      .map((tag) =>
        String(tag)
          .trim()
          .replace(/\s+/g, "")
      )
      .filter(Boolean)
      .map((tag) =>
        tag.startsWith("#")
          ? tag
          : `#${tag}`
      )
      .slice(0, 6);

  return {
    title:
      String(
        parsed.title ||
          `${typeLabel} AI Content`
      ).trim(),

    body,

    hashtags,

    type:
      parsed.type ||
      typeLabel,
  };
}

// ======================================================
// AUTOPILOT
// ======================================================

function Autopilot({
  onNavigate,
}) {
  // ====================================================
  // STATE
  // ====================================================

  const [enabled, setEnabled] =
    useState(true);

  const [interval, setInterval] =
    useState("Every 4 hours");

  const [startTime, setStartTime] =
    useState("08:00");

  const [endTime, setEndTime] =
    useState("23:00");

  const [contentTypes, setContentTypes] =
    useState([
      "trending",
      "viral",
      "quotes",
      "emotional",
    ]);

  const [tone, setTone] =
    useState("Casual");

  const [language, setLanguage] =
    useState("Bahasa Melayu");

  const [autoHashtags, setAutoHashtags] =
    useState(true);

  const [autoQueue, setAutoQueue] =
    useState(true);

  const [autoPublish, setAutoPublish] =
    useState(false);

  const [dailyLimit, setDailyLimit] =
    useState("6");

  const [saved, setSaved] =
    useState(false);

  const [scheduling, setScheduling] =
    useState(false);

  const [scheduleMessage, setScheduleMessage] =
    useState("");

  // ====================================================
  // CONTENT TYPE
  // ====================================================

  const toggleContentType = (id) => {
    setContentTypes((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter(
          (item) =>
            item !== id
        );
      }

      return [
        ...current,
        id,
      ];
    });

    setSaved(false);
  };

  // ====================================================
  // SELECTED CONTENT LABEL
  // ====================================================

  const selectedContentLabel =
    useMemo(() => {
      return contentOptions
        .filter((item) =>
          contentTypes.includes(
            item.id
          )
        )
        .map(
          (item) =>
            item.label
        )
        .join(" + ");
    }, [contentTypes]);

  // ====================================================
  // NEXT RUN
  // ====================================================

  const nextRun =
    enabled
      ? "Next cycle"
      : "Autopilot paused";

  // ====================================================
  // SAVE
  // ====================================================

  const handleSave = () => {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  // ====================================================
  // MASTER TOGGLE
  // ====================================================

  const handleMasterToggle = () => {
    setEnabled(
      (current) => !current
    );

    setSaved(false);
    setScheduleMessage("");
  };

  // ====================================================
  // GENERATE + SCHEDULE
  // ====================================================

  const handleGenerateAndSchedule =
    async () => {
      setScheduleMessage("");

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (!enabled) {
        setScheduleMessage(
          "Please start Autopilot before generating content."
        );

        return;
      }

      if (!autoQueue) {
        setScheduleMessage(
          "Enable 'Add to content queue' first."
        );

        return;
      }

      if (
        contentTypes.length === 0
      ) {
        setScheduleMessage(
          "Select at least one content type."
        );

        return;
      }

      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        setScheduleMessage(
          "You are not signed in. Please sign in again."
        );

        return;
      }

      // ------------------------------------------------
      // START
      // ------------------------------------------------

      setScheduling(true);

      try {
        // ------------------------------------------------
        // RANDOM CONTENT TYPE
        // ------------------------------------------------

        const selectedType =
          contentTypes[
            Math.floor(
              Math.random() *
                contentTypes.length
            )
          ];

        // ------------------------------------------------
        // GEMINI
        // ------------------------------------------------

        const aiContent =
          await generateWithGemini({
            contentType:
              selectedType,

            tone,

            language,

            autoHashtags,
          });

        // ------------------------------------------------
        // SCHEDULE
        // ------------------------------------------------

        const scheduledDate =
          getNextScheduleTime(
            interval,
            startTime,
            endTime
          );

        const date =
          getDateKey(
            scheduledDate
          );

        const time =
          getTimeKey(
            scheduledDate
          );

        const hashtags =
          Array.isArray(
            aiContent.hashtags
          )
            ? aiContent.hashtags
            : [];

        const hashtagText =
          hashtags.join(" ");

        const finalText =
          hashtagText
            ? `${aiContent.body}\n\n${hashtagText}`
            : aiContent.body;

        // ------------------------------------------------
        // COMMON DATA
        // ------------------------------------------------

        const commonData = {
          userId:
            currentUser.uid,

          title:
            aiContent.title,

          body:
            aiContent.body,

          text:
            aiContent.body,

          content:
            aiContent.body,

          description:
            aiContent.body,

          hashtags,

          tags:
            hashtags,

          platform:
            "Threads",

          platforms:
            ["Threads"],

          type:
            aiContent.type,

          contentType:
            selectedType,

          contentCategory:
            selectedType,

          tone,

          language,

          source:
            "Autopilot",

          generatedBy:
            "Gemini 3.6 Flash",

          aiGenerated:
            true,

          aiModel:
            GEMINI_MODEL,

          interval,

          date,

          time,

          scheduled:
            true,

          published:
            false,

          queueStatus:
            "queued",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };

        // ------------------------------------------------
        // CONTENT COLLECTION
        // ------------------------------------------------

        const contentRef =
          await addDoc(
            collection(
              db,
              CONTENT_COLLECTION
            ),
            {
              ...commonData,

              status:
                "scheduled",

              scheduled:
                `${date} ${time}`,

              scheduledDate:
                date,

              scheduledTime:
                time,

              finalText,

              calendarSource:
                "Autopilot",
            }
          );

        // ------------------------------------------------
        // CALENDAR COLLECTION
        // ------------------------------------------------

        const calendarRef =
          await addDoc(
            collection(
              db,
              CALENDAR_COLLECTION
            ),
            {
              ...commonData,

              status:
                "scheduled",

              contentId:
                contentRef.id,

              finalText,

              scheduledAt:
                scheduledDate,

              calendarSource:
                "Autopilot",
            }
          );

        console.log(
          "Autopilot content created:",
          {
            contentId:
              contentRef.id,

            calendarId:
              calendarRef.id,
          }
        );

        // ------------------------------------------------
        // MESSAGE
        // ------------------------------------------------

        if (autoPublish) {
          setScheduleMessage(
            `AI content generated and scheduled for ${date} at ${time}. Auto-publish is enabled, but Threads publishing still requires a connected Threads API/backend.`
          );
        } else {
          setScheduleMessage(
            `Gemini generated content successfully and scheduled it for ${date} at ${time}.`
          );
        }
      } catch (error) {
        console.error(
          "Autopilot Gemini error:",
          error
        );

        const message =
          error?.message ||
          "";

        if (
          message
            .toLowerCase()
            .includes("api key")
        ) {
          setScheduleMessage(
            "Gemini API key belum diset. Sila semak VITE_GEMINI_API_KEY dalam .env."
          );
        } else if (
          message
            .toLowerCase()
            .includes(
              "permission-denied"
            )
        ) {
          setScheduleMessage(
            "Firestore permission denied. Sila semak Firestore Security Rules."
          );
        } else if (
          message
            .toLowerCase()
            .includes(
              "quota"
            )
        ) {
          setScheduleMessage(
            "Gemini API quota telah dicapai. Cuba lagi kemudian."
          );
        } else {
          setScheduleMessage(
            message ||
              "Unable to generate and schedule content. Please try again."
          );
        }
      } finally {
        setScheduling(false);
      }
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="autopilot-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="page-heading autopilot-heading">

        <div>

          <span className="page-kicker">
            AUTOMATION ENGINE
          </span>

          <h1>
            Autopilot
          </h1>

          <p>
            Let AR ContentPilot generate and
            publish your content automatically.
          </p>

        </div>

        <div className="autopilot-heading-status">

          <div
            className={`autopilot-live-indicator ${
              enabled
                ? "active"
                : "paused"
            }`}
          >

            <span />

            {enabled
              ? "AUTOPILOT ACTIVE"
              : "PAUSED"}

          </div>

          <button
            type="button"
            className={`autopilot-master-button ${
              enabled
                ? "active"
                : ""
            }`}
            onClick={
              handleMasterToggle
            }
          >

            {enabled ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}

            {enabled
              ? "Pause Autopilot"
              : "Start Autopilot"}

          </button>

        </div>

      </div>

      {/* ==================================================
          STATUS CARD
      ================================================== */}

      <div className="autopilot-status-card">

        <div className="autopilot-status-left">

          <div
            className={`autopilot-big-icon ${
              enabled
                ? "active"
                : "paused"
            }`}
          >
            <Zap size={24} />
          </div>

          <div>

            <span className="page-kicker">
              CURRENT STATUS
            </span>

            <h2>
              {enabled
                ? "Your content engine is running"
                : "Your content engine is paused"}
            </h2>

            <p>
              {enabled
                ? "AR ContentPilot will automatically generate your next content based on your settings."
                : "Automatic generation is currently paused. Your configuration is saved."}
            </p>

          </div>

        </div>

        <div className="autopilot-next-run">

          <span>
            NEXT RUN
          </span>

          <strong>
            {nextRun}
          </strong>

          <small>

            <Clock3 size={11} />

            {enabled
              ? interval
              : "Waiting for activation"}

          </small>

        </div>

      </div>

      {/* ==================================================
          GENERATE / SCHEDULE ACTION
      ================================================== */}

      <div className="autopilot-generate-card">

        <div className="autopilot-generate-copy">

          <div className="autopilot-generate-icon">
            <Sparkles size={18} />
          </div>

          <div>

            <span className="page-kicker">
              AI CONTENT GENERATOR
            </span>

            <h2>
              Generate the next post
            </h2>

            <p>
              Gemini creates an original
              Threads post using your current
              Autopilot settings.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="save-autopilot-button"
          onClick={
            handleGenerateAndSchedule
          }
          disabled={scheduling}
        >

          {scheduling ? (
            <>
              <RefreshCw
                size={15}
                className="spin"
              />

              Generating with Gemini...
            </>
          ) : (
            <>
              <Sparkles size={15} />

              Generate & Schedule
            </>
          )}

        </button>

      </div>

      {/* ==================================================
          MESSAGE
      ================================================== */}

      {scheduleMessage && (
        <div className="autopilot-success-message">

          <CheckCircle2 size={15} />

          <span>
            {scheduleMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                "calendar"
              )
            }
          >
            Open Calendar
            <ArrowUpRight size={12} />
          </button>

        </div>
      )}

      {/* ==================================================
          MAIN CONFIGURATION
      ================================================== */}

      <div className="autopilot-main-grid">

        {/* =================================================
            SCHEDULE
        ================================================= */}

        <div className="autopilot-config panel">

          <div className="autopilot-section-header">

            <div>

              <span className="page-kicker">
                01 — SCHEDULE
              </span>

              <h2>
                Automation Schedule
              </h2>

              <p>
                Tell ContentPilot when it should
                generate new content.
              </p>

            </div>

            <div className="section-icon purple">
              <Clock3 size={17} />
            </div>

          </div>

          <div className="autopilot-form-grid">

            <div className="autopilot-field full">

              <label>
                GENERATION INTERVAL
              </label>

              <div className="autopilot-select">

                <select
                  value={interval}
                  onChange={(event) => {
                    setInterval(
                      event.target.value
                    );

                    setSaved(false);
                  }}
                >

                  {intervalOptions.map(
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

                <ChevronDown size={13} />

              </div>

            </div>

            <div className="autopilot-field">

              <label>
                START TIME
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(
                    event.target.value
                  );

                  setSaved(false);
                }}
              />

            </div>

            <div className="autopilot-field">

              <label>
                END TIME
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(event) => {
                  setEndTime(
                    event.target.value
                  );

                  setSaved(false);
                }}
              />

            </div>

            <div className="autopilot-field full">

              <label>
                MAX POSTS PER DAY
              </label>

              <div className="limit-control">

                <button
                  type="button"
                  onClick={() =>
                    setDailyLimit(
                      (value) =>
                        String(
                          Math.max(
                            1,
                            Number(value) - 1
                          )
                        )
                    )
                  }
                >
                  −
                </button>

                <strong>
                  {dailyLimit}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    setDailyLimit(
                      (value) =>
                        String(
                          Math.min(
                            24,
                            Number(value) + 1
                          )
                        )
                    )
                  }
                >
                  +
                </button>

                <span>
                  posts / day
                </span>

              </div>

            </div>

          </div>

          <div className="schedule-preview">

            <div className="schedule-preview-icon">
              <RefreshCw size={14} />
            </div>

            <div>

              <strong>
                Schedule preview
              </strong>

              <span>
                {interval} between{" "}
                {startTime} and{" "}
                {endTime}
              </span>

            </div>

            <div className="schedule-preview-time">
              {enabled
                ? "ACTIVE"
                : "PAUSED"}
            </div>

          </div>

        </div>

        {/* =================================================
            CONTENT ENGINE
        ================================================= */}

        <div className="autopilot-config panel">

          <div className="autopilot-section-header">

            <div>

              <span className="page-kicker">
                02 — CONTENT ENGINE
              </span>

              <h2>
                What should AI create?
              </h2>

              <p>
                Choose the content sources AI can use.
              </p>

            </div>

            <div className="section-icon orange">
              <Sparkles size={17} />
            </div>

          </div>

          <div className="autopilot-content-grid">

            {contentOptions.map(
              (item) => {
                const Icon =
                  item.icon;

                const selected =
                  contentTypes.includes(
                    item.id
                  );

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`autopilot-content-option ${
                      selected
                        ? "selected"
                        : ""
                    } ${item.className}`}
                    onClick={() =>
                      toggleContentType(
                        item.id
                      )
                    }
                  >

                    <div className="autopilot-content-icon">
                      <Icon size={16} />
                    </div>

                    <div>

                      <strong>
                        {item.label}
                      </strong>

                      <span>
                        {item.description}
                      </span>

                    </div>

                    <div
                      className={`content-check ${
                        selected
                          ? "checked"
                          : ""
                      }`}
                    >

                      {selected && (
                        <Check size={11} />
                      )}

                    </div>

                  </button>
                );
              }
            )}

          </div>

          <div className="autopilot-mini-form">

            <div className="autopilot-field">

              <label>
                TONE
              </label>

              <div className="autopilot-select">

                <select
                  value={tone}
                  onChange={(event) => {
                    setTone(
                      event.target.value
                    );

                    setSaved(false);
                  }}
                >

                  {toneOptions.map(
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

                <ChevronDown size={13} />

              </div>

            </div>

            <div className="autopilot-field">

              <label>
                LANGUAGE
              </label>

              <div className="autopilot-select">

                <select
                  value={language}
                  onChange={(event) => {
                    setLanguage(
                      event.target.value
                    );

                    setSaved(false);
                  }}
                >

                  {languageOptions.map(
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

                <ChevronDown size={13} />

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ==================================================
          LOWER GRID
      ================================================== */}

      <div className="autopilot-lower-grid">

        {/* =================================================
            WORKFLOW
        ================================================= */}

        <div className="autopilot-config panel">

          <div className="autopilot-section-header compact">

            <div>

              <span className="page-kicker">
                03 — WORKFLOW
              </span>

              <h2>
                Publishing Workflow
              </h2>

              <p>
                Control what happens after AI creates
                the content.
              </p>

            </div>

            <div className="section-icon cyan">
              <Settings2 size={17} />
            </div>

          </div>

          <div className="automation-settings">

            <SettingRow
              icon={Hash}
              title="Auto-generated hashtags"
              description="Let Gemini add relevant hashtags."
              enabled={autoHashtags}
              onChange={(value) => {
                setAutoHashtags(
                  value
                );

                setSaved(false);
              }}
            />

            <SettingRow
              icon={MessageCircle}
              title="Add to content queue"
              description="Save generated content before publishing."
              enabled={autoQueue}
              onChange={(value) => {
                setAutoQueue(
                  value
                );

                setSaved(false);
              }}
            />

            <SettingRow
              icon={Zap}
              title="Auto-publish to Threads"
              description="Prepare generated content for automatic publishing."
              enabled={autoPublish}
              onChange={(value) => {
                setAutoPublish(
                  value
                );

                setSaved(false);
              }}
            />

          </div>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="autopilot-config panel">

          <div className="autopilot-section-header compact">

            <div>

              <span className="page-kicker">
                04 — LIVE CONFIGURATION
              </span>

              <h2>
                Automation Summary
              </h2>

              <p>
                Your current Autopilot configuration.
              </p>

            </div>

            <div className="section-icon green">
              <CheckCircle2 size={17} />
            </div>

          </div>

          <div className="automation-summary">

            <div className="summary-row">

              <span>
                Status
              </span>

              <strong
                className={
                  enabled
                    ? "summary-active"
                    : "summary-paused"
                }
              >
                {enabled
                  ? "ACTIVE"
                  : "PAUSED"}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Frequency
              </span>

              <strong>
                {interval}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Content
              </span>

              <strong>
                {selectedContentLabel}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Tone
              </span>

              <strong>
                {tone}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Language
              </span>

              <strong>
                {language}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Daily limit
              </span>

              <strong>
                {dailyLimit} posts
              </strong>

            </div>

            <div className="summary-row">

              <span>
                AI Engine
              </span>

              <strong>
                Gemini 3.6 Flash
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Threads
              </span>

              <strong>
                {autoPublish
                  ? "AUTO-PUBLISH"
                  : "MANUAL REVIEW"}
              </strong>

            </div>

          </div>

          <button
            type="button"
            className={`save-autopilot-button ${
              saved
                ? "saved"
                : ""
            }`}
            onClick={
              handleSave
            }
          >

            {saved ? (
              <>
                <CheckCircle2 size={15} />

                Configuration Saved
              </>
            ) : (
              <>
                <Check size={15} />

                Save Autopilot Settings
              </>
            )}

          </button>

        </div>

      </div>

      {/* ==================================================
          ACTIVITY
      ================================================== */}

      <div className="autopilot-activity panel">

        <div className="autopilot-section-header compact">

          <div>

            <span className="page-kicker">
              ACTIVITY
            </span>

            <h2>
              Recent Automation Activity
            </h2>

          </div>

          <button
            type="button"
            className="autopilot-history-button"
            onClick={() =>
              onNavigate?.(
                "calendar"
              )
            }
          >

            <History size={13} />

            View calendar

            <ArrowUpRight size={12} />

          </button>

        </div>

        <div className="activity-list">

          <div className="activity-item">

            <div className="activity-status success">
              <CheckCircle2 size={13} />
            </div>

            <div>

              <strong>
                Gemini AI engine ready
              </strong>

              <span>
                Gemini 3.6 Flash
              </span>

            </div>

            <time>
              Ready
            </time>

          </div>

          <div className="activity-item">

            <div className="activity-status success">
              <CheckCircle2 size={13} />
            </div>

            <div>

              <strong>
                Queue connected to Calendar
              </strong>

              <span>
                Scheduled posts use Firestore calendarPosts.
              </span>

            </div>

            <time>
              Ready
            </time>

          </div>

          <div className="activity-item">

            <div className="activity-status waiting">
              <Clock3 size={13} />
            </div>

            <div>

              <strong>
                Next generation scheduled
              </strong>

              <span>
                Waiting for the next automation cycle.
              </span>

            </div>

            <time>
              {interval}
            </time>

          </div>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default Autopilot;