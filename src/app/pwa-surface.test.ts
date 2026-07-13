/**
 * input: PWA metadata, manifest, worker, offline shell, and app surface tokens
 * output: regression checks that keep the installed system surface aligned with the page
 * pos: static cross-file contract test for the App Router PWA shell
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const APP_SURFACE = "#ffffff";
const MANIFEST_VERSION = "20260713-3";
const WORKER_VERSION = "memedaily-v5";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("installed PWA surface contract", () => {
  it("uses one pure-white color across page and installed-shell metadata", () => {
    const layout = read("src/app/layout.tsx");
    const styles = read("src/app/globals.css");
    const offline = read("public/offline.html");
    const manifest = JSON.parse(read("public/manifest.webmanifest")) as {
      background_color: string;
      theme_color: string;
    };

    expect(styles).toContain(`--app: ${APP_SURFACE};`);
    expect(layout).toContain(`themeColor: "${APP_SURFACE}"`);
    expect(offline).toContain(`name="theme-color" content="${APP_SURFACE}"`);
    expect(offline).toContain(`background: ${APP_SURFACE}`);
    expect(manifest.background_color).toBe(APP_SURFACE);
    expect(manifest.theme_color).toBe(APP_SURFACE);
  });

  it("retains viewport containment and refreshes installed metadata", () => {
    const layout = read("src/app/layout.tsx");
    const worker = read("public/sw.js");

    expect(layout).toContain('viewportFit: "contain"');
    expect(layout).toContain(`manifest.webmanifest?v=${MANIFEST_VERSION}`);
    expect(worker).toContain(`CACHE_VERSION = "${WORKER_VERSION}"`);
  });
});
