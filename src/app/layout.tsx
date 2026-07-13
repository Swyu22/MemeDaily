/**
 * input: static route children, deployment base path, and public app assets
 * output: accessible root shell, metadata, nonblocking fonts, and PWA registration
 * pos: top-level App Router layout shared by every static page
 */
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import "./responsive.css";

// 子路径前缀（见 next.config.mjs）。根域名时为 ""，github.io 子路径时为 "/MemeDaily"。
// metadata.icons / openGraph.images 不会被 basePath 自动加前缀，需手动拼。
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Inline boot script — runs even when the hashed CSS/JS chunks 404 (the EXACT unstyled
// scenario: a stale cached HTML references purged hashes, so the CSS 404s -> no styles, and
// the JS chunks 404 too -> React never hydrates, so NO component code runs). Being inline in
// <head>, this is the only code guaranteed to execute. It:
//  (1) Self-heals an unstyled render: if the layout-critical /_next/static CSS link failed
//      (sheet===null), reload with a unique cache-buster to fetch FRESH HTML referencing the
//      current asset hashes. Bounded (<=2 tries / 60s) so it can ride out brief CDN edge
//      staleness yet can never loop; the _r marker is scrubbed once a styled load succeeds.
//  (2) Refreshes a stale bfcache restore (window.load doesn't fire on bfcache; pageshow does).
//  (3) Registers the network-first service worker (re-armed even after iOS evicts it) — done
//      here, not in React, so it survives a stale load's JS-chunk 404s.
const BOOT = `(function(){
  var BP=${JSON.stringify(BP)},RK="md-rescue-v1",fontScheduled=false;
  function fonts(){var f=document.getElementById("self-hosted-fonts");if(f)f.media="all";}
  function scheduleFonts(){if(fontScheduled)return;fontScheduled=true;var run=function(){fonts();};if("requestIdleCallback" in window){requestIdleCallback(run,{timeout:1500});}else{setTimeout(run,0);}}
  addEventListener("load",scheduleFonts);
  function broken(){try{var ls=document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/"]');if(!ls.length)return false;for(var i=0;i<ls.length;i++){var s=ls[i].sheet;if(!s||s.cssRules.length===0)return true;}return false;}catch(e){return false;}}
  function clean(){try{sessionStorage.removeItem(RK);}catch(e){}if(location.search.indexOf("_r=")>-1){try{var c=new URL(location.href);c.searchParams.delete("_r");history.replaceState(null,"",c.pathname+(c.search||"")+c.hash);}catch(e){}}}
  function rescue(){
    if(!broken()){clean();return;}
    var n=0,t=0;try{var s=JSON.parse(sessionStorage.getItem(RK)||"{}");n=s.n||0;t=s.t||0;}catch(e){}
    var now=Date.now();if(t&&now-t>60000){n=0;t=0;}if(n>=2)return;
    try{sessionStorage.setItem(RK,JSON.stringify({n:n+1,t:t||now}));}catch(e){}
    try{var u=new URL(location.href);u.searchParams.set("_r",String(now));location.replace(u.toString());}catch(e){location.reload();}
  }
  addEventListener("load",rescue);
  addEventListener("pageshow",function(e){
    if(!e.persisted)return;
    if(broken()){rescue();return;}
    try{var nv=performance.getEntriesByType("navigation")[0];var age=nv?Date.now()-(performance.timeOrigin+nv.responseEnd):Infinity;if(age>1800000)location.reload();}catch(e){}
  });
  if("serviceWorker" in navigator){addEventListener("load",function(){
    navigator.serviceWorker.register(BP+"/sw.js",{scope:BP+"/"}).then(function(r){
      if(r.waiting&&navigator.serviceWorker.controller)r.waiting.postMessage("SKIP_WAITING");
      r.addEventListener("updatefound",function(){var w=r.installing;if(!w)return;w.addEventListener("statechange",function(){if(w.state==="installed"&&navigator.serviceWorker.controller)w.postMessage("SKIP_WAITING");});});
      r.update().catch(function(){});
    }).catch(function(){});
  });}
})();`;

// 分享卡片描述：一行留空 + 单行文案。
const SHARE_DESC = "\n🔥 今日全网热点速递";

export const metadata: Metadata = {
  // 备案通过后回挂根域名 memedaily.fun (basePath=""). BP-prefixed image/icon paths (BP="")
  // resolve against metadataBase to https://memedaily.fun/... . If ever detached again, point
  // metadataBase + openGraph.url back at the live github.io origin (see .cloud.md runbook).
  metadataBase: new URL("https://memedaily.fun"),
  title: "热梗日报",
  description: SHARE_DESC,
  openGraph: {
    type: "website",
    url: `https://memedaily.fun${BP}/`,
    siteName: "热梗日报",
    title: "热梗日报",
    description: SHARE_DESC,
    images: [{ url: `${BP}/share.png`, width: 1200, height: 1200, alt: "热梗日报" }],
  },
  twitter: {
    card: "summary",
    title: "热梗日报",
    description: SHARE_DESC,
    images: [`${BP}/share.png`],
  },
  // PWA: 「添加到主屏幕」用高清图标（Android 走 manifest 的 192/512 + maskable；iOS 走 apple-icon 180）。
  manifest: `${BP}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "热梗日报",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: `${BP}/favicon.ico`, sizes: "any" },
      { url: `${BP}/icon-192.png`, type: "image/png", sizes: "192x192" },
      { url: `${BP}/icon-512.png`, type: "image/png", sizes: "512x512" },
    ],
    apple: { url: `${BP}/apple-icon-t.png`, sizes: "180x180" },
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#fafafa", // 与站点近白顶栏一致，避免主屏 PWA/浏览器地址栏出现突兀色块
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Boot/rescue script — inline & first so it runs even if hashed CSS/JS chunks 404. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {/* Use the system fallback for first paint; BOOT enables self-hosted fonts when the page is idle. */}
        <link id="self-hosted-fonts" rel="stylesheet" href={`${BP}/fonts/fonts.css`} media="print" />
        <noscript><link rel="stylesheet" href={`${BP}/fonts/fonts.css`} /></noscript>
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="studio-brand" href="/">
                {/* WithMedia monogram — same asset/style as www.withoa.cn (logo-mark.svg). */}
                <svg className="studio-mark" width="36" height="36" viewBox="0 0 112 112" fill="none" aria-hidden="true">
                  <rect width="112" height="112" rx="24" fill="#FFD000" />
                  <text x="54" y="56" dy="0.34em" textAnchor="middle" fontFamily="'Space Grotesk', 'Noto Sans SC', sans-serif" fontSize="56" fontWeight="700" fill="#18181B">W</text>
                  <circle cx="85" cy="72" r="6.5" fill="#18181B" />
                </svg>
                <span>
                  WithMedia.<span className="wm-cjk">与众</span>
                </span>
              </Link>
              <Link className="product-brand" href="/">
                <strong>Trending Today</strong>
                <span>每日热点选题</span>
              </Link>
              <nav className="nav" aria-label="Primary">
                <Link href="/">首页</Link>
                <Link href="/archive/">梗库</Link>
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <a
              href="https://beian.miit.gov.cn/#/Integrated/index"
              target="_blank"
              rel="noreferrer noopener"
            >
              粤ICP备16102279号
            </a>
            <span>Copyright © 2011-2026 深圳市与众文化传播有限公司 版权所有</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
