/**
 * input: current root-domain or GitHub Pages project-subpath deployment choice
 * output: deterministic static export with inline application CSS
 * pos: Next.js build and hosting contract
 * @type {import('next').NextConfig}
 */
// 备案已通过 (2026-06-29)，站点回挂根域名 memedaily.fun，资源走根路径，basePath="".
// 若再次脱离到 GitHub Pages 子路径，只需把 basePath 改回 "/MemeDaily"，并同步
// layout.tsx 的 metadataBase/openGraph.url，并移除 public/CNAME（sw.js、manifest 和字体路径自适配）。
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
