import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// 子路径前缀（见 next.config.mjs）。根域名时为 ""，github.io 子路径时为 "/MemeDaily"。
// metadata.icons / openGraph.images 不会被 basePath 自动加前缀，需手动拼。
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://memedaily.fun"),
  title: "热梗日报",
  description: "🔥每日中文网络热梗精选",
  openGraph: {
    type: "website",
    url: "https://memedaily.fun",
    siteName: "热梗日报",
    title: "热梗日报",
    description: "🔥每日中文网络热梗精选",
    images: [{ url: `${BP}/share.png`, width: 1200, height: 1200, alt: "热梗日报" }],
  },
  twitter: {
    card: "summary",
    title: "热梗日报",
    description: "🔥每日中文网络热梗精选",
    images: [`${BP}/share.png`],
  },
  icons: {
    icon: [
      { url: `${BP}/icon-t.png`, type: "image/png" },
      { url: `${BP}/favicon.ico`, sizes: "any" },
    ],
    apple: `${BP}/apple-icon-t.png`,
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
        {/* 自托管字体 CSS（/public/fonts），按 basePath 加前缀以适配子路径托管。 */}
        <link rel="stylesheet" href={`${BP}/fonts/fonts.css`} />
      </head>
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="studio-brand" href="/">
                {/* WithMedia monogram — same asset/style as www.withoa.cn (logo-mark.svg). */}
                <svg className="studio-mark" width="29" height="29" viewBox="0 0 112 112" fill="none" role="img" aria-label="WithMedia">
                  <rect width="112" height="112" rx="24" fill="#FFD000" />
                  <text x="54" y="56" dy="0.34em" textAnchor="middle" fontFamily="'Space Grotesk', 'Noto Sans SC', sans-serif" fontSize="56" fontWeight="700" letterSpacing="-2" fill="#18181B">W</text>
                  <circle cx="85" cy="72" r="6.5" fill="#18181B" />
                </svg>
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
