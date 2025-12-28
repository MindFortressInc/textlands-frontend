"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  missing_token: {
    title: "Missing Token",
    description: "No login token was provided. Please request a new login link.",
  },
  invalid_token: {
    title: "Invalid Link",
    description: "This login link is invalid. Please request a new one.",
  },
  expired: {
    title: "Link Expired",
    description: "This login link has expired. Login links are valid for 15 minutes.",
  },
  used: {
    title: "Link Already Used",
    description: "This login link has already been used. Each link can only be used once.",
  },
  default: {
    title: "Login Failed",
    description: "Something went wrong. Please try requesting a new login link.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "default";
  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES.default;

  return (
    <>
      {/* Error icon */}
      <div className="w-20 h-20 mx-auto rounded-full bg-[var(--crimson)]/20 flex items-center justify-center">
        <span className="text-4xl text-[var(--crimson)]">!</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-[var(--crimson)] text-2xl font-bold tracking-wider">
          {errorInfo.title.toUpperCase()}
        </h1>
        <p className="text-[var(--text-dim)]">{errorInfo.description}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Link
          href="/"
          className="block w-full px-6 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-bold text-center hover:bg-[var(--amber)]/80 transition-colors"
        >
          Return to TextLands
        </Link>
        <p className="text-[var(--mist)] text-sm text-center">
          You can request a new login link from the game
        </p>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <div className="w-20 h-20 mx-auto rounded-full bg-[var(--crimson)]/20 flex items-center justify-center">
        <span className="text-4xl text-[var(--crimson)]">!</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-[var(--crimson)] text-2xl font-bold tracking-wider">ERROR</h1>
        <p className="text-[var(--text-dim)]">Loading...</p>
      </div>
    </>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="mb-4">
          <span className="text-[var(--amber)] text-xl font-bold tracking-wider">TEXTLANDS</span>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <ErrorContent />
        </Suspense>
      </div>
    </main>
  );
}
