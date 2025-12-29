"use client";

import { useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type { RecoveryMatch } from "@/lib/api";

type Phase = "search" | "results" | "claim" | "sent";

export default function RecoverPage() {
  const [phase, setPhase] = useState<Phase>("search");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [matches, setMatches] = useState<RecoveryMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<RecoveryMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.searchRecoverableSessions({ description: description.trim() });
      setMatches(result.matches);
      setPhase("results");
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLookup = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.lookupSessionByEmail(email.trim());
      if (result.found && result.session_id) {
        // Found by email - go directly to claim
        setSelectedMatch({
          session_id: result.session_id,
          character_name: result.character_name || "Unknown",
          world_name: result.world_name || "Unknown",
          created_at: "",
          last_active: "",
          action_count: 0,
          match_score: 100,
          match_reason: "Found by email",
        });
        setPhase("claim");
      } else {
        setError("No session found with that email. Try describing your character instead.");
      }
    } catch (err) {
      console.error("Email lookup failed:", err);
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.claimRecoveredSession({
        session_id: selectedMatch.session_id,
        email: email.trim(),
      });
      setPhase("sent");
    } catch (err) {
      console.error("Claim failed:", err);
      setError("Failed to send recovery email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <main className="min-h-dvh bg-[var(--void)] text-[var(--text)]">
      {/* Header */}
      <header className="border-b border-[var(--slate)] bg-[var(--shadow)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="text-[var(--amber)] font-bold tracking-wider">RECOVER JOURNEY</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Phase */}
        {phase === "search" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[var(--text-dim)]">
                Lost access to your character? Describe them below and we&apos;ll help you find them.
              </p>
              <p className="text-[var(--mist)] text-xs">
                Sessions are recoverable 1 hour to 7 days after creation.
              </p>
            </div>

            {/* Email quick lookup */}
            <div className="p-4 bg-[var(--shadow)] rounded border border-[var(--slate)]">
              <label className="block text-[var(--mist)] text-xs mb-2">
                Saved your email before?
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder:text-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
                />
                <button
                  onClick={handleEmailLookup}
                  disabled={loading || !email.trim()}
                  className="px-4 py-2 bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : "Find"}
                </button>
              </div>
            </div>

            <div className="text-center text-[var(--slate)] text-xs">
              &mdash; or describe your character &mdash;
            </div>

            {/* Description search */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-[var(--mist)] text-xs mb-2">
                  What do you remember about your character?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., an elf with a dragon tattoo who started in a market, was learning fire magic..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder:text-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--amber-dim)] rounded text-[var(--amber)] font-bold hover:border-[var(--amber)] hover:bg-[var(--stone)] transition-colors disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search for Character"}
              </button>
            </form>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Phase */}
        {phase === "results" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text)] font-bold">
                {matches.length > 0 ? "Possible Matches" : "No Matches Found"}
              </h2>
              <button
                onClick={() => {
                  setPhase("search");
                  setMatches([]);
                  setError(null);
                }}
                className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
              >
                Search Again
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--mist)]">
                  No recoverable sessions match that description.
                </p>
                <p className="text-[var(--text-dim)] text-xs mt-2">
                  Try different details, or your session may have expired.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <button
                    key={match.session_id}
                    onClick={() => {
                      setSelectedMatch(match);
                      setPhase("claim");
                    }}
                    className="w-full p-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-left hover:border-[var(--amber-dim)] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="text-[var(--amber)] font-bold group-hover:text-[var(--amber)]">
                          {match.character_name}
                        </div>
                        <div className="text-[var(--mist)] text-sm">
                          {[match.race, match.occupation].filter(Boolean).join(" ")}
                          {match.last_location && ` in ${match.last_location}`}
                        </div>
                        <div className="text-[var(--text-dim)] text-xs">
                          {match.world_name}
                        </div>
                        <div className="text-[var(--mist)] text-xs italic mt-2">
                          &quot;{match.match_reason}&quot;
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <div className="text-[var(--arcane)]">
                          {match.match_score}% match
                        </div>
                        <div className="text-[var(--mist)]">
                          {match.action_count} actions
                        </div>
                        <div className="text-[var(--text-dim)]">
                          {formatTimeAgo(match.last_active)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Claim Phase */}
        {phase === "claim" && selectedMatch && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setPhase("results");
                setSelectedMatch(null);
              }}
              className="text-[var(--mist)] text-xs hover:text-[var(--amber)] transition-colors"
            >
              &larr; Back to results
            </button>

            <div className="p-4 bg-[var(--shadow)] border border-[var(--amber-dim)] rounded">
              <div className="text-[var(--amber)] font-bold text-lg">
                {selectedMatch.character_name}
              </div>
              <div className="text-[var(--mist)] text-sm mt-1">
                {selectedMatch.world_name}
              </div>
              {selectedMatch.match_reason && (
                <div className="text-[var(--text-dim)] text-xs mt-2 italic">
                  {selectedMatch.match_reason}
                </div>
              )}
            </div>

            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <label className="block text-[var(--mist)] text-xs mb-2">
                  Enter your email to receive a recovery link
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3 py-2 bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder:text-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--amber-dim)] rounded text-[var(--amber)] font-bold hover:border-[var(--amber)] hover:bg-[var(--stone)] transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Recovery Link"}
              </button>
            </form>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Sent Phase */}
        {phase === "sent" && (
          <div className="text-center space-y-6 py-8">
            <div className="text-[var(--amber)] text-4xl">&#x2709;</div>
            <div>
              <h2 className="text-[var(--amber)] font-bold text-lg">Check Your Email</h2>
              <p className="text-[var(--mist)] text-sm mt-2">
                We&apos;ve sent a magic link to <span className="text-[var(--text)]">{email}</span>
              </p>
              <p className="text-[var(--text-dim)] text-xs mt-4">
                Click the link to restore your character and continue your journey.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-2 text-[var(--mist)] text-sm hover:text-[var(--amber)] transition-colors"
            >
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
