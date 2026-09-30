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
        <div className="flex min-h-full flex-col bg-[#f3f7fb] font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <SiteHeader />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6" aria-label="Checking your account">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-9 w-2/3" />
            <Skeleton className="mt-6 h-40 rounded-xl!" />
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
    <div className="flex min-h-full flex-col bg-[#f3f7fb] font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-800 dark:text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />General Santos City · Your account</div>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{`Hello, ${user.name.split(" ")[0]}`}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Manage your GenSan LifeMap account details and security.</p>
          </div>
          <Link href="/reports" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-800 sm:self-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">View my community reports <span aria-hidden="true">→</span></Link>
        </div>

        {formError && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {formError}
          </p>
        )}

        <section aria-label="Account summary" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800"><span className="block text-[26px] font-bold capitalize tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{user.role}</span><span className="mt-1 block text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">Account role</span><span className="mt-2 block h-0.5 w-7 rounded-full bg-blue-600" /></div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800"><span className="block text-[26px] font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">Active</span><span className="mt-1 block text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">Account status · signed in</span><span className="mt-2 block h-0.5 w-7 rounded-full bg-emerald-500" /></div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800"><span className="block text-[26px] font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{formatDate(user.created_at)}</span><span className="mt-1 block text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">Member since</span><span className="mt-2 block h-0.5 w-7 rounded-full bg-slate-300 dark:bg-slate-700" /></div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section
            aria-labelledby="profile-info"
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" /><h2 id="profile-info" className="text-sm font-bold text-slate-900 dark:text-slate-100">Account information</h2></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your signed-in identity used across the platform.</p></div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white shadow-sm"
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                  <dd><span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold capitalize text-blue-800 ring-1 ring-inset ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900">{user.role}</span></dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Account status</dt>
                  <dd><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">Signed in</span></dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Link href="/reports" className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-blue-800 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800">
                  View my community reports →
                </Link>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={onSignOut}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="profile-edit"
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" /><h2 id="profile-edit" className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit profile</h2></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Update the name and email on your account.</p></div>
            <form onSubmit={onSaveProfile} noValidate className="space-y-4 p-5">
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
                <p role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  Profile updated.
                </p>
              )}
              <button type="submit" disabled={savingProfile} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50">
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </form>
          </section>

          <section
            aria-labelledby="profile-password"
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 lg:col-span-2 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" /><h2 id="profile-password" className="text-sm font-bold text-slate-900 dark:text-slate-100">Change password</h2></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Confirm your current password to set a new one.</p></div>
            <form onSubmit={onChangePassword} noValidate className="grid gap-4 p-5 sm:grid-cols-3">
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
                  <p role="status" aria-live="polite" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    Password changed successfully.
                  </p>
                )}
                <button type="submit" disabled={savingPassword} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50">
                  {savingPassword ? "Changing…" : "Change password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
