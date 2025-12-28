"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.textlands.com";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/auth/error?reason=missing_token");
      return;
    }

    // Redirect to API to verify token and set cookie
    // API will redirect back to / on success or /auth/error on failure
    window.location.href = `${API_BASE}/auth/verify?token=${token}&redirect=${encodeURIComponent(window.location.origin)}`;
  }, [token, router]);

  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 mx-auto border-4 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
      <p className="text-[var(--text)]">Verifying your login...</p>
      <p className="text-[var(--mist)] text-sm">Please wait a moment</p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 mx-auto border-4 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
      <p className="text-[var(--text)]">Loading...</p>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--void)] p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[var(--amber)] text-2xl font-bold tracking-wider">TEXTLANDS</h1>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  );
}
