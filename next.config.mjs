/** @type {import('next').NextConfig} */
// 备案已通过 (2026-06-29)，站点回挂根域名 memedaily.fun，资源走根路径，basePath="".
// 若再次脱离到 GitHub Pages 子路径，把 basePath 改回 "/MemeDaily"，并同步 public/sw.js 的
// SCOPE_PATH/STATIC_PREFIX/FONTS_PREFIX 与 layout.tsx 的 metadataBase/openGraph.url（见 .cloud.md runbook）。
const basePath = "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  // Inline the app CSS into each page's <head> as a <style> block (instead of a separate
  // /_next/static/*.css <link>). The stylesheet then ships AS PART OF the network-first HTML,
  // so it can never independently fail to load on a flaky mobile connection — fixing the
  // intermittent "CSS 加载不上" / unstyled-page reports. The CSS is ~12KB (≈3KB gzipped) so the
  // per-page inline cost is negligible. (fonts.css stays a separate link — a font miss only
  // degrades to fallback fonts, never an unstyled layout.)
  experimental: {
    inlineCss: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
