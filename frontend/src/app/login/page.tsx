import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPage from "@/components/auth-page";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-slate-600">Loading sign-in…</p>}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}