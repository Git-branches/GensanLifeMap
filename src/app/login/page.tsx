"use client";

/**
 * Sign-in page. Phase 5 visual language via AuthShell (navy + General
 * Santos imagery, blue CTA). Generic failure message for bad
 * credentials (no account enumeration); field-level messages only for
 * validation problems. Redirects to `?next=` or /profile on success.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import AuthShell from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import Button from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, signIn } = useAuth();
  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
  const redirectTo = user?.role === "admin" || user?.role === "moderator"
    ? safeNextPath?.startsWith("/admin") ? safeNextPath : "/admin"
    : safeNextPath ?? "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(redirectTo);
  }, [status, router, redirectTo]);

  if (status === "authenticated") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You are already signed in. Redirecting…
      </p>
    );
  }

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
      const destination = account.role === "admin" || account.role === "moderator"
        ? safeNextPath?.startsWith("/admin") ? safeNextPath : "/admin"
        : safeNextPath ?? "/profile";
      router.replace(destination);
      router.refresh();
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
    } finally {
      setSubmitting(false);
    }
  };

  const emailError =
    clientErrors.email ?? firstError(serverErrors, "email");
  // Credential failures surface on the `email` key by API design; keep
  // them at form level, other email problems at the field.
  const credentialFailure =
    emailError && !clientErrors.email ? emailError : null;
  const passwordError =
    clientErrors.password ?? firstError(serverErrors, "password");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      )}
      {credentialFailure && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {credentialFailure}
        </p>
      )}
      <AuthField id="email" label="Email address" error={clientErrors.email}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.ph"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fieldError={clientErrors.email}
          disabled={submitting}
        />
      </AuthField>
      <AuthField id="password" label="Password" error={passwordError}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fieldError={passwordError}
          disabled={submitting}
        />
      </AuthField>
      <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
        {submitting ? "Signing you in…" : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-10">
          <p className="text-sm text-zinc-600">Loading sign-in…</p>
        </main>
      }
    >
      <LoginShell />
    </Suspense>
  );
}

/**
 * Staff sign-ins (`/login?next=/admin…`) read/write the admin theme so the
 * preference carries over to the admin workspace; everyone else uses the
 * user theme. The two keys are independent.
 */
function LoginShell() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const themeScope = nextPath?.startsWith("/admin") ? "admin" : "user";
  return (
    <AuthShell
      themeScope={themeScope}
      eyebrow="Welcome back"
      title="Sign in to LifeMap"
      subtitle="Access your GenSan LifeMap account."
      switchPrompt={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
