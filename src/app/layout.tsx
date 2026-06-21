import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://memedaily.fun"),
  title: "热梗日报",
  description: "📰中文互联网每日热门话题精选",
  openGraph: {
    type: "website",
    url: "https://memedaily.fun",
    siteName: "热梗日报",
    title: "热梗日报",
    description: "📰中文互联网每日热门话题精选",
    images: [{ url: "/share.png", width: 1200, height: 1200, alt: "热梗日报" }],
  },
  twitter: {
    card: "summary",
    title: "热梗日报",
    description: "📰中文互联网每日热门话题精选",
    images: ["/share.png"],
  },
  icons: {
    icon: [
      { url: "/icon-t.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon-t.png",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags -- Self-hosted font CSS is versioned under /public/fonts for offline/domestic access. */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="studio-brand" href="/">
                <span className="studio-mark" aria-hidden="true">
                  <span className="studio-mark-w">W</span>
                  <span className="studio-mark-dot">.</span>
                </span>
                <span>WithMedia.与众</span>
              </Link>
              <Link className="product-brand" href="/">
                <strong>Trending Today</strong>
                <span>每日选题参考</span>
              </Link>
              <nav className="nav" aria-label="Primary">
                <Link href="/">首页</Link>
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
