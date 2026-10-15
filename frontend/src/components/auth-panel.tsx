"use client";

import { useEffect, useRef, useState } from "react";
import LoginForm from "@/components/login-form";
import RegisterForm from "@/components/register-form";
import type { AuthUser } from "@/types/user";

export type AuthMode = "login" | "register";

const COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to your GenSan LifeMap account.",
  },
  register: {
    title: "Create your account",
    subtitle: "Submit and follow community reports across General Santos City.",
  },
};

/**
 * Sign-in / create-account switcher shared by the header modal and the
 * /login and /register pages. A sliding segmented control swaps the two
 * forms; the content slides in from the side it came from and the
 * container eases to the new height (all motion is disabled globally
 * under `prefers-reduced-motion`).
 */
export default function AuthPanel({
  mode,
  onModeChange,
  onSuccess,
  autoFocus = false,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: (account: AuthUser) => void;
  autoFocus?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  // Skip the entrance animation on first paint; animate only on a switch.
  const [switched, setSwitched] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const choose = (next: AuthMode) => {
    if (next === mode) return;
    setSwitched(true);
    onModeChange(next);
  };

  const copy = COPY[mode];
  const slide = !switched ? "" : mode === "register" ? "glm-auth-in-right" : "glm-auth-in-left";

  return (
    <div>
      <div role="tablist" aria-label="Sign in or create an account" className="relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 transition-transform duration-300 ease-out"
          style={{ transform: mode === "register" ? "translateX(100%)" : "translateX(0)" }}
        />
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            id={`auth-tab-${item}`}
            aria-selected={mode === item}
            aria-controls="auth-panel"
            onClick={() => choose(item)}
            className={`relative z-10 min-h-10 rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${mode === item ? "text-blue-800" : "text-slate-600 hover:text-slate-900"}`}
          >
            {item === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <div
        className="-mx-1 mt-6 overflow-hidden px-1 pb-1 transition-[height] duration-300 ease-out"
        style={height === null ? undefined : { height: height + 4 }}
      >
        <div ref={innerRef}>
          <div key={mode} id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`} className={slide}>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.subtitle}</p>
            <div className="mt-6">
              {mode === "login" ? (
                <LoginForm autoFocus={autoFocus || switched} onSuccess={onSuccess} />
              ) : (
                <RegisterForm autoFocus={autoFocus || switched} onSuccess={onSuccess} />
              )}
            </div>
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
              {mode === "login" ? "New to GenSan LifeMap? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => choose(mode === "login" ? "register" : "login")}
                className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
