import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Media Metrics Lab",
  description: "Collect, monitor, and export media metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="type-h3">
                Media Metrics Lab
              </Link>

              <nav className="flex items-center gap-2">
                <Link
                  href="/"
                  className="type-helper rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Single
                </Link>
                <Link
                  href="/bulk"
                  className="type-helper rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Bulk
                </Link>
              </nav>
            </div>
          </header>

          <main className="app-shell-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
