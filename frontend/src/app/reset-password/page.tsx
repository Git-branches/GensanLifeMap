"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthField, PasswordInput } from "@/components/auth-fields";
import AuthModalButton from "@/components/auth-modal-button";
import AuthShell from "@/components/auth-shell";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/auth";

const PRIMARY = "mt-6 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800";

/**
 * Target of the link in the password-reset email. Requesting a new link
 * and signing in afterwards both happen in the auth modal, not on other
 * pages.
 */
function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token || !email) {
    return (
      <div role="alert">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">This link is incomplete</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">The reset link looks cut off. Open the newest email we sent, or request a fresh link.</p>
        <AuthModalButton mode="forgot" className={PRIMARY}>Request a new link</AuthModalButton>
      </div>
    );
  }

  if (done) {
    return (
      <div role="status">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckIcon /></span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">Password updated</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your password has been changed and any other signed-in devices were signed out. Sign in with your new password.</p>
        <AuthModalButton redirectTo="/dashboard" className={PRIMARY}>Sign in</AuthModalButton>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirm });
      setDone(true);
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors) {
        const first = Object.values(reason.validationErrors).flat()[0];
        setFormError(first ?? getFriendlyErrorMessage(reason));
      } else {
        setFormError(getFriendlyErrorMessage(reason));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Choose a new password</h1>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        For <strong className="font-semibold text-slate-800">{email}</strong>. Use at least 8 characters.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 px-3.5 py-3 text-sm text-red-800">
            {formError}{" "}
            <AuthModalButton mode="forgot" className="font-semibold underline">Request a new link</AuthModalButton>
          </p>
        )}
        <AuthField id="new-password" label="New password" error={errors.password}>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400"><LockIcon /></span>
            <PasswordInput id="new-password" name="password" autoComplete="new-password" autoFocus placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} fieldError={errors.password} disabled={submitting} className="min-h-11 pl-10" />
          </div>
        </AuthField>
        <AuthField id="confirm-password" label="Confirm new password" error={errors.confirm}>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400"><LockIcon /></span>
            <PasswordInput id="confirm-password" name="password_confirmation" autoComplete="new-password" placeholder="Re-enter password" value={confirm} onChange={(event) => setConfirm(event.target.value)} fieldError={errors.confirm} disabled={submitting} className="min-h-11 pl-10" />
          </div>
        </AuthField>
        <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60">
          {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
