"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUIStrings } from "@/contexts/UIStringsContext";
import * as api from "@/lib/api";
import type { AccountPromptReason } from "@/types/game";

// Session context to preserve across auth
interface SessionContext {
  world_id?: string;
  entity_id?: string;
  character_name?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: AccountPromptReason;
  incentive?: string;
  sessionContext?: SessionContext;
}

const REASON_ICONS: Record<AccountPromptReason, string> = {
  nsfw_unlock: "🔥",
  death_recovery: "💀",
  time_limit: "⏰",
};

type AuthMethod = "email" | "sms";
type SmsStep = "phone" | "code";

export function AuthModal({ isOpen, onClose, reason, incentive, sessionContext }: AuthModalProps) {
  const { requestMagicLink } = useAuth();
  const { t } = useUIStrings();

  // Auth method state
  const [method, setMethod] = useState<AuthMethod>("email");

  // Email state
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // SMS state
  const [phone, setPhone] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [smsStep, setSmsStep] = useState<SmsStep>("phone");
  const [code, setCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Get reason-specific content using t()
  const getReasonContent = (r: AccountPromptReason) => ({
    nsfw_unlock: { title: t("unlock_intimate_content"), description: t("unlock_intimate_desc") },
    death_recovery: { title: t("character_fallen"), description: t("character_fallen_desc") },
    time_limit: { title: t("session_limit"), description: t("session_limit_desc") },
  }[r]);

  const content = reason ? getReasonContent(reason) : null;
  const icon = reason ? REASON_ICONS[reason] : null;

  const handlePhoneChange = (value: string) => {
    // Only allow digits and +
    const cleaned = value.replace(/[^\d+]/g, "");
    setPhone(api.toE164(cleaned));
    setPhoneDisplay(api.formatPhoneDisplay(cleaned));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestMagicLink(email, sessionContext);

    if (result.success) {
      setEmailSent(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (smsStep === "phone") {
      // Request OTP
      try {
        const result = await api.requestSmsOtp(phone);
        if (result.success) {
          setSmsStep("code");
          setSmsSent(true);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send code");
      }
    } else {
      // Verify OTP
      try {
        const result = await api.verifySmsOtp(phone, code);
        if (result.success) {
          if (result.account_linked) {
            // Phone is linked to account - user is now logged in
            window.location.reload();
          } else {
            // Phone verified but not linked - need to create/link account
            // Switch to email to complete account creation
            setError("Phone verified! Enter your email to link your account.");
            setMethod("email");
            setSmsStep("phone");
            setCode("");
          }
        } else {
          setError(result.message || "Invalid code");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    }
    setLoading(false);
  };

  const handleClose = () => {
    // Reset all state
    setMethod("email");
    setEmail("");
    setEmailSent(false);
    setPhone("");
    setPhoneDisplay("");
    setSmsStep("phone");
    setCode("");
    setSmsSent(false);
    setError("");
    onClose();
  };

  const switchMethod = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setError("");
    // Reset SMS state when switching
    if (newMethod === "email") {
      setSmsStep("phone");
      setCode("");
    }
  };

  const isSuccess = method === "email" ? emailSent : (smsSent && smsStep === "code");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--void)] border border-[var(--amber-dim)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="relative p-4 border-b border-[var(--stone)] bg-gradient-to-b from-[var(--amber)]/10 to-transparent">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
            aria-label="Close"
          >
            x
          </button>
          {icon && <div className="text-4xl text-center mb-2">{icon}</div>}
          <h2 className="text-[var(--amber)] font-bold tracking-wider text-center">
            {content ? content.title : t("save_your_progress")}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {emailSent ? (
            // Email sent success state
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-[var(--text)]">{t("check_your_email")}</p>
              <p className="text-[var(--mist)] text-sm">
                {t("email_link_sent")} <span className="text-[var(--amber)]">{email}</span>
              </p>
              <p className="text-[var(--text-dim)] text-xs">{t("link_expires")}</p>
              <button
                onClick={handleClose}
                className="mt-4 w-full px-4 py-3 rounded bg-[var(--stone)] text-[var(--text)] hover:bg-[var(--slate)] transition-colors"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Method toggle */}
              <div className="flex gap-2 p-1 bg-[var(--shadow)] rounded-lg">
                <button
                  type="button"
                  onClick={() => switchMethod("email")}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    method === "email"
                      ? "bg-[var(--amber)] text-[var(--void)]"
                      : "text-[var(--mist)] hover:text-[var(--text)]"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => switchMethod("sms")}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    method === "sms"
                      ? "bg-[var(--amber)] text-[var(--void)]"
                      : "text-[var(--mist)] hover:text-[var(--text)]"
                  }`}
                >
                  SMS
                </button>
              </div>

              {content && (
                <p className="text-[var(--text)] text-center text-sm">{content.description}</p>
              )}
              {!content && (
                <p className="text-[var(--text)] text-center text-sm">
                  {t("enter_email_to_save")}
                </p>
              )}

              {incentive && (
                <div className="bg-[var(--shadow)] border border-[var(--amber-dim)] rounded-lg p-3">
                  <p className="text-[var(--amber)] text-sm text-center font-medium">{incentive}</p>
                </div>
              )}

              {method === "email" ? (
                // Email form
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                    />
                  </div>

                  {error && <p className="text-[var(--crimson)] text-sm text-center">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-medium hover:bg-[var(--amber)]/80 transition-colors disabled:opacity-50"
                  >
                    {loading ? t("sending") : t("send_login_link")}
                  </button>

                  <p className="text-[var(--mist)] text-xs text-center">
                    {t("no_password_magic_link")}
                  </p>
                </form>
              ) : (
                // SMS form
                <form onSubmit={handleSmsSubmit} className="space-y-4">
                  {smsStep === "phone" ? (
                    <>
                      <div>
                        <input
                          type="tel"
                          value={phoneDisplay}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          required
                          className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                        />
                      </div>

                      {error && <p className="text-[var(--crimson)] text-sm text-center">{error}</p>}

                      <button
                        type="submit"
                        disabled={loading || phone.length < 10}
                        className="w-full px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-medium hover:bg-[var(--amber)]/80 transition-colors disabled:opacity-50"
                      >
                        {loading ? t("sending") : "Send Code"}
                      </button>

                      <p className="text-[var(--mist)] text-xs text-center">
                        We&apos;ll text you a 6-digit code
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[var(--mist)] text-sm text-center">
                        Enter the code sent to <span className="text-[var(--amber)]">{phoneDisplay}</span>
                      </p>

                      <div>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          required
                          autoFocus
                          className="w-full px-4 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded-lg text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber)] focus:outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                        />
                      </div>

                      {error && <p className="text-[var(--crimson)] text-sm text-center">{error}</p>}

                      <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full px-4 py-3 rounded bg-[var(--amber)] text-[var(--void)] font-medium hover:bg-[var(--amber)]/80 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSmsStep("phone");
                          setCode("");
                          setError("");
                        }}
                        className="w-full px-4 py-2 text-[var(--mist)] text-sm hover:text-[var(--text)] transition-colors"
                      >
                        Use different number
                      </button>
                    </>
                  )}
                </form>
              )}

              {!reason && !isSuccess && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-[var(--mist)] text-sm hover:text-[var(--text)] transition-colors"
                >
                  {t("maybe_later")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
