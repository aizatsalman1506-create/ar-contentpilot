// ======================================================
// AR CONTENTPILOT
// LOGIN PAGE
// ======================================================

import { useState } from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../../firebase";

import "./Login.css";

// ======================================================
// LOGIN
// ======================================================

function Login({ onLogin }) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ====================================================
  // SUBMIT
  // ====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Sila masukkan email anda."
      );
      return;
    }

    if (!password) {
      setError(
        "Sila masukkan password anda."
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      if (onLogin) {
        onLogin(userCredential.user);
      }
    } catch (err) {
      console.error(
        "Login failed:",
        err
      );

      switch (err.code) {
        case "auth/invalid-credential":
          setError(
            "Email atau password tidak betul."
          );
          break;

        case "auth/user-not-found":
          setError(
            "Akaun tidak dijumpai."
          );
          break;

        case "auth/wrong-password":
          setError(
            "Password tidak betul."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Format email tidak sah."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Terlalu banyak percubaan. Cuba lagi sebentar."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Masalah sambungan internet. Sila cuba lagi."
          );
          break;

        case "auth/user-disabled":
          setError(
            "Akaun ini telah dinyahaktifkan."
          );
          break;

        default:
          setError(
            "Login gagal. Sila cuba lagi."
          );
          break;
      }
    } finally {
      setLoading(false);
    }
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="login-page">

      {/* ==================================================
          BACKGROUND
      ================================================== */}

      <div className="login-background">

        <div className="login-grid"></div>

        <div className="login-glow login-glow-one"></div>

        <div className="login-glow login-glow-two"></div>

      </div>

      {/* ==================================================
          MAIN CONTAINER
      ================================================== */}

      <section className="login-container">

        {/* ==================================================
            BRAND
        ================================================== */}

        <div className="login-brand">

          <div className="login-brand-mark">
            <span>AR</span>
          </div>

          <div className="login-brand-text">

            <strong>
              AR ContentPilot
            </strong>

            <span>
              AR MARKETING SOLUTIONS
            </span>

          </div>

        </div>

        {/* ==================================================
            LOGIN CARD
        ================================================== */}

        <div className="login-card">

          {/* CARD HEADER */}

          <div className="login-card-header">

            <div className="login-icon">
              <ShieldCheck
                size={24}
                strokeWidth={2}
              />
            </div>

            <div className="login-eyebrow">
              PRIVATE CONTENT SYSTEM
            </div>

            <h1>
              Welcome back
            </h1>

            <p>
              Sign in to manage your content,
              automation and publishing workflow.
            </p>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="login-form-group">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="login-input-wrapper">

                <Mail
                  size={18}
                  strokeWidth={2}
                />

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="login-form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="login-input-wrapper">

                <LockKeyhole
                  size={18}
                  strokeWidth={2}
                />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error">

                <span className="login-error-dot"></span>

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading ? (
                <span className="login-button-loading">

                  <span className="login-spinner"></span>

                  Signing in...

                </span>
              ) : (
                <>
                  <span>
                    Sign in
                  </span>

                  <ArrowRight
                    size={18}
                    strokeWidth={2.2}
                  />
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              SECURITY
          ================================================== */}

          <div className="login-security">

            <div className="login-security-icon">
              <LockKeyhole
                size={13}
                strokeWidth={2}
              />
            </div>

            <span>
              Secured with Firebase Authentication
            </span>

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="login-footer">

          <span>
            AR MARKETING SOLUTIONS
          </span>

          <i>•</i>

          <span>
            AR ContentPilot
          </span>

        </div>

      </section>

    </main>
  );
}

export default Login;