"use client";

/**
 * Account page (protected). Shows the signed-in user's information,
 * lets them update their name/email, change their password, and sign
 * out. Role is displayed but never editable here. Guests are sent to
 * /login (middleware guards first; this is the client fallback).
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import { useAuth } from "@/components/auth-provider";
import { ScopedThemeProvider } from "@/components/theme-provider";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Container, PageHeader } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/states";
import { changePassword, updateProfile } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { status, user } = useAuth();

  // Client fallback for guests (middleware guards first). Navigation
  // only — no state updates here.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/profile");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <ScopedThemeProvider scope="user">
        <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
          <SiteHeader />
          <main className="flex-1 py-10" aria-label="Checking your account">
            <Container>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-9 w-2/3" />
              <Skeleton className="mt-6 h-40 rounded-xl!" />
            </Container>
          </main>
          <SiteFooter />
        </div>
      </ScopedThemeProvider>
    );
  }

  // Keyed by account id: form state initializes from the loaded user,
  // and resets cleanly if a different account ever signs in.
  return (
    <ScopedThemeProvider scope="user">
      <Suspense>
        <ProfileContent key={user.id} user={user} />
      </Suspense>
    </ScopedThemeProvider>
  );
}

function ProfileContent({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { signOut, refreshUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]> | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]> | null>(null);
  const [passwordClientError, setPasswordClientError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErrors(null);
    setProfileSaved(false);
    setFormError(null);
    if (!name.trim() || !EMAIL_RE.test(email.trim())) {
      setFormError("Enter a valid name and email address.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      await refreshUser();
      setProfileSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        setProfileErrors(error.validationErrors);
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordErrors(null);
    setPasswordClientError(null);
    setPasswordSaved(false);
    setFormError(null);
    if (next.length < 8) {
      setPasswordClientError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setPasswordClientError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setPasswordSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        setPasswordErrors(error.validationErrors);
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container>
          <PageHeader
            eyebrow="Your account"
            title={`Hello, ${user.name.split(" ")[0]}`}
            description="Manage your GenSan LifeMap account details and security."
          />

          {formError && (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {formError}
            </p>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section
              aria-labelledby="profile-info"
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            >
              <h2 id="profile-info" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Account information
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
                  <dd><Badge tone="neutral">{user.role}</Badge></dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Account status</dt>
                  <dd><Badge tone="success">Signed in</Badge></dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-100">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
              </dl>
              <Link href="/reports" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:underline">
                View my community reports →
              </Link>
              <Button
                variant="secondary"
                size="sm"
                disabled={signingOut}
                onClick={onSignOut}
                className="mt-4"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </section>

            <section
              aria-labelledby="profile-edit"
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            >
              <h2 id="profile-edit" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Edit profile
              </h2>
              <form onSubmit={onSaveProfile} noValidate className="mt-4 space-y-4">
                <AuthField id="profile-name" label="Full name" error={firstError(profileErrors, "name")}>
                  <AuthInput
                    id="profile-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setProfileSaved(false); }}
                    fieldError={firstError(profileErrors, "name")}
                    disabled={savingProfile}
                  />
                </AuthField>
                <AuthField id="profile-email" label="Email address" error={firstError(profileErrors, "email")}>
                  <AuthInput
                    id="profile-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setProfileSaved(false); }}
                    fieldError={firstError(profileErrors, "email")}
                    disabled={savingProfile}
                  />
                </AuthField>
                {profileSaved && (
                  <p role="status" aria-live="polite" className="text-sm text-green-700 dark:text-green-400">
                    Profile updated.
                  </p>
                )}
                <Button type="submit" variant="primary" size="sm" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </section>

            <section
              aria-labelledby="profile-password"
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:col-span-2"
            >
              <h2 id="profile-password" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Change password
              </h2>
              <form onSubmit={onChangePassword} noValidate className="mt-4 grid gap-4 sm:grid-cols-3">
                <AuthField
                  id="current-password"
                  label="Current password"
                  error={firstError(passwordErrors, "current_password")}
                >
                  <PasswordInput
                    id="current-password"
                    name="current_password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    fieldError={firstError(passwordErrors, "current_password")}
                    disabled={savingPassword}
                  />
                </AuthField>
                <AuthField
                  id="new-password"
                  label="New password"
                  error={passwordClientError ?? firstError(passwordErrors, "password")}
                  hint="At least 8 characters."
                >
                  <PasswordInput
                    id="new-password"
                    name="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    fieldError={passwordClientError ?? firstError(passwordErrors, "password")}
                    disabled={savingPassword}
                  />
                </AuthField>
                <AuthField
                  id="confirm-password"
                  label="Confirm new password"
                  error={firstError(passwordErrors, "password")}
                >
                  <PasswordInput
                    id="confirm-password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    fieldError={firstError(passwordErrors, "password")}
                    disabled={savingPassword}
                  />
                </AuthField>
                <div className="sm:col-span-3">
                  {passwordSaved && (
                    <p role="status" aria-live="polite" className="mb-3 text-sm text-green-700 dark:text-green-400">
                      Password changed successfully.
                    </p>
                  )}
                  <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
                    {savingPassword ? "Changing…" : "Change password"}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
