import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { config } from "@/config";

import "./globals.css";

// Every page reads the session and the database, so render per request
// (also means `next build` never needs a database connection).
export const dynamic = "force-dynamic";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const metadataBase = (() => {
  try {
    return new URL(process.env.APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: { default: config.branding.name, template: `%s · ${config.branding.name}` },
  description: config.branding.description,
  keywords: config.branding.keywords,
  openGraph: { title: config.branding.name, description: config.branding.description, type: "website" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const { branding } = config;
  const brandVars = { "--brand": branding.primaryColor, "--accent": branding.accentColor } as CSSProperties;

  return (
    <html lang={branding.locale} style={brandVars}>
      <body className={`${sans.variable} ${mono.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground">
            <span>
              {branding.name}
              {branding.footer.text && ` · ${branding.footer.text}`}
            </span>
            <span className="flex gap-4">
              {branding.footer.links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
