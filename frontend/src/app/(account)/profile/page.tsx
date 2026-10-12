"use client";

/**
 * Profile page, rendered inside the resident workspace shell. Shows the
 * signed-in user's information, lets them update their name/email and
 * change their password. Role is displayed but never editable here.
 * Guests are redirected by the shell (and by proxy.ts before it).
 */

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthField, AuthInput, PasswordInput, firstError } from "@/components/auth-fields";
import { useAuth } from "@/components/auth-provider";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import { changePassword, updateProfile } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CARD = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800";
const BTN = "min-h-11 px-5";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function CardHeader({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
      <h2 id={id} className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "blue" | "green" | "amber"; children: ReactNode }) {
  const tones = {
    blue: "bg-blue-50 text-blue-800 ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900",
    amber: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div aria-label="Loading your profile" className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl!" />
        <Skeleton className="h-72 w-full rounded-2xl!" />
      </div>
    );
  }

  // Keyed by account id: form state initializes from the loaded user,
  // and resets cleanly if a different account ever signs in.
  return <ProfileContent key={user.id} user={user} />;
}

function ProfileContent({ user }: { user: AuthUser }) {
  const { refreshUser } = useAuth();

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

  const [formError, setFormError] = useState<string | null>(null);

  const profileDirty = name.trim() !== user.name || email.trim() !== user.email;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-700 text-2xl font-bold text-white shadow-sm">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300">My profile</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{user.name}</h1>
          <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <section aria-labelledby="profile-edit" className={CARD}>
            <CardHeader id="profile-edit" title="Personal information" description="The name and email address used across your account." />
            <form onSubmit={onSaveProfile} noValidate className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
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
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <button type="submit" disabled={savingProfile || !profileDirty} className={buttonClasses("primary", "md", BTN)}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
                {profileDirty && !savingProfile && (
                  <button
                    type="button"
                    onClick={() => { setName(user.name); setEmail(user.email); setProfileErrors(null); }}
                    className="min-h-11 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Discard
                  </button>
                )}
                {profileSaved && (
                  <p role="status" aria-live="polite" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Profile updated.
                  </p>
                )}
              </div>
            </form>
          </section>

          <section aria-labelledby="profile-password" className={CARD}>
            <CardHeader id="profile-password" title="Password &amp; security" description="Confirm your current password to set a new one." />
            <form onSubmit={onChangePassword} noValidate className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 sm:max-w-sm">
                  <AuthField id="current-password" label="Current password" error={firstError(passwordErrors, "current_password")}>
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
                </div>
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
                <AuthField id="confirm-password" label="Confirm new password" error={firstError(passwordErrors, "password")}>
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
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <button type="submit" disabled={savingPassword || !current || !next || !confirm} className={buttonClasses("primary", "md", BTN)}>
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
                {passwordSaved && (
                  <p role="status" aria-live="polite" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Password changed successfully.
                  </p>
                )}
              </div>
            </form>
          </section>
        </div>

        <aside aria-labelledby="account-summary" className={`${CARD} lg:sticky lg:top-24`}>
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 id="account-summary" className="text-base font-bold text-slate-900 dark:text-slate-100">Account summary</h2>
          </div>
          <dl className="divide-y divide-slate-100 px-5 text-sm dark:divide-slate-800">
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-slate-500 dark:text-slate-400">Role</dt>
              <dd><StatusPill tone="blue">{user.role}</StatusPill></dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd>{user.email_verified_at ? <StatusPill tone="green">Verified</StatusPill> : <StatusPill tone="amber">Not verified</StatusPill>}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
              <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{formatDate(user.created_at)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
