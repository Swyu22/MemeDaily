import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemeDaily",
  description: "Daily Chinese meme intelligence desk.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <span className="mark">M</span>
                <span className="brand-copy">
                  <strong>Meme Daily</strong>
                  <span>选题参考台</span>
                </span>
              </Link>
              <nav className="nav" aria-label="Primary">
                <Link href="/">今日台</Link>
                <Link href="/archive/">梗库</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
