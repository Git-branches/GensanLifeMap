"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { MailIcon } from "@/components/ui/icons";
import { getFriendlyErrorMessage } from "@/lib/api/client";
import { resendVerificationEmail } from "@/lib/api/auth";

type Outcome = { kind: "idle" } | { kind: "sent"; message: string } | { kind: "error"; message: string };

/**
 * Gentle reminder shown across the resident workspace until the account's
 * email address is confirmed. Using the site is not blocked; the banner
 * just explains the next step and lets them ask for a fresh link.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  if (!user || user.email_verified_at) return null;

  async function resend() {
    setSending(true);
    setOutcome({ kind: "idle" });
    try {
      setOutcome({ kind: "sent", message: await resendVerificationEmail() });
    } catch (reason) {
      setOutcome({ kind: "error", message: getFriendlyErrorMessage(reason) });
    } finally {
      setSending(false);
    }
  }

  return (
    <div role="region" aria-label="Email verification" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2.5">
          <span aria-hidden="true" className="mt-0.5 shrink-0"><MailIcon /></span>
          <span>
            <strong className="font-semibold">Verify your email address.</strong>{" "}
            We sent a link to {user.email}. Open it to confirm this is you.
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {outcome.kind !== "idle" && (
            <span role={outcome.kind === "error" ? "alert" : "status"} className="text-xs font-medium">{outcome.message}</span>
          )}
          <button
            type="button"
            onClick={() => void resend()}
            disabled={sending}
            className="min-h-9 shrink-0 rounded-full border border-amber-300 bg-white px-4 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-50 dark:hover:bg-amber-800"
          >
            {sending ? "Sending…" : "Resend email"}
          </button>
        </div>
      </div>
    </div>
  );
}
