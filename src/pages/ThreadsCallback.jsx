import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

import {
  getThreadsCallbackParams,
  clearThreadsCallbackParams,
} from "../lib/threadsAuth";

import "./ThreadsCallback.css";

// ======================================================
// THREADS CALLBACK
// ======================================================

export default function ThreadsCallback({
  onNavigate,
}) {
  const [status, setStatus] =
    useState("processing");

  const [message, setMessage] =
    useState(
      "Completing your Threads connection..."
    );

  useEffect(() => {
    const callback =
      getThreadsCallbackParams();

    // --------------------------------------------------
    // USER DENIED
    // --------------------------------------------------

    if (
      callback.error
    ) {
      setStatus("error");

      setMessage(
        callback.errorDescription ||
          "Threads authorization was cancelled."
      );

      clearThreadsCallbackParams();

      return;
    }

    // --------------------------------------------------
    // NO CODE
    // --------------------------------------------------

    if (!callback.code) {
      setStatus("error");

      setMessage(
        "No Threads authorization code was returned."
      );

      clearThreadsCallbackParams();

      return;
    }

    // --------------------------------------------------
    // IMPORTANT
    //
    // Untuk production:
    //
    // code → backend
    // backend → Threads token endpoint
    // backend → Firestore
    //
    // Buat masa ini kita simpan sementara
    // authorization code supaya backend exchange
    // boleh digunakan pada langkah seterusnya.
    // --------------------------------------------------

    sessionStorage.setItem(
      "threads_oauth_code",
      callback.code
    );

    clearThreadsCallbackParams();

    setStatus("success");

    setMessage(
      "Threads authorization received successfully."
    );

    const timer =
      window.setTimeout(() => {
        if (onNavigate) {
          onNavigate("threads");
        } else {
          window.location.href =
            "/";
        }
      }, 1200);

    return () =>
      window.clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="threads-callback-page">

      <div className="threads-callback-card">

        {status ===
          "processing" && (
          <div className="threads-callback-icon processing">
            <Loader2
              size={28}
              className="threads-callback-spin"
            />
          </div>
        )}

        {status ===
          "success" && (
          <div className="threads-callback-icon success">
            <CheckCircle2
              size={28}
            />
          </div>
        )}

        {status ===
          "error" && (
          <div className="threads-callback-icon error">
            <XCircle
              size={28}
            />
          </div>
        )}

        <span className="threads-callback-kicker">
          THREADS CONNECTION
        </span>

        <h1>
          {status ===
          "processing"
            ? "Connecting Threads"
            : status ===
              "success"
            ? "Authorization Received"
            : "Connection Failed"}
        </h1>

        <p>
          {message}
        </p>

        {status ===
          "error" && (
          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate(
                  "threads"
                );
              } else {
                window.location.href =
                  "/";
              }
            }}
          >
            Back to Threads
          </button>
        )}

      </div>

    </div>
  );
}