"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Where the official City of General Santos seal lives. Replace this one
 * file to change the logo everywhere (header, footer, auth, workspaces).
 */
export const BRAND_LOGO_SRC = "/images/brand/seal.png";

/**
 * The system logo. Decorative (`alt=""`): the brand name is always
 * written next to it. If the seal file is missing it falls back to the
 * original pin mark so the UI never shows a broken image.
 */
export default function BrandLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white ${className}`}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" fill="none"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="10" cy="7.5" r="2" fill="currentColor" /></svg>
      </span>
    );
  }

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-white object-contain ${className}`}
    />
  );
}
