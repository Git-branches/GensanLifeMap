"use client";

import { useState, type ReactNode } from "react";
import AuthModal from "@/components/auth-modal";
import type { AuthMode } from "@/components/auth-panel";

/**
 * A button that opens the sign-in modal (optionally on a given step), for
 * pages reached from email links where the site header isn't shown.
 */
export default function AuthModalButton({
  mode = "login",
  redirectTo,
  className,
  children,
}: {
  mode?: AuthMode;
  redirectTo?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={className}>
        {children}
      </button>
      {open && <AuthModal initialMode={mode} redirectTo={redirectTo} onClose={() => setOpen(false)} />}
    </>
  );
}
