"use client";

import { useState, type FormEvent } from "react";
import { AuthField, AuthInput } from "@/components/auth-fields";
import { MailIcon } from "@/components/ui/icons";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/api/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Send me a reset link" step of the sign-in panel. The confirmation is
 * worded the same whether or not the address is registered, matching the
 * API, so the form can't be used to discover accounts.
 */
export default function ForgotPasswordForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const value = email.trim();
    if (!value) return setFieldError("Enter your email address.");
    if (!EMAIL_RE.test(value)) return setFieldError("Enter a valid email address.");
    setFieldError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors?.email?.[0]) setFieldError(reason.validationErrors.email[0]);
      else setFormError(getFriendlyErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status">
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700"><MailIcon /></span>
          <p>
            If <strong className="font-semibold">{sentTo}</strong> is registered, a link to reset your password is on its way. It stays valid for 60 minutes.
          </p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Nothing arrived? Check your spam folder, or try the address you signed up with.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => setSentTo(null)} className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Use a different email</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <p role="alert" className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 px-3.5 py-3 text-sm text-red-800">{formError}</p>}
      <AuthField id="forgot-email" label="Email address" error={fieldError}>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400"><MailIcon /></span>
          <AuthInput
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus={autoFocus}
            placeholder="you@example.ph"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fieldError={fieldError}
            disabled={submitting}
            className="min-h-11 pl-10"
          />
        </div>
      </AuthField>
      <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60">
        {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
