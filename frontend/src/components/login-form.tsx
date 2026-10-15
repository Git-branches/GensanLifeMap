"use client";

/**
 * Sign-in form shared by the /login page and the sign-in modal.
 * Generic failure message for bad credentials (no account enumeration);
 * field-level messages only for validation problems. What happens after
 * a successful sign-in is the caller's decision (`onSuccess`).
 */

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import { useAuth } from "@/components/auth-provider";
import { LockIcon, MailIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function IconSlot({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
      {children}
    </span>
  );
}

export default function LoginForm({
  onSuccess,
  autoFocus = false,
}: {
  onSuccess: (account: AuthUser) => void;
  /** Focus the email field on mount (used by the modal). */
  autoFocus?: boolean;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setClientErrors(errors);
    setServerErrors(null);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const account = await signIn({ email: email.trim(), password });
      onSuccess(account);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        // Bad credentials arrive as a generic 422 on `email` — shown as
        // a form-level message so accounts cannot be enumerated.
        setServerErrors(error.validationErrors);
        if (!error.validationErrors) setFormError(error.message);
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  };

  // Credential failures surface on the `email` key by API design; keep
  // them at form level, other email problems at the field.
  const serverEmailError = firstError(serverErrors, "email");
  const credentialFailure = serverEmailError && !clientErrors.email ? serverEmailError : null;
  const passwordError = clientErrors.password ?? firstError(serverErrors, "password");
  const banner = formError ?? credentialFailure;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {banner && (
        <p role="alert" className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {banner}
        </p>
      )}

      <AuthField id="email" label="Email address" error={clientErrors.email}>
        <div className="relative">
          <IconSlot><MailIcon /></IconSlot>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus={autoFocus}
            placeholder="you@example.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fieldError={clientErrors.email}
            disabled={submitting}
            className="min-h-11 pl-10"
          />
        </div>
      </AuthField>

      <AuthField id="password" label="Password" error={passwordError}>
        <div className="relative">
          <IconSlot><LockIcon /></IconSlot>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fieldError={passwordError}
            disabled={submitting}
            className="min-h-11 pl-10"
          />
        </div>
      </AuthField>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60"
      >
        {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Signing you in…" : "Sign in"}
      </button>
    </form>
  );
}
