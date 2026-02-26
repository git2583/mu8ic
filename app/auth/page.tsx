"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/* ── Google "G" logo as inline SVG ── */
function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/workspace`,
      },
    });
    // The user will be redirected to google, so no need to stop loading state
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171717]">
      {/* ── Ambient floating orbs ── */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)",
          animation: "float-1 8s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[360px] w-[360px] rounded-full opacity-25 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)",
          animation: "float-2 10s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)",
          animation: "float-3 12s ease-in-out infinite",
        }}
      />

      {/* ── Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-4 w-full max-w-[420px]"
      >
        {/* Shimmer border wrapper */}
        <div
          className="rounded-3xl p-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 6s linear infinite",
          }}
        >
          {/* Inner glass body */}
          <div
            className="flex flex-col items-center gap-8 rounded-3xl px-8 py-14 sm:px-12 sm:py-16"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Logo / Brand */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Liquid glass mini-logo */}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/80"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="text-sm font-medium tracking-widest text-white/40 uppercase">
                mu8ic
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Welcome
              </h1>
              <p className="max-w-[260px] text-sm leading-relaxed text-white/50">
                Sign in to continue creating AI‑powered music for your content.
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="h-[1px] w-full origin-center"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />

            {/* Google Sign-In Button */}
            <motion.button
              id="google-sign-in-button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoggingIn}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium text-white/90 transition-all duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                animation: "pulse-glow 4s ease-in-out infinite",
              }}
              onClick={handleGoogleLogin}
            >
              <span className="transition-transform duration-300 group-hover:scale-110">
                {isLoggingIn ? (
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <GoogleIcon />
                )}
              </span>
              <span>
                {isLoggingIn ? "Connecting..." : "Continue with Google"}
              </span>
            </motion.button>

            {/* Terms */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center text-xs leading-relaxed text-white/30"
            >
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/60 hover:decoration-white/40"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/60 hover:decoration-white/40"
              >
                Privacy Policy
              </a>
              .
            </motion.p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
