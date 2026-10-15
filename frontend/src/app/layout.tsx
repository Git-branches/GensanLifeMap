import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display face for page titles: a sturdy serif paired with the Geist
// body text gives the public pages an editorial, civic voice instead of
// the default all-sans SaaS look.
const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
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
