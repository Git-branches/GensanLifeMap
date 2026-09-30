"use client";

/**
 * Shared form primitives for authentication screens: labeled field
 * with field-level validation message, and a password input with a
 * show/hide toggle. Styled with the existing input system.
 */

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldLabel } from "./ui/input";

export function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

export interface AuthInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  fieldError?: string | null;
}

export function AuthInput({ id, fieldError, className = "", ...rest }: AuthInputProps) {
  const tone = fieldError
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-zinc-300 focus:border-blue-600 focus:ring-blue-600 dark:border-zinc-700";
  return (
    <input
      id={id}
      aria-invalid={Boolean(fieldError)}
      aria-describedby={fieldError ? `${id}-error` : undefined}
      className={
        `w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 ` +
        `placeholder:text-zinc-400 focus:outline-none focus:ring-1 ` +
        `dark:bg-zinc-900 dark:text-zinc-100 ${tone} ${className}`.trim()
      }
      {...rest}
    />
  );
}

/** Password input with an accessible show/hide toggle. */
export function PasswordInput(props: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput {...props} type={visible ? "text" : "password"} className="pr-16" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/** Map Laravel 422 field errors onto form fields. */
export function firstError(
  errors: Record<string, string[]> | null | undefined,
  field: string,
): string | null {
  const messages = errors?.[field];
  return messages && messages.length > 0 ? messages[0] : null;
}
