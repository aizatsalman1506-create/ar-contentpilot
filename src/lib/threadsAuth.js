// ======================================================
// AR CONTENTPILOT
// THREADS AUTHENTICATION
// ======================================================
//
// Frontend helper untuk Threads OAuth.
//
// IMPORTANT:
// Client Secret JANGAN diletakkan dalam frontend.
// OAuth code exchange perlu dilakukan melalui backend/
// server-side endpoint.
//
// ======================================================

const THREADS_AUTH_URL =
  "https://threads.net/oauth/authorize";

const THREADS_SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_manage_insights",
].join(",");

// ======================================================
// ENVIRONMENT
// ======================================================

function getClientId() {
  return (
    import.meta.env.VITE_THREADS_CLIENT_ID ||
    ""
  );
}

function getRedirectUri() {
  return (
    import.meta.env.VITE_THREADS_REDIRECT_URI ||
    `${window.location.origin}/threads/callback`
  );
}

// ======================================================
// CONFIG CHECK
// ======================================================

export function isThreadsConfigured() {
  return Boolean(
    getClientId() &&
      getRedirectUri()
  );
}

// ======================================================
// OAUTH URL
// ======================================================

export function buildThreadsAuthUrl() {
  const clientId =
    getClientId();

  const redirectUri =
    getRedirectUri();

  if (!clientId) {
    throw new Error(
      "Threads Client ID is not configured."
    );
  }

  const params =
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: THREADS_SCOPES,
      response_type: "code",
    });

  return `${THREADS_AUTH_URL}?${params.toString()}`;
}

// ======================================================
// START LOGIN
// ======================================================

export function connectThreads() {
  const authUrl =
    buildThreadsAuthUrl();

  window.location.href =
    authUrl;
}

// ======================================================
// OAUTH CALLBACK
// ======================================================

export function getThreadsCallbackParams() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return {
    code:
      params.get("code"),

    error:
      params.get("error"),

    errorReason:
      params.get("error_reason"),

    errorDescription:
      params.get(
        "error_description"
      ),
  };
}

// ======================================================
// CLEAN CALLBACK URL
// ======================================================

export function clearThreadsCallbackParams() {
  const cleanUrl =
    window.location.origin +
    window.location.pathname;

  window.history.replaceState(
    {},
    document.title,
    cleanUrl
  );
}

// ======================================================
// EXPORT CONFIG
// ======================================================

export const threadsAuthConfig = {
  getClientId,
  getRedirectUri,
  scopes: THREADS_SCOPES,
};