/**
 * input: root layout, global CSS, web app manifest, offline shell, and service worker text
 * output: regression assertions for an opaque light installed-app surface on iOS
 * pos: static PWA chrome/surface contract test
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function assertStableLaunchColor() {
  const manifest = JSON.parse(read("public/manifest.webmanifest")) as Record<string, unknown>;
  const layout = read("src/app/layout.tsx");

  expect(manifest).toMatchObject({
    id: "./",
    start_url: "./",
    scope: "./",
    background_color: "#fafafa",
    theme_color: "#fafafa",
  });
  expect(layout).toContain('colorScheme: "only light"');
  expect(layout.match(/prefers-color-scheme: (?:light|dark)/g)).toHaveLength(2);
  expect(layout).not.toContain("viewportFit");
}

function assertOpaqueRootAndHeader() {
  const layout = read("src/app/layout.tsx");
  const css = read("src/app/globals.css");
  const rootPaint = layout.indexOf("__html: ROOT_SURFACE");
  const boot = layout.indexOf("__html: BOOT");
  const topbar = css.match(/\.topbar\s*\{[^}]+\}/)?.[0] ?? "";

  expect(rootPaint).toBeGreaterThan(-1);
  expect(rootPaint).toBeLessThan(boot);
  expect(css).toMatch(/html\s*\{[^}]*background-color:\s*var\(--app\)/s);
  expect(css).toMatch(/color-scheme:\s*only light/);
  expect(topbar).toContain("background-color: var(--app)");
  expect(topbar).toContain("backdrop-filter: none");
  expect(topbar).not.toMatch(/rgba|blur\(/);
}

function assertOfflineGeneration() {
  const offline = read("public/offline.html");
  const worker = read("public/sw.js");

  expect(offline).toContain('name="color-scheme" content="only light"');
  expect(offline).toContain("html, body { min-height: 100%; background: #fafafa;");
  expect(worker).toContain('const CACHE_VERSION = "memedaily-v3"');
}

describe("installed PWA surface", () => {
  it("uses one stable light color for launch and app chrome", assertStableLaunchColor);
  it("paints the root before boot and keeps the sticky header opaque", assertOpaqueRootAndHeader);
  it("keeps the offline shell and cache generation aligned", assertOfflineGeneration);
});
