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
              <Link className="studio-brand" href="/">
                <span className="studio-mark">W.</span>
                <span>WithMedia.与众</span>
              </Link>
              <Link className="product-brand" href="/">
                <strong>Meme Daily</strong>
                <span>选题参考</span>
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
