"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import AuthPanel, { type AuthMode } from "@/components/auth-panel";
import BrandLogo from "@/components/brand-logo";
import Modal from "@/components/ui/modal";

/**
 * Sign-in / create-account dialog opened from the site header and the
 * landing call-to-action. Rendered through a portal so the sticky,
 * blurred header can't become its containing block. Residents stay on
 * the page they were reading (the header then shows their account
 * menu); staff are taken to their workspace.
 */
export default function AuthModal({
  initialMode = "login",
  onClose,
  redirectTo,
}: {
  initialMode?: AuthMode;
  onClose: () => void;
  /** Where residents go after signing in; by default they stay on the current page. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return createPortal(
    <Modal label={mode === "register" ? "Create a GenSan LifeMap account" : mode === "forgot" ? "Reset your GenSan LifeMap password" : "Sign in to GenSan LifeMap"} onClose={onClose}>
      <div className="px-1 pb-1 sm:px-4 sm:pb-3">
        <div className="mb-5 flex items-center justify-center gap-3">
          <BrandLogo size={44} />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-zinc-900">GenSan LifeMap</p>
            <p className="text-xs text-zinc-500">City of General Santos</p>
          </div>
        </div>
        <AuthPanel
          mode={mode}
          onModeChange={setMode}
          autoFocus
          onSuccess={(account) => {
            onClose();
            if (account.role === "admin" || account.role === "moderator") router.push("/admin");
            else if (redirectTo) router.push(redirectTo);
            router.refresh();
          }}
        />
      </div>
    </Modal>,
    document.body,
  );
}
