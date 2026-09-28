import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GenSan LifeMap — Know Your City",
    template: "%s | GenSan LifeMap",
  },
  description:
    "Explore places, public projects, facilities, and announcements across General Santos City through one accessible city map.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Public chrome is light-only. Strip any stale global `dark` class
          (e.g. from the retired global theme) so the public site can never
          render dark. Scoped user/admin themes live on
          `div.glm-theme-scope` and are applied by React, not here.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}catch{}`,
          }}
        />
      </head>
      <body className="min-h-full bg-white font-sans text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
