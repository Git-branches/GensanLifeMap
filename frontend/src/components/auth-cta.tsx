"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "@/components/auth-modal";
import { useAuth } from "@/components/auth-provider";
import { FlagIcon, UsersIcon } from "@/components/ui/icons";

const BUTTON =
  "inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Landing-page call to action that adapts to the visitor: guests open
 * the create-account dialog, signed-in residents go straight to the
 * report form.
 */
export default function AuthCta() {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);

  if (status === "authenticated") {
    return (
      <Link href="/reports/new" className={BUTTON}>
        <FlagIcon /> Submit a report
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={BUTTON}>
        <UsersIcon /> Create a free account
      </button>
      {open && <AuthModal initialMode="register" onClose={() => setOpen(false)} />}
    </>
  );
}
