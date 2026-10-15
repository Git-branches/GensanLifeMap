import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPage from "@/components/auth-page";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-slate-600">Loading…</p>}>
      <AuthPage initialMode="register" />
    </Suspense>
  );
}