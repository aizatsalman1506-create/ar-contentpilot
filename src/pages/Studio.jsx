// ======================================================
// AR CONTENTPILOT
// STUDIO PAGE
// ======================================================
// REAL AI VERSION
// Gemini 3.6 Flash + Interactions API
//
// Features:
// - Real Gemini AI content generation
// - Trending / Viral / Quotes / Emotional
// - Tone selection
// - Language selection
// - High-quality Threads copy
// - AI-generated hashtags
// - Streaming generation
// - Copy content
// - Regenerate content
// - Add content to Firestore queue
// - Trend Radar -> Studio prefill
// - Responsive layout
// ======================================================

import { useEffect, useState } from "react";

import {
  ArrowUpRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Flame,
  Globe2,
  Hash,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Quote,
  RefreshCw,
  Send,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import "./Studio.css";

// ======================================================
// GEMINI CONFIGURATION
// ======================================================

const GEMINI_MODEL = "gemini-3.6-flash";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

// ======================================================
// CONTENT TYPES
// ======================================================

const contentTypes = [
  {
    id: "trending",
    label: "Trending",
    description: "What's hot now",
    icon: Flame,
    className: "orange",
  },
  {
    id: "viral",
    label: "Viral",
    description: "High engagement",
    icon: Zap,
    className: "purple",
  },
  {
    id: "quote",
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
// TONES
// ======================================================

const tones = [
  "Casual",
  "Professional",
  "Inspirational",
  "Funny",
  "Emotional",
  "Bold",
];

// ======================================================
// LANGUAGES
// ======================================================

const languages = [
  "Bahasa Melayu",
  "English",
  "Bahasa Melayu + English",
];

// ======================================================
// CONTENT TYPE DESCRIPTION
// ======================================================

function getContentTypeDescription(contentType) {
  switch (contentType) {
    case "trending":
      return `
Create content around a topic that feels current, relevant,
timely and highly shareable. The post should feel natural,
not like a news article.
      `.trim();

    case "viral":
      return `
Create highly engaging social content designed to encourage
replies, reposts, saves and discussion. Use a strong hook,
relatable insight and memorable ending.
      `.trim();

    case "quote":
      return `
Create a meaningful life quote or reflective thought.
It should feel original, emotionally intelligent and worth
saving or sharing.
      `.trim();

    case "emotional":
      return `
Create emotionally relatable content about real human
feelings, struggles, uncertainty, hope, relationships,
work, money, life or personal growth.
      `.trim();

    default:
      return `
Create natural, engaging social media content.
      `.trim();
  }
}

// ======================================================
// SYSTEM INSTRUCTION
// ======================================================

const GEMINI_SYSTEM_INSTRUCTION = `
You are the AI content writer inside AR ContentPilot,
a private social media content system for AR Marketing Solutions.

Your job is to create high-quality Threads posts.

IMPORTANT WRITING RULES:

1. Write like a real Malaysian social media creator.
2. Do NOT sound like a corporate AI.
3. Do NOT use generic motivational clichés unless they genuinely
   fit the topic.
4. Avoid phrases such as:
   "In today's fast-paced world",
   "Remember that",
   "It is important to",
   "Success is not...",
   "Never give up..."
   unless they are genuinely necessary.
5. The writing must feel human, conversational and believable.
6. Prefer short paragraphs.
7. Use natural Bahasa Melayu when Bahasa Melayu is selected.
8. Malaysian Malay is preferred over overly formal textbook Malay.
9. When using Bahasa Melayu + English, mix them naturally.
10. Do not translate English sentence-by-sentence into Malay.
11. Do not overuse emojis.
12. Avoid excessive hashtags.
13. Do not use fake statistics.
14. Do not invent news, trends or facts.
15. Do not mention that you are an AI.
16. Do not include explanations before or after the post.
17. Do not put the post inside quotation marks.
18. Do not use markdown headings.
19. Keep the final Threads copy concise and readable.
20. The final post should generally be between 80 and 280 words,
    depending on the topic.
21. Make the opening sentence strong enough to make someone stop
    scrolling.
22. Prefer specific observations over generic advice.
23. End naturally. A question can be used when it genuinely
    encourages conversation, but do not force engagement bait.

HASHTAG RULES:

- Generate 3 to 5 relevant hashtags.
- Use lowercase hashtags.
- Prefer hashtags relevant to the actual topic.
- Always include #threads.
- Do not use random #fyp unless it genuinely makes sense.
- Avoid hashtag spam.

OUTPUT FORMAT:

Return exactly this format:

POST:
<the complete Threads post>

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3 #threads

Do not include anything else.
`;

// ======================================================
// API KEY
// ======================================================

function getGeminiApiKey() {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  ).trim();
}

// ======================================================
// PARSE GEMINI OUTPUT
// ======================================================

function parseGeminiOutput(rawText) {
  if (!rawText) {
    return {
      text: "",
      hashtags: "",
    };
  }

  let text = String(rawText).trim();

  // Remove possible markdown fences.
  text = text
    .replace(/^```[a-zA-Z]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // ----------------------------------------------------
  // POST
  // ----------------------------------------------------

  let postText = text;

  const postMatch = text.match(
    /POST\s*:\s*([\s\S]*?)(?:\n\s*HASHTAGS\s*:|$)/i
  );

  if (postMatch?.[1]) {
    postText = postMatch[1].trim();
  }

  // ----------------------------------------------------
  // HASHTAGS
  // ----------------------------------------------------

  let hashtags = "";

  const hashtagMatch = text.match(
    /HASHTAGS\s*:\s*([\s\S]*)$/i
  );

  if (hashtagMatch?.[1]) {
    hashtags = hashtagMatch[1]
      .replace(/\n/g, " ")
      .trim();
  }

  // ----------------------------------------------------
  // CLEAN
  // ----------------------------------------------------

  postText = postText
    .replace(/^POST\s*:\s*/i, "")
    .trim();

  hashtags = hashtags
    .replace(/^HASHTAGS\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // If Gemini returned hashtags inside post,
  // remove them from the post area.
  if (!hashtags) {
    const lines = postText.split("\n");

    const hashtagLines = [];

    const normalLines = [];

    for (const line of lines) {
      if (
        line.trim().startsWith("#") &&
        line.trim().split(/\s+/).every(
          (word) => word.startsWith("#")
        )
      ) {
        hashtagLines.push(line.trim());
      } else {
        normalLines.push(line);
      }
    }

    if (hashtagLines.length > 0) {
      hashtags = hashtagLines.join(" ");
      postText = normalLines.join("\n").trim();
    }
  }

  // ----------------------------------------------------
  // FALLBACK HASHTAGS
  // ----------------------------------------------------

  if (!hashtags) {
    hashtags = "#threads";
  }

  return {
    text: postText.trim(),
    hashtags: hashtags.trim(),
  };
}

// ======================================================
// STREAM TEXT FROM GEMINI INTERACTIONS API
// ======================================================

async function generateWithGemini({
  apiKey,
  prompt,
  onText,
}) {
  const response = await fetch(
    `${GEMINI_ENDPOINT}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        Accept: "text/event-stream",
      },

      body: JSON.stringify({
        model: GEMINI_MODEL,

        system_instruction:
          GEMINI_SYSTEM_INSTRUCTION,

        input: prompt,

        stream: true,

        generation_config: {
          thinking_level: "low",
        },
      }),
    }
  );

  if (!response.ok) {
    let errorMessage =
      "Gemini API request failed.";

    try {
      const errorData =
        await response.json();

      errorMessage =
        errorData?.error?.message ||
        errorMessage;
    } catch {
      // Ignore JSON parsing error.
    }

    throw new Error(
      errorMessage
    );
  }

  if (!response.body) {
    throw new Error(
      "Gemini returned an empty response stream."
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder("utf-8");

  let buffer = "";
  let fullText = "";

  while (true) {
    const {
      value,
      done,
    } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );

    const events =
      buffer.split("\n\n");

    buffer =
      events.pop() || "";

    for (const eventBlock of events) {
      const lines =
        eventBlock.split("\n");

      for (const line of lines) {
        if (
          !line.startsWith("data:")
        ) {
          continue;
        }

        const rawData =
          line.slice(5).trim();

        if (
          !rawData ||
          rawData === "[DONE]"
        ) {
          continue;
        }

        try {
          const event =
            JSON.parse(rawData);

          if (
            event.event_type ===
              "step.delta" &&
            event.delta?.type ===
              "text"
          ) {
            const delta =
              event.delta.text || "";

            if (delta) {
              fullText += delta;

              if (
                typeof onText ===
                "function"
              ) {
                onText(fullText);
              }
            }
          }

          if (
            event.event_type ===
              "interaction.completed" &&
            event.interaction?.status ===
              "failed"
          ) {
            throw new Error(
              "Gemini interaction failed."
            );
          }
        } catch (streamError) {
          // Ignore individual malformed SSE chunks.
          console.warn(
            "Gemini stream event parse warning:",
            streamError
          );
        }
      }
    }
  }

  // Flush decoder.
  buffer += decoder.decode();

  return fullText.trim();
}

// ======================================================
// STUDIO
// ======================================================

function Studio({
  trendPrefill = null,
  onPrefillConsumed,
  onNavigate,
}) {
  // ====================================================
  // STATE
  // ====================================================

  const [contentType, setContentType] =
    useState("trending");

  const [topic, setTopic] =
    useState("");

  const [tone, setTone] =
    useState("Casual");

  const [language, setLanguage] =
    useState("Bahasa Melayu");

  const [generated, setGenerated] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [generatedText, setGeneratedText] =
    useState("");

  const [generatedTags, setGeneratedTags] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  // ====================================================
  // TREND RADAR PREFILL
  // ====================================================

  useEffect(() => {
    if (!trendPrefill) {
      return;
    }

    setTopic(
      trendPrefill.topic ||
        trendPrefill.title ||
        ""
    );

    const incomingCategory =
      String(
        trendPrefill.category ||
          ""
      ).toLowerCase();

    if (
      incomingCategory.includes(
        "viral"
      )
    ) {
      setContentType("viral");
    } else if (
      incomingCategory.includes(
        "quote"
      )
    ) {
      setContentType("quote");
    } else if (
      incomingCategory.includes(
        "emotional"
      )
    ) {
      setContentType("emotional");
    } else {
      setContentType("trending");
    }

    setGenerated(false);
    setGeneratedText("");
    setGeneratedTags("");
    setSaved(false);
    setCopied(false);
    setError("");

    if (
      typeof onPrefillConsumed ===
      "function"
    ) {
      onPrefillConsumed();
    }
  }, [
    trendPrefill,
    onPrefillConsumed,
  ]);

  // ====================================================
  // SELECTED TYPE
  // ====================================================

  const selectedContent =
    contentTypes.find(
      (item) =>
        item.id === contentType
    );

  // ====================================================
  // GENERATE PROMPT
  // ====================================================

  function buildPrompt() {
    const topicText =
      topic.trim() ||
      "Create a fresh, relatable topic suitable for Malaysian Threads users.";

    const typeInstruction =
      getContentTypeDescription(
        contentType
      );

    return `
Create ONE Threads post.

CONTENT TYPE:
${selectedContent?.label || "Trending"}

CONTENT TYPE DIRECTION:
${typeInstruction}

TOPIC / IDEA:
${topicText}

TONE:
${tone}

LANGUAGE:
${language}

TARGET AUDIENCE:
Malaysian social media users.

PLATFORM:
Threads

BRAND:
AR Marketing Solutions

BRAND STYLE:
Human, relatable, intelligent, concise, conversational,
not overly corporate, not cringe, not obviously AI-generated.

IMPORTANT:
- Make the first line a strong hook.
- Use natural paragraph breaks.
- Give the reader one clear thought or insight.
- Avoid generic filler.
- Avoid fake statistics.
- Avoid excessive emojis.
- Avoid excessive hashtags.
- Do not explain your writing process.
- Return only the required POST and HASHTAGS format.

Generate now.
    `.trim();
  }

  // ====================================================
  // GENERATE
  // ====================================================

  async function handleGenerate() {
    if (generating) {
      return;
    }

    setError("");
    setSaved(false);
    setCopied(false);

    const apiKey =
      getGeminiApiKey();

    if (!apiKey) {
      setError(
        "Gemini API key tidak dijumpai. Pastikan VITE_GEMINI_API_KEY ada dalam fail .env."
      );
      return;
    }

    setGenerating(true);
    setGenerated(true);

    setGeneratedText("");
    setGeneratedTags("");

    try {
      const prompt =
        buildPrompt();

      let streamedText = "";

      const rawResult =
        await generateWithGemini({
          apiKey,
          prompt,

          onText: (text) => {
            streamedText = text;

            const parsed =
              parseGeminiOutput(text);

            // Show content immediately
            // when POST section appears.
            if (parsed.text) {
              setGeneratedText(
                parsed.text
              );
            }

            if (parsed.hashtags) {
              setGeneratedTags(
                parsed.hashtags
              );
            }
          },
        });

      const parsed =
        parseGeminiOutput(
          rawResult || streamedText
        );

      if (!parsed.text) {
        throw new Error(
          "Gemini tidak menghasilkan kandungan."
        );
      }

      setGeneratedText(
        parsed.text
      );

      setGeneratedTags(
        parsed.hashtags ||
          "#threads"
      );

      setGenerated(true);
    } catch (generationError) {
      console.error(
        "Gemini generation failed:",
        generationError
      );

      setGenerated(false);
      setGeneratedText("");
      setGeneratedTags("");

      const message =
        generationError?.message ||
        "";

      if (
        message
          .toLowerCase()
          .includes("api key")
      ) {
        setError(
          "Gemini API key tidak sah atau tidak boleh digunakan."
        );
      } else if (
        message
          .toLowerCase()
          .includes("quota")
      ) {
        setError(
          "Gemini API quota telah habis. Cuba lagi kemudian atau semak quota API."
        );
      } else if (
        message
          .toLowerCase()
          .includes("429")
      ) {
        setError(
          "Gemini sedang menerima terlalu banyak permintaan. Cuba lagi sebentar."
        );
      } else if (
        message
          .toLowerCase()
          .includes("403")
      ) {
        setError(
          "Gemini API tidak membenarkan permintaan ini. Semak API key dan restriction di Google AI Studio."
        );
      } else {
        setError(
          message ||
            "AI generation gagal. Sila cuba lagi."
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  // ====================================================
  // COPY
  // ====================================================

  async function handleCopy() {
    if (
      !generated ||
      !generatedText
    ) {
      setError(
        "Please generate content first."
      );
      return;
    }

    try {
      const fullText =
        generatedTags
          ? `${generatedText}\n\n${generatedTags}`
          : generatedText;

      await navigator.clipboard.writeText(
        fullText
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (copyError) {
      console.error(
        "Copy failed:",
        copyError
      );

      setError(
        "Unable to copy content."
      );
    }
  }

  // ====================================================
  // ADD TO QUEUE
  // ====================================================

  async function handleAddToQueue() {
    setError("");
    setSaved(false);

    if (
      !generated ||
      !generatedText
    ) {
      setError(
        "Please generate content first."
      );
      return;
    }

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      setError(
        "You are not signed in. Please sign in again."
      );
      return;
    }

    setSaving(true);

    try {
      const contentData = {
        userId:
          currentUser.uid,

        text:
          generatedText,

        content:
          generatedText,

        body:
          generatedText,

        title:
          topic.trim()
            ? topic
                .trim()
                .slice(0, 80)
            : `${
                selectedContent?.label ||
                "AI"
              } Content`,

        topic:
          topic.trim(),

        type:
          selectedContent?.label ||
          "Trending",

        contentType:
          contentType,

        tone:
          tone,

        language:
          language,

        platform:
          "Threads",

        platforms:
          ["Threads"],

        status:
          "draft",

        queueStatus:
          "queued",

        scheduled:
          false,

        published:
          false,

        source:
          "AI Studio",

        generatedBy:
          "Gemini 3.6 Flash",

        aiGenerated:
          true,

        aiModel:
          GEMINI_MODEL,

        hashtags:
          generatedTags,

        tags:
          generatedTags,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const docRef =
        await addDoc(
          collection(
            db,
            "content"
          ),
          contentData
        );

      console.log(
        "Content added to queue:",
        docRef.id
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3500);
    } catch (firestoreError) {
      console.error(
        "Unable to add content to queue:",
        firestoreError
      );

      if (
        firestoreError?.code ===
        "permission-denied"
      ) {
        setError(
          "Unable to save content. Please check Firestore Security Rules."
        );
      } else {
        setError(
          firestoreError?.message ||
            "Unable to save content. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // ====================================================
  // RESET
  // ====================================================

  function resetGenerated() {
    setGenerated(false);
    setGeneratedText("");
    setGeneratedTags("");
    setSaved(false);
    setCopied(false);
    setError("");
  }

  // ====================================================
  // FIELD CHANGE
  // ====================================================

  function handleContentTypeChange(
    id
  ) {
    setContentType(id);
    resetGenerated();
  }

  function handleTopicChange(
    event
  ) {
    setTopic(
      event.target.value
    );
    resetGenerated();
  }

  function handleToneChange(
    event
  ) {
    setTone(
      event.target.value
    );
    resetGenerated();
  }

  function handleLanguageChange(
    event
  ) {
    setLanguage(
      event.target.value
    );
    resetGenerated();
  }

  // ====================================================
  // NAVIGATION
  // ====================================================

  function navigate(page) {
    if (
      typeof onNavigate ===
      "function"
    ) {
      onNavigate(page);
    }
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="studio-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="studio-page-header">

        <div className="studio-page-header-copy">

          <span className="studio-kicker">
            AI CONTENT ENGINE
          </span>

          <h1>
            Content Studio
          </h1>

          <p>
            Create high-quality Threads
            content with Gemini AI.
          </p>

        </div>

        <div
          className={`studio-ready-badge ${
            generating
              ? "generating"
              : ""
          }`}
        >
          <span />

          {generating
            ? "GEMINI GENERATING"
            : "GEMINI 3.6 FLASH READY"}
        </div>

      </div>

      {/* ==================================================
          ALERTS
      ================================================== */}

      {error && (
        <div className="studio-alert studio-alert-error">
          <span>
            {error}
          </span>
        </div>
      )}

      {saved && (
        <div className="studio-alert studio-alert-success">
          <Check size={16} />

          <span>
            Content successfully added to
            your content queue.
          </span>
        </div>
      )}

      {/* ==================================================
          MAIN STUDIO
      ================================================== */}

      <div className="studio-layout">

        {/* =================================================
            BUILDER
        ================================================= */}

        <section className="studio-panel studio-builder">

          <div className="studio-panel-header">

            <div>
              <span className="studio-kicker">
                01 — CONTENT TYPE
              </span>

              <h2>
                What do you want to create?
              </h2>
            </div>

            <div className="studio-panel-header-icon">
              <WandSparkles size={18} />
            </div>

          </div>

          {/* =================================================
              CONTENT TYPES
          ================================================= */}

          <div className="studio-type-grid">

            {contentTypes.map(
              (type) => {
                const Icon =
                  type.icon;

                const selected =
                  contentType ===
                  type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`studio-type-card ${
                      selected
                        ? "selected"
                        : ""
                    } ${type.className}`}
                    onClick={() =>
                      handleContentTypeChange(
                        type.id
                      )
                    }
                    disabled={generating}
                  >

                    <div className="studio-type-icon">
                      <Icon size={18} />
                    </div>

                    <div className="studio-type-copy">

                      <strong>
                        {type.label}
                      </strong>

                      <span>
                        {type.description}
                      </span>

                    </div>

                    {selected && (
                      <CheckCircle2
                        size={16}
                        className="studio-type-check"
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>

          {/* =================================================
              FORM
          ================================================= */}

          <div className="studio-form">

            {/* TOPIC */}

            <div className="studio-field">

              <div className="studio-field-label">

                <label>
                  TOPIC / IDEA
                </label>

                <span>
                  OPTIONAL
                </span>

              </div>

              <textarea
                value={topic}
                onChange={
                  handleTopicChange
                }
                placeholder="Contoh: pengalaman berniaga, kehidupan, AI, mindset..."
                rows={5}
                disabled={generating}
              />

              <div className="studio-field-helper">
                Give Gemini a topic or leave
                it empty for a fresh idea.
              </div>

            </div>

            {/* TONE + LANGUAGE */}

            <div className="studio-fields-row">

              <div className="studio-field">

                <label>
                  TONE
                </label>

                <div className="studio-select">

                  <select
                    value={tone}
                    onChange={
                      handleToneChange
                    }
                    disabled={
                      generating
                    }
                  >
                    {tones.map(
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
                    size={15}
                  />

                </div>

              </div>

              <div className="studio-field">

                <label>
                  LANGUAGE
                </label>

                <div className="studio-select">

                  <select
                    value={language}
                    onChange={
                      handleLanguageChange
                    }
                    disabled={
                      generating
                    }
                  >
                    {languages.map(
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
                    size={15}
                  />

                </div>

              </div>

            </div>

            {/* OPTIONS */}

            <div className="studio-options">

              <div className="studio-option">

                <Hash size={14} />

                <span>
                  Gemini-generated hashtags
                </span>

              </div>

              <div className="studio-option">

                <Globe2 size={14} />

                <span>
                  Optimized for Threads
                </span>

              </div>

            </div>

            {/* GENERATE */}

            <button
              type="button"
              className="studio-generate-button"
              onClick={
                handleGenerate
              }
              disabled={
                generating
              }
            >

              {generating ? (
                <>
                  <RefreshCw
                    size={17}
                    className="studio-spin"
                  />

                  <span>
                    Gemini is writing...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />

                  <span>
                    Generate with Gemini
                  </span>

                  <ArrowUpRight
                    size={15}
                  />
                </>
              )}

            </button>

          </div>

        </section>

        {/* =================================================
            PREVIEW
        ================================================= */}

        <section className="studio-panel studio-preview">

          <div className="studio-preview-header">

            <div>

              <span className="studio-kicker">
                02 — LIVE PREVIEW
              </span>

              <h2>
                Threads Preview
              </h2>

            </div>

            <div className="studio-threads-badge">

              <MessageCircle
                size={13}
              />

              Threads

            </div>

          </div>

          {/* =================================================
              EMPTY / GENERATING
          ================================================= */}

          {!generated ? (
            <div className="studio-empty-preview">

              <div className="studio-empty-icon">
                {generating ? (
                  <RefreshCw
                    size={24}
                    className="studio-spin"
                  />
                ) : (
                  <Sparkles size={24} />
                )}
              </div>

              <strong>
                {generating
                  ? "Gemini is creating your post..."
                  : "Your content will appear here"}
              </strong>

              <span>
                {generating
                  ? "Generating a human-like Threads post."
                  : "Choose a content type and click Generate Content."}
              </span>

            </div>
          ) : (
            <div className="studio-generated-preview">

              {/* USER */}

              <div className="studio-preview-user">

                <div className="studio-preview-avatar">
                  AR
                </div>

                <div className="studio-preview-user-info">

                  <strong>
                    AR Marketing Solutions
                  </strong>

                  <span>
                    Just now · ✦ Gemini AI
                  </span>

                </div>

                <MoreHorizontal
                  size={17}
                  className="studio-preview-more"
                />

              </div>

              {/* CONTENT */}

              <div className="studio-generated-content">

                {topic?.trim() && (
                  <div className="studio-topic-context">
                    Based on:{" "}
                    {topic.trim()}
                  </div>
                )}

                <p>
                  {generatedText ||
                    "Gemini is preparing your content..."}
                </p>

                {generatedTags && (
                  <div className="studio-generated-tags">
                    {generatedTags}
                  </div>
                )}

              </div>

              {/* ACTIONS */}

              <div className="studio-preview-actions">

                <button
                  type="button"
                  className="studio-action-button"
                  onClick={
                    handleCopy
                  }
                  disabled={
                    generating ||
                    !generatedText
                  }
                >

                  {copied ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}

                  {copied
                    ? "Copied"
                    : "Copy"}

                </button>

                <button
                  type="button"
                  className="studio-action-button"
                  onClick={
                    handleGenerate
                  }
                  disabled={
                    generating ||
                    saving
                  }
                >

                  <RefreshCw
                    size={14}
                    className={
                      generating
                        ? "studio-spin"
                        : ""
                    }
                  />

                  Regenerate

                </button>

                <button
                  type="button"
                  className="studio-action-button primary"
                  onClick={
                    handleAddToQueue
                  }
                  disabled={
                    generating ||
                    saving ||
                    !generatedText
                  }
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={14}
                        className="studio-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Send size={14} />

                      Add to Queue
                    </>
                  )}

                </button>

              </div>

            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="studio-preview-footer">

            <span>
              {generating
                ? "Gemini is generating..."
                : generated
                ? "Gemini AI content generated"
                : "Waiting for generation"}
            </span>

            <span>
              {generatedText.length}
              {" / 500"}
            </span>

          </div>

        </section>

      </div>

      {/* ==================================================
          INFORMATION CARDS
      ================================================== */}

      <div className="studio-info-grid">

        {/* BRAND BRAIN */}

        <button
          type="button"
          className="studio-info-card"
          onClick={() =>
            navigate("brand-profile")
          }
        >

          <div className="studio-info-icon purple">
            <Brain size={19} />
          </div>

          <div className="studio-info-copy">

            <strong>
              Brand Brain
            </strong>

            <span>
              Manage your brand voice,
              writing style and AI identity.
            </span>

          </div>

          <ArrowUpRight size={15} />

        </button>

        {/* TREND RADAR */}

        <button
          type="button"
          className="studio-info-card"
          onClick={() =>
            navigate("trend-radar")
          }
        >

          <div className="studio-info-icon orange">
            <Flame size={19} />
          </div>

          <div className="studio-info-copy">

            <strong>
              Trend Radar
            </strong>

            <span>
              Discover current topics and
              content opportunities.
            </span>

          </div>

          <ArrowUpRight size={15} />

        </button>

        {/* AUTOPILOT */}

        <button
          type="button"
          className="studio-info-card"
          onClick={() =>
            navigate("autopilot")
          }
        >

          <div className="studio-info-icon cyan">
            <Zap size={19} />
          </div>

          <div className="studio-info-copy">

            <strong>
              Autopilot
            </strong>

            <span>
              Automate content generation,
              scheduling and publishing.
            </span>

          </div>

          <ArrowUpRight size={15} />

        </button>

      </div>

    </div>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default Studio;