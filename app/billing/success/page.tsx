"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Details */}
      <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)]">
        <p className="text-[var(--text)] text-sm">
          Your account has been updated. Any purchased tokens or subscription benefits are now active.
        </p>
        {sessionId && (
          <p className="text-[var(--mist)] text-xs mt-2">
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>

      {/* Redirect notice */}
      <p className="text-[var(--mist)] text-sm">
        Returning to TextLands in {countdown}...
      </p>

      {/* Manual link */}
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-bold hover:bg-[var(--amber-dim)] transition-colors"
      >
        Return to Game
      </Link>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)]">
        <p className="text-[var(--text)] text-sm">
          Your account has been updated. Any purchased tokens or subscription benefits are now active.
        </p>
      </div>
      <p className="text-[var(--mist)] text-sm">Loading...</p>
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-bold hover:bg-[var(--amber-dim)] transition-colors"
      >
        Return to Game
      </Link>
    </>
  );
}

export default function BillingSuccessPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--arcane)]/20 flex items-center justify-center">
          <span className="text-4xl text-[var(--arcane)]">*</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-[var(--amber)] text-2xl font-bold tracking-wider">
            PAYMENT SUCCESSFUL
          </h1>
          <p className="text-[var(--text-dim)]">
            Your purchase has been completed successfully.
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
