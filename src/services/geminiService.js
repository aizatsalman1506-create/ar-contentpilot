// ======================================================
// AR CONTENTPILOT
// GEMINI AI SERVICE
// Gemini 3.6 Flash + Interactions API
// ======================================================

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY;

const GEMINI_MODEL =
  "gemini-3.6-flash";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

// ======================================================
// GENERATE CONTENT
// ======================================================

export async function generateGeminiContent({
  contentType = "trending",
  topic = "",
  tone = "Casual",
  language = "Bahasa Melayu",
}) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key tidak dijumpai. Sila semak VITE_GEMINI_API_KEY dalam .env."
    );
  }

  const cleanTopic =
    topic?.trim() ||
    "idea umum yang relevan dengan kehidupan dan masyarakat Malaysia";

  // ====================================================
  // CONTENT STYLE
  // ====================================================

  const typeInstructions = {
    trending: `
Create a timely-style social media post around the topic.
Make it feel current, relatable and discussion-worthy.
Do not invent fake news, statistics or specific current events.
`,

    viral: `
Create a highly engaging social media post.
Use a strong opening hook.
Make people want to stop scrolling, relate, react and comment.
Avoid cheap clickbait.
`,

    quote: `
Create an emotionally strong life/wisdom post.
It should feel original, meaningful and memorable.
Avoid generic motivational clichés.
`,

    emotional: `
Create a deeply relatable emotional post.
Focus on human feelings, struggle, hope, uncertainty or life experiences.
Make it natural and sincere rather than overly dramatic.
`,
  };

  const typeInstruction =
    typeInstructions[contentType] ||
    typeInstructions.trending;

  // ====================================================
  // LANGUAGE
  // ====================================================

  let languageInstruction = "";

  if (language === "English") {
    languageInstruction = `
Write entirely in natural English.
Use conversational social-media English.
`;
  } else if (
    language === "Bahasa Melayu + English"
  ) {
    languageInstruction = `
Write naturally in Malaysian Malay mixed with English.
Use natural Malaysian code-switching.
Do not translate every sentence literally.
`;
  } else {
    languageInstruction = `
Write primarily in natural Malaysian Bahasa Melayu.
Use modern conversational Malaysian Malay.
Avoid overly formal textbook Bahasa Melayu.
`;
  }

  // ====================================================
  // PROMPT
  // ====================================================

  const prompt = `
You are the AI content writer for AR ContentPilot,
a private social media content management system for AR Marketing Solutions.

Your job is to create high-quality content specifically for Threads.

CONTENT TYPE:
${contentType}

TOPIC:
${cleanTopic}

TONE:
${tone}

${typeInstruction}

${languageInstruction}

IMPORTANT WRITING RULES:

1. Write like a real human, not like an AI.
2. Do not start with generic phrases such as:
   "Dalam dunia yang semakin..."
   "Kadang-kadang dalam kehidupan..."
   "Di zaman moden ini..."
3. Avoid corporate-sounding language unless the topic requires it.
4. Avoid unnecessary emojis.
5. Do not overuse hashtags.
6. Make the opening sentence strong.
7. Keep the post concise enough for Threads.
8. Make the content relatable to Malaysians.
9. Prefer specific observations over generic motivation.
10. Do not invent facts, statistics, news or personal experiences.
11. Do not mention that you are an AI.
12. Do not use markdown headings.
13. Do not put the post inside quotation marks.
14. Do not explain your writing process.

STRUCTURE:

Start with a strong hook.

Then develop the idea naturally.

End with either:
- a memorable thought,
- a relatable statement,
- or a natural question that encourages discussion.

HASHTAGS:

Return 3 to 5 relevant hashtags at the end.

OUTPUT FORMAT:

POST:
[complete Threads post]

HASHTAGS:
#hashtag1 #hashtag2 #hashtag3
`;

  // ====================================================
  // API REQUEST
  // ====================================================

  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: GEMINI_MODEL,

        input: prompt,
      }),
    }
  );

  // ====================================================
  // ERROR
  // ====================================================

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
      // Ignore JSON parsing failure.
    }

    throw new Error(
      errorMessage
    );
  }

  // ====================================================
  // RESPONSE
  // ====================================================

  const data =
    await response.json();

  // Interactions API exposes output
  // as model output content.

  let outputText =
    data?.output_text || "";

  if (!outputText) {
    const steps =
      Array.isArray(data?.steps)
        ? data.steps
        : [];

    const textParts = [];

    for (const step of steps) {
      if (
        step?.type !==
        "model_output"
      ) {
        continue;
      }

      const content =
        Array.isArray(step?.content)
          ? step.content
          : [];

      for (const item of content) {
        if (
          item?.type === "text" &&
          item?.text
        ) {
          textParts.push(
            item.text
          );
        }
      }
    }

    outputText =
      textParts.join("\n").trim();
  }

  if (!outputText) {
    throw new Error(
      "Gemini tidak mengembalikan content."
    );
  }

  // ====================================================
  // PARSE POST
  // ====================================================

  let post = outputText;
  let hashtags = "";

  const postMatch =
    outputText.match(
      /POST:\s*([\s\S]*?)(?:\n\s*HASHTAGS:|$)/i
    );

  const hashtagsMatch =
    outputText.match(
      /HASHTAGS:\s*([\s\S]*)$/i
    );

  if (postMatch?.[1]) {
    post =
      postMatch[1].trim();
  }

  if (hashtagsMatch?.[1]) {
    hashtags =
      hashtagsMatch[1]
        .trim()
        .replace(/\n+/g, " ");
  }

  // Remove accidental markdown
  post = post
    .replace(/^["']|["']$/g, "")
    .trim();

  hashtags = hashtags
    .replace(/^["']|["']$/g, "")
    .trim();

  return {
    text: post,

    hashtags,

    raw: outputText,

    model: GEMINI_MODEL,
  };
}