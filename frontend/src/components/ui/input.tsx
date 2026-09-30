/**
 * GenSan LifeMap form controls: one search/input style everywhere
 * (landing, map, collection filters). Label + hint follow the same
 * small-text pattern.
 */

import type { InputHTMLAttributes, ReactNode } from "react";

export const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
    >
      {children}
    </label>
  );
}

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label: string;
  hint?: string;
}

/** Labeled search input used by the map and listing filters. */
export default function SearchField({
  id,
  label,
  hint,
  className = "",
  ...rest
}: SearchFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="search"
        autoComplete="off"
        className={`${inputClasses} ${className}`.trim()}
        {...rest}
      />
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
