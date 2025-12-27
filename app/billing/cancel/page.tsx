"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingCancelPage() {
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
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Cancel icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--mist)]/10 flex items-center justify-center">
          <span className="text-4xl text-[var(--mist)]">x</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-[var(--text)] text-2xl font-bold tracking-wider">
            CHECKOUT CANCELLED
          </h1>
          <p className="text-[var(--text-dim)]">
            Your payment was not completed.
          </p>
        </div>

        {/* Details */}
        <div className="p-4 rounded-lg bg-[var(--shadow)] border border-[var(--slate)]">
          <p className="text-[var(--text)] text-sm">
            No charges have been made to your account. You can try again anytime from the game settings.
          </p>
        </div>

        {/* Redirect notice */}
        <p className="text-[var(--mist)] text-sm">
          Returning to TextLands in {countdown}...
        </p>

        {/* Manual link */}
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded bg-[var(--stone)] text-[var(--text)] font-bold hover:bg-[var(--slate)] transition-colors"
        >
          Return to Game
        </Link>
      </div>
    </main>
  );
}
