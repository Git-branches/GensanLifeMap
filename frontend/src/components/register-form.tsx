"use client";

/**
 * Account-creation form shared by /register and the auth modal.
 * Creates a citizen account and signs the new account in immediately.
 * Duplicate emails surface as a friendly field-level message. What
 * happens next is the caller's decision (`onSuccess`).
 */

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import { useAuth } from "@/components/auth-provider";
import { LockIcon, MailIcon, UsersIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ClientErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

function IconSlot({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400">
      {children}
    </span>
  );
}

export default function RegisterForm({
  onSuccess,
  autoFocus = false,
}: {
  onSuccess: (account: AuthUser) => void;
  autoFocus?: boolean;
}) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: ClientErrors = {};
    if (!name.trim()) errors.name = "Enter your name.";
    else if (name.trim().length > 255) errors.name = "Name is too long.";
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Create a password.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (confirm !== password) errors.password_confirmation = "Passwords do not match.";
    setClientErrors(errors);
    setServerErrors(null);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const account = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
      });
      onSuccess(account);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
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

  const field = (key: keyof ClientErrors, serverKey?: string) =>
    clientErrors[key] ?? firstError(serverErrors, serverKey ?? key);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 border-l-4 border-l-red-600 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {formError}
        </p>
      )}

      <AuthField id="name" label="Full name" error={field("name")}>
        <div className="relative">
          <IconSlot><UsersIcon /></IconSlot>
          <AuthInput
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus={autoFocus}
            placeholder="Juan Dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fieldError={field("name")}
            disabled={submitting}
            className="min-h-11 pl-10"
          />
        </div>
      </AuthField>

      <AuthField id="email" label="Email address" error={field("email")}>
        <div className="relative">
          <IconSlot><MailIcon /></IconSlot>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fieldError={field("email")}
            disabled={submitting}
            className="min-h-11 pl-10"
          />
        </div>
      </AuthField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField id="password" label="Password" error={field("password")} hint="At least 8 characters.">
          <div className="relative">
            <IconSlot><LockIcon /></IconSlot>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fieldError={field("password")}
              disabled={submitting}
              className="min-h-11 pl-10"
            />
          </div>
        </AuthField>
        <AuthField id="password_confirmation" label="Confirm password" error={field("password_confirmation")}>
          <div className="relative">
            <IconSlot><LockIcon /></IconSlot>
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              autoComplete="new-password"
              placeholder="Re-enter"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              fieldError={field("password_confirmation")}
              disabled={submitting}
              className="min-h-11 pl-10"
            />
          </div>
        </AuthField>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60"
      >
        {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
