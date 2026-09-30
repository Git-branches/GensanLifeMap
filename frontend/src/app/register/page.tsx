"use client";

/**
 * Account-creation page. Same AuthShell visual language as sign-in.
 * Creates a citizen account and signs the new account in immediately.
 * Duplicate emails surface as a friendly field-level message.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import AuthShell from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import Button from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ClientErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { status, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  if (status === "authenticated") {
    return (
      <AuthShell
        eyebrow="Create account"
        title="Join LifeMap"
        subtitle="Create your GenSan LifeMap account."
        switchPrompt={
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You are already signed in. Redirecting…
        </p>
      </AuthShell>
    );
  }

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
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
      });
      router.replace("/profile");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
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

  const field = (key: keyof ClientErrors, serverKey?: string) =>
    clientErrors[key] ?? firstError(serverErrors, serverKey ?? key);

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join LifeMap"
      subtitle="Create your GenSan LifeMap account."
      switchPrompt={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {formError}
          </p>
        )}
        <AuthField id="name" label="Full name" error={field("name")}>
          <AuthInput
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fieldError={field("name")}
            disabled={submitting}
          />
        </AuthField>
        <AuthField id="email" label="Email address" error={field("email")}>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fieldError={field("email")}
            disabled={submitting}
          />
        </AuthField>
        <AuthField
          id="password"
          label="Password"
          error={field("password")}
          hint="At least 8 characters."
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fieldError={field("password")}
            disabled={submitting}
          />
        </AuthField>
        <AuthField
          id="password_confirmation"
          label="Confirm password"
          error={field("password_confirmation")}
        >
          <PasswordInput
            id="password_confirmation"
            name="password_confirmation"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fieldError={field("password_confirmation")}
            disabled={submitting}
          />
        </AuthField>
        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          {submitting ? "Creating your account…" : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
