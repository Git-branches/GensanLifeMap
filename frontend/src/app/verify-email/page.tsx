"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import AuthModalButton from "@/components/auth-modal-button";
import AuthShell from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import { verifyEmailLink } from "@/lib/api/auth";

type State = { kind: "checking" } | { kind: "verified" } | { kind: "failed"; message: string };

const PRIMARY = "mt-6 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800";

function Verify() {
  const searchParams = useSearchParams();
  const { status, refreshUser } = useAuth();
  const id = searchParams.get("id");
  const hash = searchParams.get("hash");
  const expires = searchParams.get("expires");
  const signature = searchParams.get("signature");
  const complete = Boolean(id && hash && expires && signature);
  const [state, setState] = useState<State>(
    complete ? { kind: "checking" } : { kind: "failed", message: "This verification link is incomplete. Open the newest email we sent you." },
  );
  const started = useRef(false);

  useEffect(() => {
    if (!complete || started.current) return;
    started.current = true;
    verifyEmailLink({ id: id!, hash: hash!, expires: expires!, signature: signature! })
      .then(async () => {
        setState({ kind: "verified" });
        await refreshUser();
      })
      .catch((reason: unknown) => {
        const message =
          reason instanceof ApiError && reason.validationErrors?.signature?.[0]
            ? reason.validationErrors.signature[0]
            : getFriendlyErrorMessage(reason);
        setState({ kind: "failed", message });
      });
  }, [complete, id, hash, expires, signature, refreshUser]);

  if (state.kind === "checking") {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-slate-600">
        <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        Verifying your email address…
      </div>
    );
  }

  if (state.kind === "verified") {
    return (
      <div role="status">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckIcon /></span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">Email verified</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Thank you. Your email address is confirmed.</p>
        {status === "authenticated" ? (
          <Link href="/dashboard" className={PRIMARY}>Go to your dashboard</Link>
        ) : (
          <AuthModalButton redirectTo="/dashboard" className={PRIMARY}>Sign in</AuthModalButton>
        )}
      </div>
    );
  }

  return (
    <div role="alert">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700"><CloseIcon /></span>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">We could not verify this link</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{state.message}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">Sign in and use &ldquo;Resend email&rdquo; in your workspace to get a fresh link.</p>
      {status === "authenticated" ? (
        <Link href="/dashboard" className={PRIMARY}>Go to your dashboard</Link>
      ) : (
        <AuthModalButton redirectTo="/dashboard" className={PRIMARY}>Sign in</AuthModalButton>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
        <Verify />
      </Suspense>
    </AuthShell>
  );
}
