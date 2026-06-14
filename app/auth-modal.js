"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./providers";

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export default function AuthModal({ open, onClose, mode = "login" }) {
  const { signInWithGoogle, signInWithEmail, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset transient state whenever the modal is reopened.
  useEffect(() => {
    if (open) {
      setError("");
      setSent(false);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle(); // redirects away on success
    } catch (err) {
      setError(err?.message || "Google sign-in failed.");
      setBusy(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setBusy(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || "Could not send the magic link.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Create your account" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Sign up to save your games and pick up where you left off."
      : "Sign in to save your games and pick up where you left off.";

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="modal-logo">
          <span className="brand-logo">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 11h4m-2-2v4" />
              <circle cx="15.5" cy="11" r="1" fill="#fff" stroke="none" />
              <circle cx="18" cy="13.5" r="1" fill="#fff" stroke="none" />
              <path d="M7 6h10a4 4 0 0 1 4 4l.8 5.2a2.5 2.5 0 0 1-4.7 1.4L16 15H8l-1.1 1.6a2.5 2.5 0 0 1-4.7-1.4L3 10a4 4 0 0 1 4-4Z" />
            </svg>
          </span>
        </div>

        <h2 className="modal-title">{title}</h2>
        <p className="modal-sub">{subtitle}</p>

        {!configured ? (
          <div className="modal-notice">
            Authentication isn’t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and enable the
            Google provider in your Supabase dashboard.
          </div>
        ) : sent ? (
          <div className="modal-success">
            <strong>Check your inbox</strong>
            <p>We sent a magic sign-in link to {email}. Click it to finish signing in.</p>
          </div>
        ) : (
          <>
            <button type="button" className="oauth-btn" onClick={handleGoogle} disabled={busy}>
              <GoogleGlyph />
              Continue with Google
            </button>

            <div className="modal-divider"><span>or</span></div>

            <form onSubmit={handleEmail} className="modal-form">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
              <button type="submit" className="btn btn-primary modal-submit" disabled={busy || !email.trim()}>
                {busy ? "Sending…" : "Email me a magic link"}
              </button>
            </form>

            {error && <div className="modal-error">{error}</div>}

            <p className="modal-fine">
              By continuing you agree to the Terms and acknowledge the Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
