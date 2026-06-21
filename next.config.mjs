/** @type {import('next').NextConfig} */
// TEMP (ICP 备案期间): 站点临时托管在 GitHub Pages 项目子路径 /MemeDaily 下，
// 资源是根路径引用，必须加 basePath 才能在子路径下正确加载。
// 接回根域名 memedaily.fun 时：把 basePath 改回 "" 即可（layout 的图标/字体路径都从它派生）。
const basePath = "/MemeDaily";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
